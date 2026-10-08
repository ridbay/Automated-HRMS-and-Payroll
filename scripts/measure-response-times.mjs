/**
 * Response-time measurement for Chapter 4, Table 4.3 / Figure 4.2.
 *
 * Run against the DEPLOYED Worker (not `wrangler dev` — local emulation does
 * not reproduce edge cold starts):
 *
 *   node scripts/measure-response-times.mjs
 *
 * What it does
 *   1. Registers a throwaway benchmark company and seeds it with 50 active,
 *      payroll-ready employees via `wrangler d1 execute --remote`. Seeding goes
 *      through SQL rather than POST /admin/employees because that route sends a
 *      welcome email per employee. Real tenants are never touched.
 *   2. For each of the ten operations: waits IDLE_MINUTES so the Worker's
 *      isolates can be evicted, takes one cold sample, then WARM_SAMPLES warm
 *      samples. Write operations are undone (clock-out, reject the payroll run)
 *      after each timed call so they can be repeated; the undo is not timed.
 *   3. Prints Table 4.3 as markdown and writes raw samples to
 *      scripts/results/ for Figure 4.2.
 *
 * Cold-start verification: the Worker sets X-Isolate-Request (1 = first
 * request this isolate has served). A cold sample that did not land on a
 * fresh isolate is retried up to COLD_ATTEMPTS times, and flagged with * in
 * the table if it never does. Requires the instrumented build of
 * api/src/index.ts to be deployed.
 *
 * Expect roughly IDLE_MINUTES x 10 minutes of runtime (about an hour at the
 * defaults).
 */

import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------- Configuration ----------------
const BASE_URL = process.env.BASE_URL || 'https://zenhr-api.balogunridwan.workers.dev';
const D1_DATABASE = process.env.D1_DATABASE || 'zenhr-prod-db';
// D1_LOCAL=1 seeds the local D1 instead, for smoke-testing against `wrangler dev`.
const D1_TARGET = process.env.D1_LOCAL === '1' ? '--local' : '--remote';
const EMPLOYEE_COUNT = Number(process.env.EMPLOYEE_COUNT || 50);
const IDLE_MINUTES = Number(process.env.IDLE_MINUTES || 5);
const COLD_ATTEMPTS = Number(process.env.COLD_ATTEMPTS || 3);
const WARM_SAMPLES = Number(process.env.WARM_SAMPLES || 20);
const AI_WARM_SAMPLES = Number(process.env.AI_WARM_SAMPLES || 10);
// ONLY=6 or ONLY=6,9 re-measures just those operations (1-based, Table 4.3 order).
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
// /auth/login allows 20 attempts per minute per IP.
const LOGIN_GAP_MS = 3500;
// A stalled connection would otherwise hang the run indefinitely.
const REQUEST_TIMEOUT_MS = 60_000;

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = join(here, '..', 'api');
const resultsDir = join(here, 'results');
const runTag = new Date().toISOString().replace(/[:.]/g, '-');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- Timed HTTP ----------------
// node:http(s) instead of fetch so connection setup (DNS + TCP + TLS) can be
// separated from request-to-response time.
const lib = BASE_URL.startsWith('https') ? https : http;
let warmAgent = new lib.Agent({ keepAlive: true, maxSockets: 1 });

function request(method, path, { token, body, agent = warmAgent } = {}) {
  const url = new URL(path, BASE_URL);
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const headers = { Accept: 'application/json' };
  if (payload) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    let connectedAt = null;
    const req = lib.request(url, { method, headers, agent }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const end = performance.now();
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch { /* non-JSON body, e.g. /health */ }
        const serverTiming = /app;dur=(\d+)/.exec(res.headers['server-timing'] || '');
        resolve({
          status: res.statusCode,
          totalMs: end - t0,
          connectMs: connectedAt === null ? 0 : connectedAt - t0,
          serverMs: serverTiming ? Number(serverTiming[1]) : null,
          isolateRequest: res.headers['x-isolate-request'] ? Number(res.headers['x-isolate-request']) : null,
          json,
        });
      });
    });
    req.on('socket', (socket) => {
      // A reused keep-alive socket is already connected; nothing to time.
      if (socket.connecting === false && !socket.pending) return;
      socket.once(lib === https ? 'secureConnect' : 'connect', () => { connectedAt = performance.now(); });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error(`no response after ${REQUEST_TIMEOUT_MS / 1000}s`)));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const expectOk = (res, what) => {
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`${what} failed: HTTP ${res.status} ${JSON.stringify(res.json)}`);
  }
  return res.json;
};

// Wrangler sometimes keeps running after `d1 execute` has finished, so resolve
// on its success marker rather than waiting for the process to exit.
function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['wrangler', ...args], { cwd: apiDir, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    let output = '';
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { process.kill(-child.pid); } catch { /* already exited */ }
      err ? reject(err) : resolve(output);
    };
    const onData = (chunk) => {
      output += chunk;
      if (/"success":\s*true/.test(output)) finish();
      else if (/\[ERROR\]|✘/.test(output)) setTimeout(() => finish(new Error(`wrangler failed:\n${output}`)), 500);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => finish(code === 0 ? null : new Error(`wrangler exited ${code}:\n${output}`)));
    const timer = setTimeout(() => finish(new Error(`wrangler timed out:\n${output}`)), 180_000);
  });
}

// ---------------- Benchmark tenant ----------------
const FIRST_NAMES = ['Adaeze', 'Babatunde', 'Chinedu', 'Damilola', 'Emeka', 'Funmilayo', 'Gbenga', 'Halima', 'Ifeoma', 'Jide', 'Kelechi', 'Lola', 'Musa', 'Ngozi', 'Olumide', 'Precious', 'Rukayat', 'Segun', 'Temitope', 'Uche', 'Yetunde', 'Zainab', 'Abubakar', 'Bisola', 'Chiamaka'];
const LAST_NAMES = ['Okafor', 'Adeyemi', 'Bello', 'Eze', 'Ogunleye', 'Ibrahim', 'Nwosu', 'Balogun', 'Okonkwo', 'Afolabi', 'Danjuma', 'Olawale', 'Uzor', 'Lawal', 'Obi'];
const DEPARTMENTS = ['Finance', 'Operations', 'Engineering', 'Sales', 'Human Resources'];
const BANKS = ['Access Bank', 'GTBank', 'Zenith Bank', 'First Bank', 'UBA'];

const sqlStr = (v) => (v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

async function setUpTenant() {
  const stamp = Date.now().toString(36);
  const email = `bench-${stamp}@zenhr-benchmark.invalid`;
  const password = `Bench-${stamp}-Pw!`;

  const reg = expectOk(await request('POST', '/auth/register', {
    body: {
      companyName: `Benchmark Ltd ${stamp}`,
      industry: 'Benchmark',
      adminFirstName: 'Bench',
      adminLastName: 'Admin',
      adminEmail: email,
      adminPassword: password,
    },
  }), 'Register benchmark company');

  const companyId = reg.employee.companyId;
  const adminId = reg.employee.id;
  const statements = [];

  // The admin is employee 1 of EMPLOYEE_COUNT and the manager of everyone else.
  statements.push(`UPDATE employees SET salary = 9600000, hire_date = '2023-01-09', bank_name = 'GTBank', account_number = '0123456789', account_name = 'Bench Admin', tin = 'TIN-BENCH-0', pfa = 'Stanbic IBTC Pension', pension_id = 'PEN-BENCH-0', nin = '10000000000', tax_state = 'Lagos' WHERE id = ${sqlStr(adminId)};`);

  const employeeIds = [];
  for (let i = 1; i < EMPLOYEE_COUNT; i++) {
    const id = `EMP-BN${stamp.toUpperCase()}${String(i).padStart(3, '0')}`;
    employeeIds.push(id);
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const salary = 1800000 + ((i * 373) % 40) * 300000; // ₦1.8m – ₦13.5m a year
    statements.push(
      `INSERT INTO employees (id, company_id, name, last_name, email, role, department, employment_type, status, salary, hire_date, manager_id, manager_name, bank_name, account_number, account_name, tin, pfa, pension_id, nin, tax_state, is_password_changed) VALUES (${[
        id, companyId, first, last, `${id.toLowerCase()}@zenhr-benchmark.invalid`, 'EMPLOYEE',
        DEPARTMENTS[i % DEPARTMENTS.length], 'Full-time', 'active', salary, '2024-02-05', adminId, 'Bench Admin',
        BANKS[i % BANKS.length], String(1000000000 + i), `${first} ${last}`, `TIN-BENCH-${i}`,
        'ARM Pension', `PEN-BENCH-${i}`, String(10000000000 + i), 'Lagos',
      ].map(sqlStr).join(', ')}, 1);`
    );
  }

  // A realistic manager approvals queue: ten pending leave requests.
  for (let i = 0; i < 10; i++) {
    const day = String(10 + i).padStart(2, '0');
    statements.push(
      `INSERT INTO leave_requests (id, company_id, employee_id, type, start_date, end_date, days, reason, status, applied_on) VALUES (${[
        `LR-BN${stamp.toUpperCase()}${i}`, companyId, employeeIds[i], 'Annual', `2027-03-${day}`, `2027-03-${day}`, 1,
        'Benchmark seed request', 'pending', new Date().toISOString().slice(0, 10),
      ].map(sqlStr).join(', ')});`
    );
  }

  mkdirSync(resultsDir, { recursive: true });
  const seedFile = join(resultsDir, `seed-${runTag}.sql`);
  writeFileSync(seedFile, statements.join('\n') + '\n');
  console.log(`Seeding ${EMPLOYEE_COUNT} employees into ${companyId} via wrangler (${D1_TARGET} D1)...`);
  await runWrangler(['d1', 'execute', D1_DATABASE, D1_TARGET, '--yes', `--file=${seedFile}`]);

  return { companyId, adminId, email, password, token: reg.token, sampleEmployeeId: employeeIds[0] };
}

// ---------------- Operations (Table 4.3 rows) ----------------
function buildOperations(t) {
  const now = new Date();
  const period = { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() };
  const auth = { token: t.token };
  let leaveOffset = 0;

  return [
    {
      name: 'Authenticate and issue token',
      category: 'Interactive (authentication)',
      gapMs: LOGIN_GAP_MS,
      run: (opts) => request('POST', '/auth/login', { ...opts, body: { email: t.email, password: t.password } }),
    },
    {
      name: `Retrieve employee directory (${EMPLOYEE_COUNT} records)`,
      category: 'Interactive read',
      run: (opts) => request('GET', '/admin/employees', { ...opts, ...auth }),
    },
    {
      name: 'Retrieve single employee profile',
      category: 'Interactive read',
      run: (opts) => request('GET', `/admin/employees/${t.sampleEmployeeId}`, { ...opts, ...auth }),
    },
    {
      name: 'Retrieve own leave balance',
      category: 'Interactive read',
      run: (opts) => request('GET', '/employee/leave/me', { ...opts, ...auth }),
    },
    {
      name: 'Submit leave request',
      category: 'Interactive write',
      run: (opts) => {
        // A fresh future date each time so requests never overlap.
        const d = new Date(Date.UTC(2027, 5, 1 + leaveOffset++)).toISOString().slice(0, 10);
        return request('POST', '/employee/leave/apply', {
          ...opts, ...auth,
          body: { type: 'Annual', startDate: d, endDate: d, days: 1, reason: 'Benchmark sample' },
        });
      },
    },
    {
      name: 'Record attendance clock-in',
      category: 'Interactive write',
      run: (opts) => request('POST', '/employee/attendance/clock-in', {
        ...opts, ...auth, body: { location: 'Lagos office', latitude: 6.5244, longitude: 3.3792 },
      }),
      undo: () => request('POST', '/employee/attendance/clock-out', { ...auth, body: {} }),
    },
    {
      name: 'Retrieve manager pending-approvals queue',
      category: 'Interactive read',
      run: (opts) => request('GET', '/employee/leave/team-requests', { ...opts, ...auth }),
    },
    {
      name: `Preview payroll run (${EMPLOYEE_COUNT} employees)`,
      category: 'Batch computation',
      run: (opts) => request('GET', `/admin/payroll/preview?month=${period.periodMonth}&year=${period.periodYear}`, { ...opts, ...auth }),
    },
    {
      name: `Submit payroll run (${EMPLOYEE_COUNT} employees)`,
      category: 'Batch computation',
      run: (opts) => request('POST', '/admin/payroll/runs', { ...opts, ...auth, body: period }),
      undo: (res) => res.json?.data?.id
        ? request('POST', `/admin/payroll/runs/${res.json.data.id}/reject`, { ...auth, body: { reason: 'Benchmark sample' } })
        : null,
    },
    {
      name: 'Assistant query (single tool call)',
      category: 'Interactive read (AI)',
      warmSamples: AI_WARM_SAMPLES,
      run: (opts) => request('POST', '/ai/ask', { ...opts, ...auth, body: { question: 'How many employees does the company currently have?' } }),
    },
  ];
}

// ---------------- Statistics ----------------
// Linear interpolation between closest ranks.
function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// Network failures become a recorded sample error instead of ending the run.
async function attempt(fn) {
  try {
    return await fn();
  } catch (err) {
    return { status: 0, error: err.message, totalMs: null, connectMs: null, serverMs: null, isolateRequest: null, json: null };
  }
}

const describeFailure = (res) => (res.status === 0 ? `network: ${res.error}` : `HTTP ${res.status} ${JSON.stringify(res.json)?.slice(0, 160)}`);

const fmt = (v) => (v === null || v === undefined ? '—' : String(Math.round(v)));

async function idle(minutes) {
  const end = Date.now() + minutes * 60_000;
  while (Date.now() < end) {
    process.stdout.write(`   idle ${Math.ceil((end - Date.now()) / 1000)}s   \r`);
    await sleep(Math.min(5000, end - Date.now()));
  }
  process.stdout.write('                    \r');
}

// ---------------- Main ----------------
async function main() {
  console.log(`Target: ${BASE_URL}`);
  console.log(`Idle ${IDLE_MINUTES} min before each cold sample, ${WARM_SAMPLES} warm samples per operation\n`);

  const health = await request('GET', '/health');
  if (health.status !== 200) throw new Error(`Health check failed: HTTP ${health.status}`);
  if (health.isolateRequest === null) {
    console.warn('WARNING: X-Isolate-Request header missing. Deploy the instrumented api/src/index.ts');
    console.warn('         first, otherwise cold samples cannot be verified as cold.\n');
  }

  const tenant = await setUpTenant();
  console.log(`Benchmark tenant ${tenant.companyId} ready.\n`);

  // Payroll settings, components and tax bands are seeded lazily on first
  // read; trigger that now so it is not timed as part of a sample.
  expectOk(await request('GET', '/admin/payroll/preview', { token: tenant.token }), 'Payroll warm-up');
  expectOk(await request('GET', '/employee/leave/me', { token: tenant.token }), 'Leave warm-up');

  const operations = buildOperations(tenant);
  const results = [];

  for (const [i, op] of operations.entries()) {
    if (ONLY && !ONLY.includes(i + 1)) continue;
    console.log(`[${i + 1}/${operations.length}] ${op.name}`);
    const errors = [];

    // Cold sample: idle, then a brand-new connection.
    let cold = null;
    for (let n = 1; n <= COLD_ATTEMPTS; n++) {
      await idle(IDLE_MINUTES);
      const res = await attempt(() => op.run({ agent: new lib.Agent({ keepAlive: false }) }));
      if (op.undo) await attempt(() => op.undo(res));
      if (res.status === 0 || res.status >= 400) {
        errors.push(`cold attempt ${n}: ${describeFailure(res)}`);
        console.log(`   cold  attempt ${n} failed: ${describeFailure(res)}`);
        continue;
      }
      cold = { ...res, attempt: n, verified: res.isolateRequest === 1 };
      console.log(`   cold  ${fmt(res.totalMs)} ms (connect ${fmt(res.connectMs)}, server ${fmt(res.serverMs)}, isolate request #${res.isolateRequest ?? '?'})`);
      if (cold.verified || res.isolateRequest === null) break;
    }
    cold ??= { totalMs: null, connectMs: null, serverMs: null, isolateRequest: null, verified: false };

    // Warm samples on a kept-alive connection.
    warmAgent = new lib.Agent({ keepAlive: true, maxSockets: 1 });
    await attempt(() => request('GET', '/health')); // opens the connection; not recorded
    const warm = [];
    for (let s = 0; s < (op.warmSamples ?? WARM_SAMPLES); s++) {
      if (op.gapMs) await sleep(op.gapMs);
      const res = await attempt(() => op.run({}));
      if (res.status === 0 || res.status >= 400) errors.push(`warm ${s + 1}: ${describeFailure(res)}`);
      else warm.push(res);
      if (op.undo) await attempt(() => op.undo(res));
    }
    const warmTotals = warm.map((r) => r.totalMs);
    const warmServer = warm.map((r) => r.serverMs).filter((v) => v !== null);
    const row = {
      operation: op.name,
      category: op.category,
      coldMs: cold.totalMs,
      coldConnectMs: cold.connectMs,
      coldServerMs: cold.serverMs,
      coldVerified: cold.verified,
      coldIsolateRequest: cold.isolateRequest,
      warmP50: percentile(warmTotals, 50),
      warmP95: percentile(warmTotals, 95),
      warmServerP50: percentile(warmServer, 50),
      warmN: warm.length,
      warmFreshIsolates: warm.filter((r) => r.isolateRequest === 1).length,
      toolsUsed: op.name.startsWith('Assistant') ? warm[0]?.json?.data?.toolsUsed : undefined,
      warmSamplesMs: warmTotals,
      errors,
    };
    results.push(row);
    console.log(`   warm  p50 ${fmt(row.warmP50)} ms, p95 ${fmt(row.warmP95)} ms (n=${row.warmN})`);
    for (const e of errors) console.log(`   ERROR ${e}`);
  }

  const jsonFile = join(resultsDir, `response-times-${runTag}.json`);
  writeFileSync(jsonFile, JSON.stringify({ baseUrl: BASE_URL, ranAt: new Date().toISOString(), employeeCount: EMPLOYEE_COUNT, idleMinutes: IDLE_MINUTES, companyId: tenant.companyId, results }, null, 2));

  console.log('\n\nTable 4.3: Response-time measurements for representative operations\n');
  console.log('| Operation | Category | Cold start (ms) | Warm p50 (ms) | Warm p95 (ms) | Sample size |');
  console.log('| :--- | :--- | ---: | ---: | ---: | :---: |');
  for (const r of results) {
    const flag = r.coldVerified || r.coldIsolateRequest === null ? '' : '*';
    console.log(`| ${r.operation} | ${r.category} | ${fmt(r.coldMs)}${flag} | ${fmt(r.warmP50)} | ${fmt(r.warmP95)} | 1 cold + ${r.warmN} warm |`);
  }
  if (results.some((r) => !r.coldVerified && r.coldIsolateRequest !== null)) {
    console.log('\n* Cold sample did not land on a fresh isolate after the idle period; treat as warm-path latency on a new connection.');
  }

  console.log('\nSupporting detail (not for the table; use in the Section 4.5.1 discussion)\n');
  console.log('| Operation | Cold: connection setup (ms) | Cold: in-Worker (ms) | Warm: in-Worker p50 (ms) | Fresh isolates among warm samples |');
  console.log('| :--- | ---: | ---: | ---: | :---: |');
  for (const r of results) {
    console.log(`| ${r.operation} | ${fmt(r.coldConnectMs)} | ${fmt(r.coldServerMs)} | ${fmt(r.warmServerP50)} | ${r.warmFreshIsolates}/${r.warmN} |`);
  }

  const assistant = results.find((r) => r.toolsUsed);
  if (assistant) console.log(`\nAssistant tools invoked: ${JSON.stringify(assistant.toolsUsed)}`);
  if (results.some((r) => r.errors.length)) console.log('\nSome samples returned errors; see above. Errored samples are excluded from p50/p95.');
  console.log(`\nRaw samples: ${jsonFile}`);
  console.log(`Benchmark tenant left in place: ${tenant.companyId} (delete it once the chapter is final).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

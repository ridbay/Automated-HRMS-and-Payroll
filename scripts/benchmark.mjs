/**
 * ZenHR Edge Performance Benchmark Script
 * 
 * Measures cold-start vs warm p50/p95 across 10 core operations.
 * Enforces a 90-second delay between endpoints to allow Cloudflare Worker isolates to evict.
 */

const BASE_URL = process.env.BASE_URL || 'https://zenhr-api.balogunridwan.workers.dev';
const EMAIL = process.env.EMAIL || 'admin@zenhr.com';
const PASSWORD = process.env.PASSWORD || 'Password123!';
const WARM_ITERATIONS = 5;
const EVICTION_WAIT_SEC = 90;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculatePercentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  if (lower === upper) return sorted[index];
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
};

async function timeRequest(fn) {
  const start = performance.now();
  const res = await fn();
  const duration = Math.round(performance.now() - start);
  return { res, duration };
}

async function run() {
  console.log(`\n=============================================================`);
  console.log(`🚀 Starting ZenHR Edge Benchmark against: ${BASE_URL}`);
  console.log(`⏱️  Eviction interval: ${EVICTION_WAIT_SEC}s between endpoints`);
  console.log(`🔄 Warm samples per endpoint: ${WARM_ITERATIONS}`);
  console.log(`=============================================================\n`);

  // Step 0: Obtain Auth Token for authenticated operations
  console.log(`[0/10] Authenticating as ${EMAIL}...`);
  let token = '';
  try {
    const authRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const authData = await authRes.json();
    token = authData.token || '';
    if (!token) console.warn('⚠️ No token returned. Unprotected fallback mode will be used.');
  } catch (err) {
    console.warn(`⚠️ Auth failed: ${err.message}. Proceeding with public/unauthenticated headers.`);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : { 'x-company-id': 'zenhr-default' }),
  };

  // 10 Key Operations covering ZenHR modules
  const operations = [
    { name: 'Health Check (/health)', fn: () => fetch(`${BASE_URL}/health`) },
    { name: 'Auth Login (/auth/login)', fn: () => fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) }) },
    { name: 'Admin Dashboard Stats (/admin/dashboard/stats)', fn: () => fetch(`${BASE_URL}/admin/dashboard/stats`, { headers: authHeaders }) },
    { name: 'Workforce Directory (/admin/employees)', fn: () => fetch(`${BASE_URL}/admin/employees`, { headers: authHeaders }) },
    { name: 'Payroll Run Summary (/admin/payroll/runs)', fn: () => fetch(`${BASE_URL}/admin/payroll/runs`, { headers: authHeaders }) },
    { name: 'Leave Requests (/admin/leave/requests)', fn: () => fetch(`${BASE_URL}/admin/leave/requests`, { headers: authHeaders }) },
    { name: 'Attendance Records (/admin/attendance/records)', fn: () => fetch(`${BASE_URL}/admin/attendance/records`, { headers: authHeaders }) },
    { name: 'Benefits Plans (/admin/benefits/plans)', fn: () => fetch(`${BASE_URL}/admin/benefits/plans`, { headers: authHeaders }) },
    { name: 'Recruitment Requisitions (/admin/requisitions)', fn: () => fetch(`${BASE_URL}/admin/requisitions`, { headers: authHeaders }) },
    { name: 'Course Catalog (/admin/learning/courses)', fn: () => fetch(`${BASE_URL}/admin/learning/courses`, { headers: authHeaders }) },
  ];

  const results = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    console.log(`\n[${i + 1}/${operations.length}] Testing: ${op.name}...`);

    // 1. Cold Start measurement
    const { duration: coldStart, res: coldRes } = await timeRequest(op.fn);
    const status = coldRes.status;
    console.log(`  ❄️  Cold start: ${coldStart} ms (HTTP ${status})`);

    // 2. Warm iterations
    const warmDurations = [];
    for (let w = 0; w < WARM_ITERATIONS; w++) {
      const { duration } = await timeRequest(op.fn);
      warmDurations.push(duration);
    }

    const p50 = calculatePercentile(warmDurations, 50);
    const p95 = calculatePercentile(warmDurations, 95);
    console.log(`  🔥 Warm p50: ${p50} ms | Warm p95: ${p95} ms`);

    results.push({
      operation: op.name,
      coldStart,
      warmP50: p50,
      warmP95: p95,
      status: status === 200 ? '✅ 200 OK' : `⚠️ ${status}`,
    });

    // 3. 90-second Isolate Eviction Delay (skip after last operation)
    if (i < operations.length - 1) {
      console.log(`  ⏳ Waiting ${EVICTION_WAIT_SEC}s for edge isolates to evict...`);
      for (let s = EVICTION_WAIT_SEC; s > 0; s -= 15) {
        process.stdout.write(`     ... ${s}s remaining\r`);
        await sleep(15000);
      }
      console.log(`     ... eviction window complete.`);
    }
  }

  // Finished Markdown Table Output
  console.log(`\n\n### ZenHR Edge Performance Metrics\n`);
  console.log(`| Operation | Cold Start (ms) | Warm p50 (ms) | Warm p95 (ms) | Status |`);
  console.log(`| :--- | :---: | :---: | :---: | :---: |`);
  for (const r of results) {
    console.log(`| ${r.operation} | ${r.coldStart} | ${r.warmP50} | ${r.warmP95} | ${r.status} |`);
  }
  console.log(`\n✅ Benchmark complete. Copy the markdown table above directly into your documentation.\n`);
}

run().catch(console.error);

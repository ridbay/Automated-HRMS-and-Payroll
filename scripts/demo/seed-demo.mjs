// Seeds a fictional demo company into the LOCAL dev environment for thesis screenshots
// (Figure 3.10 and the Chapter 4 figures). Never point this at production.
//
//   1. start the local API:  cd api && npx wrangler dev src/index.ts --port 8788
//   2. run:                  node scripts/demo/seed-demo.mjs
//
// Every demo user shares DEMO_PASSWORD. All names are fictional; emails use the
// reserved .example domain.

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL || 'http://127.0.0.1:8788';
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(API)) throw new Error('Refusing to seed a non-local API');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEMO_PASSWORD = 'DemoPass#2026';
const DOMAIN = 'ebonycrest.example';
const COMPANY = 'Ebony Crest Foods Ltd';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return data;
}

function d1(sql) {
  const dir = mkdtempSync(join(tmpdir(), 'zenhr-seed-'));
  const file = join(dir, 'seed.sql');
  writeFileSync(file, sql);
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'zenhr-prod-db', '--local', '--file', file], { cwd: join(ROOT, 'api'), stdio: 'pipe' });
}
const q = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const pad = n => String(n).padStart(2, '0');
const todayLagos = () => new Date(Date.now() + 3600e3).toISOString().slice(0, 10);   // WAT = UTC+1

async function main() {
  // ---- 1. Company and Super Administrator (through the real registration path) ----
  const adminEmail = `ngozi.adebayo@${DOMAIN}`;
  const reg = await api('POST', '/auth/register', { body: {
    companyName: COMPANY, industry: 'Food Manufacturing',
    adminFirstName: 'Ngozi', adminLastName: 'Adebayo', adminEmail, adminPassword: DEMO_PASSWORD,
  } });
  const companyId = reg.employee.companyId, adminId = reg.employee.id;
  console.log('company', companyId, 'admin', adminId);

  // ---- 2. Departments and people ----
  const depts = ['Administration', 'People & Culture', 'Finance', 'Operations', 'Sales', 'Engineering'];
  const deptId = Object.fromEntries(depts.map((d, i) => [d, `DEP-DEMO-${companyId.slice(5)}-${i}`]));
  const banks = ['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA', 'Stanbic IBTC'];
  const pfas = ['ARM Pension', 'Stanbic IBTC Pension', 'Leadway Pensure', 'Premium Pension'];

  // [key, first, last, role, department, salary, managerKey, hireDate]
  const people = [
    ['folake',  'Folake',  'Ogunleye', 'HR_ADMIN',        'People & Culture', 14400000, 'admin',  '2022-03-14'],
    ['emeka',   'Emeka',   'Nwankwo',  'PAYROLL_OFFICER', 'Finance',          10800000, 'admin',  '2022-08-01'],
    ['zainab',  'Zainab',  'Bello',    'RECRUITER',       'People & Culture',  8400000, 'folake', '2023-05-08'],
    ['tunde',   'Tunde',   'Okonkwo',  'MANAGER',         'Operations',       13200000, 'admin',  '2021-11-15'],
    ['amaka',   'Amaka',   'Eze',      'EMPLOYEE',        'Operations',        6600000, 'tunde',  '2023-09-04'],
    ['adebola', 'Adebola', 'Okafor',   'EMPLOYEE',        'Operations',        6000000, 'tunde',  '2024-01-15'],
    ['fatima',  'Fatima',  'Musa',     'EMPLOYEE',        'Operations',        5400000, 'tunde',  '2024-04-02'],
    ['kunle',   'Kunle',   'Adeyemi',  'EMPLOYEE',        'Operations',        7200000, 'tunde',  '2022-10-10'],
    ['ifeoma',  'Ifeoma',  'Nwosu',    'EMPLOYEE',        'Operations',        6000000, 'tunde',  '2024-06-17'],
    ['segun',   'Segun',   'Bakare',   'EMPLOYEE',        'Operations',        5100000, 'tunde',  '2025-02-03'],
    ['bisi',    'Bisi',    'Adekunle', 'EMPLOYEE',        'Sales',             7800000, 'admin',  '2023-02-20'],
    ['chinedu', 'Chinedu', 'Obi',      'EMPLOYEE',        'Engineering',      11400000, 'admin',  '2022-06-06'],
    ['halima',  'Halima',  'Yusuf',    'EMPLOYEE',        'Finance',           6900000, 'emeka',  '2024-08-12'],
    ['yemi',    'Yemi',    'Alade',    'EMPLOYEE',        'Sales',             6300000, 'bisi',   '2025-03-10'],
    ['obinna',  'Obinna',  'Eke',      'EMPLOYEE',        'Engineering',       9600000, 'chinedu','2023-11-27'],
    ['tolu',    'Tolu',    'Bankole',  'EMPLOYEE',        'Sales',             5700000, 'bisi',   '2025-05-19'],
    ['musa',    'Musa',    'Ibrahim',  'EMPLOYEE',        'Engineering',       8700000, 'chinedu','2024-02-26'],
    ['ngozi2',  'Chioma',  'Okeke',    'EMPLOYEE',        'Administration',    4800000, 'admin',  '2024-09-09'],
    ['tobi',    'Tobi',    'Bello',    'EMPLOYEE',        'Sales',             6000000, 'bisi',   '2023-07-03'],
    ['chidera', 'Chidera', 'Eze',      'EMPLOYEE',        'Engineering',       7800000, 'chinedu','2026-10-05'],
  ];
  const id = k => k === 'admin' ? adminId : `EMP-DEMO-${companyId.slice(5)}-${k.toUpperCase()}`;
  const nameOf = Object.fromEntries([['admin', 'Ngozi Adebayo'], ...people.map(p => [p[0], `${p[1]} ${p[2]}`])]);

  let sql = '';
  depts.forEach(d => { sql += `INSERT INTO departments (id, company_id, name, created_at) VALUES (${q(deptId[d])}, ${q(companyId)}, ${q(d)}, ${q(new Date().toISOString())});\n`; });
  sql += `UPDATE employees SET department_id = ${q(deptId['Administration'])}, salary = 18000000, hire_date = '2021-01-11', bank_name = 'GTBank', account_number = '0110000000', account_name = 'Ngozi Adebayo', tin = 'TIN-DEMO-00', pfa = 'ARM Pension', pension_id = 'PEN-DEMO-00', nin = '20000000000', tax_state = 'Lagos', phone = '+234 803 000 0000' WHERE id = ${q(adminId)};\n`;
  people.forEach(([k, first, last, role, dept, salary, mgr, hire], i) => {
    const n = i + 1;
    sql += `INSERT INTO employees (id, company_id, name, last_name, email, role, department, department_id, location, employment_type, status, salary, hire_date, manager_id, manager_name, bank_name, account_number, account_name, tin, pfa, pension_id, nin, tax_state, phone, password_hash, password_salt, is_password_changed) VALUES (`
      + [id(k), companyId, first, last, `${first}.${last}@${DOMAIN}`.toLowerCase(), role, dept, deptId[dept], 'Lagos', 'Full-time',
         k === 'chidera' ? 'onboarding' : 'active', salary, hire, id(mgr), nameOf[mgr], banks[n % banks.length],
         `01100000${pad(n)}`, `${first} ${last}`, `TIN-DEMO-${pad(n)}`, pfas[n % pfas.length], `PEN-DEMO-${pad(n)}`,
         `200000000${pad(n)}`, 'Lagos', `+234 803 000 00${pad(n)}`].map(q).join(', ')
      + `, (SELECT password_hash FROM employees WHERE id = ${q(adminId)}), (SELECT password_salt FROM employees WHERE id = ${q(adminId)}), 1);\n`;
  });

  // ---- 3. Activity: leave, overtime, attendance, performance, requisitions ----
  const today = todayLagos(), now = new Date().toISOString();
  const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const leave = (k, type, start, days, reason, status, applied) =>
    `INSERT INTO leave_requests (id, company_id, employee_id, type, start_date, end_date, days, reason, status, applied_on, manager_id) VALUES (${[`LV-DEMO-${k}-${start}`, companyId, id(k), type, start, addDays(start, days - 1), days, reason, status, applied, id('tunde')].map(q).join(', ')});\n`;
  sql += leave('adebola', 'Annual Leave', addDays(today, 7), 3, 'Family event in Enugu', 'pending', addDays(today, -1));
  sql += leave('segun', 'Sick Leave', addDays(today, 1), 1, 'Medical appointment', 'pending', today);
  sql += leave('amaka', 'Annual Leave', '2026-04-13', 4, 'Easter break', 'approved', '2026-03-30');
  sql += leave('amaka', 'Annual Leave', '2026-08-17', 2, 'Personal errands', 'approved', '2026-08-05');
  sql += leave('ifeoma', 'Annual Leave', addDays(today, -1), 3, 'Travel', 'approved', addDays(today, -14));

  sql += `INSERT INTO overtime_requests (id, company_id, employee_id, date, start_time, end_time, hours, reason, deliverable, status, manager_id) VALUES (${[`OT-DEMO-${companyId}`, companyId, id('fatima'), addDays(today, -1), '17:00', '21:00', 4, 'Month-end stock count', 'Reconciled warehouse count', 'pending', id('tunde')].map(q).join(', ')});\n`;

  // Attendance today: Lagos clock-in times, stored as UTC ISO strings (WAT = UTC+1)
  const att = (k, hhmm, status) => {
    const [h, m] = hhmm.split(':').map(Number);
    const iso = `${today}T${pad(h - 1)}:${pad(m)}:00.000Z`;
    return `INSERT INTO attendance_records (id, company_id, employee_id, date, clock_in, status, location_in, work_hours, overtime, latitude_in, longitude_in) VALUES (${[`ATT-DEMO-${k}-${today}`, companyId, id(k), today, iso, status, 'Ikeja, Lagos', 0, 0, 6.6018, 3.3515].map(q).join(', ')});\n`;
  };
  sql += att('amaka', '08:52', 'present') + att('tunde', '08:31', 'present') + att('adebola', '08:47', 'present')
       + att('fatima', '09:22', 'late') + att('kunle', '08:58', 'present') + att('segun', '08:40', 'present')
       + att('folake', '08:15', 'present') + att('emeka', '08:44', 'present') + att('bisi', '09:05', 'present');

  const cycleId = `CYC-DEMO-${companyId}`;
  sql += `INSERT INTO review_cycles (id, company_id, name, status, start_date, end_date, self_review_due_date, manager_review_due_date) VALUES (${[cycleId, companyId, 'Q3 2026 Review', 'active', '2026-09-15', '2026-10-31', '2026-10-10', '2026-10-24'].map(q).join(', ')});\n`;
  const stages = [
    ['kickoff', 'Kickoff', 0, '2026-09-15', '2026-09-20'],
    ['select_peers', 'Select Peer Reviewers', 1, '2026-09-20', '2026-09-25'],
    ['peer_approval', 'Manager Approves Peer Reviewers', 2, '2026-09-25', '2026-09-28'],
    ['self_review', 'Self-Review', 3, '2026-09-28', '2026-10-10'],
    ['peer_upward_review', 'Peer & Upward Reviews', 4, '2026-10-05', '2026-10-15'],
    ['manager_review', 'Manager Review', 5, '2026-10-10', '2026-10-24'],
    ['manager_review_release', 'Manager Reviews Available', 6, '2026-10-24', '2026-10-28'],
    ['final_submission', 'Review & Final Submission', 7, '2026-10-28', '2026-10-31'],
  ];
  stages.forEach(([k, nm, ord, s, d], idx) => {
    sql += `INSERT OR REPLACE INTO cycle_stages (id, company_id, cycle_id, key, name, "order", start_date, due_date) VALUES (${[`STG-DEMO-${companyId}-${idx}`, companyId, cycleId, k, nm, ord, s, d].map(q).join(', ')});\n`;
  });
  sql += `INSERT INTO assessments (id, company_id, employee_id, cycle_name, cycle_id, status, self_rating, self_comment, manager_id, submitted_at) VALUES (${[`ASM-DEMO-${companyId}`, companyId, id('kunle'), 'Q3 2026 Review', cycleId, 'submitted', '4', 'Delivered the new dispatch rota and cut loading delays.', id('tunde'), addDays(today, -2) + 'T10:00:00.000Z'].map(q).join(', ')});\n`;
  sql += `INSERT INTO peer_reviews (id, company_id, cycle_id, reviewee_id, reviewer_id, direction, status, nominated_by_id) VALUES (${[`PR-DEMO-${companyId}`, companyId, cycleId, id('ifeoma'), id('segun'), 'peer', 'nominated', id('ifeoma')].map(q).join(', ')});\n`;

  const reqs = [['Quality Assurance Officer', 'Operations', 'High', 12], ['Sales Executive, Abuja', 'Sales', 'Medium', 20], ['Backend Engineer', 'Engineering', 'High', 6]];
  reqs.forEach(([title, dept, pri, open], i) => {
    sql += `INSERT INTO job_requisitions (id, company_id, title, department, location, hiring_manager, priority, status, date_opened, target_hire_date, days_open, employment_type, description, is_publicly_listed) VALUES (${[`REQ-DEMO-${companyId}-${i}`, companyId, title, dept, dept === 'Sales' ? 'Abuja' : 'Lagos', i === 0 ? 'Tunde Okonkwo' : i === 1 ? 'Bisi Adekunle' : 'Chinedu Obi', pri, 'Open', addDays(today, -open), addDays(today, 30), open, 'Full-time', `Ebony Crest Foods is hiring a ${title}.`, 1].map(q).join(', ')});\n`;
  });
  // Initials avatars, so no screen falls back to stock photos of real people.
  sql += `UPDATE employees SET avatar = 'https://ui-avatars.com/api/?name=' || replace(name || ' ' || last_name, ' ', '+') || '&background=E0E7FF&color=4338CA&bold=true' WHERE company_id = ${q(companyId)} AND avatar IS NULL;\n`;
  d1(sql);
  console.log('seeded people and activity');

  // ---- 4. Through the API: transitions and a paid September payroll ----
  const adminTok = (await api('POST', '/auth/login', { body: { email: adminEmail, password: DEMO_PASSWORD } })).token;
  for (const [k, type] of [['chidera', 'Onboarding'], ['tobi', 'Offboarding']]) {
    try { await api('POST', '/admin/transitions', { token: adminTok, body: { employeeId: id(k), type, startDate: addDays(today, -3), targetDate: addDays(today, 14), reason: type === 'Offboarding' ? 'Resignation' : undefined } }); }
    catch (e) { console.warn('transition', k, e.message); }
  }
  try {
    await api('POST', '/admin/payroll/runs', { token: adminTok, body: { periodMonth: 9, periodYear: 2026, notes: 'September 2026 payroll' } });
    const runs = await api('GET', '/admin/payroll/runs', { token: adminTok });
    const run = (runs.data || runs).find(r => r.periodMonth === 9 && r.periodYear === 2026);
    await api('POST', `/admin/payroll/runs/${run.id}/approve`, { token: adminTok });
    await api('POST', `/admin/payroll/runs/${run.id}/mark-paid`, { token: adminTok });
    console.log('September 2026 payroll paid', run.id);
  } catch (e) { console.warn('payroll', e.message); }

  const users = { superAdmin: adminEmail, ...Object.fromEntries(people.filter(p => p[3] !== 'EMPLOYEE' || p[0] === 'amaka').map(p => [p[0], `${p[1]}.${p[2]}@${DOMAIN}`.toLowerCase()])) };
  writeFileSync(join(ROOT, 'scripts', 'demo', 'demo-users.json'), JSON.stringify({ companyId, password: DEMO_PASSWORD, users }, null, 2));
  console.log('wrote scripts/demo/demo-users.json');
}

main().catch(e => { console.error(e); process.exit(1); });

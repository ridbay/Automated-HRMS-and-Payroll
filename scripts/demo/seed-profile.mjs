// Adds profile detail for demo employee Amaka Eze (Figure 4.2): assets, two weeks of
// attendance history, and audit entries produced through the real HR update route.
// Run after seed-demo.mjs, against the LOCAL stack only.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'http://127.0.0.1:8788';
const demo = JSON.parse(readFileSync(join(ROOT, 'scripts/demo/demo-users.json'), 'utf8'));
const companyId = demo.companyId, amaka = `EMP-DEMO-${companyId.slice(5)}-AMAKA`;
const q = v => v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const call = async (method, path, token, body) => {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${await r.text()}`); return r.json();
};

const hr = (await call('POST', '/auth/login', null, { email: demo.users.folake, password: demo.password })).token;

// Assets through the real route
await call('POST', `/admin/employees/${amaka}/assets`, hr, { name: 'Dell Latitude 5440', category: 'Laptop', serialNumber: 'ECF-LT-0412', status: 'Assigned', condition: 'Good', purchaseDate: '2025-01-20', value: 1150000 });
await call('POST', `/admin/employees/${amaka}/assets`, hr, { name: 'Samsung Galaxy A35', category: 'Phone', serialNumber: 'ECF-PH-0187', status: 'Assigned', condition: 'Good', purchaseDate: '2025-03-04', value: 420000 });
await call('POST', `/admin/employees/${amaka}/assets`, hr, { name: 'Access card', category: 'Access Card', serialNumber: 'ECF-AC-0233', status: 'Assigned', condition: 'Good', purchaseDate: '2023-09-04', value: 5000 });

// Audit entries through the real update route
await call('PUT', `/admin/employees/${amaka}`, hr, { phone: '+234 803 555 0142' });
await call('PUT', `/admin/employees/${amaka}`, hr, { location: 'Ikeja, Lagos' });

// Attendance history: the previous 10 working days (Lagos times stored as UTC)
let sql = '', d = new Date(Date.now() + 3600e3), n = 0;
const times = [['08:41','17:12','present'],['08:55','17:30','present'],['09:21','17:45','late'],['08:37','17:05','present'],['08:50','17:20','present'],
               ['08:46','17:02','present'],['09:08','17:15','present'],['08:59','17:40','present'],['09:26','18:01','late'],['08:44','17:10','present']];
while (n < 10) {
  d.setUTCDate(d.getUTCDate() - 1);
  if ([0, 6].includes(d.getUTCDay())) continue;
  const day = d.toISOString().slice(0, 10), [tin, tout, st] = times[n];
  const iso = t => { const [h, m] = t.split(':').map(Number); return `${day}T${String(h - 1).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`; };
  const hrs = +(((+tout.slice(0, 2) * 60 + +tout.slice(3)) - (+tin.slice(0, 2) * 60 + +tin.slice(3))) / 60).toFixed(2);
  sql += `INSERT INTO attendance_records (id, company_id, employee_id, date, clock_in, clock_out, status, location_in, location_out, work_hours, overtime, latitude_in, longitude_in) VALUES (${[`ATT-DEMO-amaka-${day}`, companyId, amaka, day, iso(tin), iso(tout), st, 'Ikeja, Lagos', 'Ikeja, Lagos', hrs, Math.max(0, +(hrs - 8).toFixed(2)), 6.6018, 3.3515].map(q).join(', ')});\n`;
  n++;
}
const dir = mkdtempSync(join(tmpdir(), 'zenhr-seed-')); writeFileSync(join(dir, 's.sql'), sql);
execFileSync('npx', ['wrangler', 'd1', 'execute', 'zenhr-prod-db', '--local', '--file', join(dir, 's.sql')], { cwd: join(ROOT, 'api'), stdio: 'pipe' });
console.log('profile detail seeded for', amaka);

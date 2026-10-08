// Seeds a recruitment pipeline for Figure 4.6 through the real ATS API (LOCAL stack only):
// candidates at each stage, one interview scored by two interviewers, one sent offer and
// one accepted offer (which hires the candidate). Run after seed-demo.mjs.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'http://127.0.0.1:8788';
const demo = JSON.parse(readFileSync(join(ROOT, 'scripts/demo/demo-users.json'), 'utf8'));
const req = (i) => `REQ-DEMO-${demo.companyId}-${i}`;
const call = async (method, path, token, body) => {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${t}`);
  const j = JSON.parse(t); return j.data ?? j;
};
const login = async (k) => (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: demo.users[k], password: demo.password }) })).json()).token;
const zainab = await login('zainab'), tunde = await login('tunde'), folake = await login('folake');

const add = (name, title, employer, yrs, skills, requisition = req(0), source = 'Career Page') =>
  call('POST', '/admin/ats/candidates', zainab, { requisitionId: requisition, name, email: `${name.toLowerCase().replace(/ /g, '.')}@mail.example`,
    phone: '+234 802 000 0000', location: 'Lagos', currentTitle: title, currentEmployer: employer, experienceYears: yrs, skills, source });
const move = (c, status, note) => call('PATCH', `/admin/ats/candidates/${c.id}/status`, zainab, { status, note });

// Quality Assurance Officer (requisition 0)
await add('Kelechi Nnaji', 'QC Analyst', 'Dufil Prima Foods', 3, ['HACCP', 'ISO 22000']);
await add('Yetunde Ajayi', 'Lab Technician', 'Nestle Nigeria', 2, ['Microbiology', 'GMP'], req(0), 'Referral');
await move(await add('Musa Danjuma', 'QA Supervisor', 'Olam Nigeria', 5, ['HACCP', 'Auditing']), 'screening', 'CV meets the HACCP requirement');
await move(await add('Precious Etim', 'Quality Inspector', 'Flour Mills of Nigeria', 4, ['SPC', 'GMP']), 'screening');
const ifeanyi = await add('Ifeanyi Okoro', 'Senior QA Officer', 'Chi Limited', 6, ['HACCP', 'ISO 22000', 'Root-cause analysis'], req(0), 'LinkedIn');
const hauwa = await add('Hauwa Sani', 'QA Officer', 'Promasidor', 4, ['GMP', 'Food safety']);

const day = (n, h) => { const d = new Date(Date.now() + n * 864e5); d.setUTCHours(h - 1, 0, 0, 0); return d.toISOString(); };
const iv = await call('POST', '/admin/ats/interviews', zainab, { candidateId: ifeanyi.id, requisitionId: req(0), type: 'Video', stage: 'Technical', dateTime: day(-2, 11), durationMinutes: 60,
  interviewerIds: [demo.users.zainab, demo.users.tunde], meetingLink: 'https://meet.example/ecf-qa' });
await call('PATCH', `/admin/ats/interviews/${iv.id}/status`, zainab, { status: 'Completed' });
await call('POST', `/admin/ats/interviews/${iv.id}/scorecard`, zainab, { technical: 4, communication: 5, cultural: 4, recommendation: 'Hire', notes: 'Clear HACCP walkthrough; strong on documentation.' });
await call('POST', `/admin/ats/interviews/${iv.id}/scorecard`, tunde, { technical: 5, communication: 3, cultural: 4, recommendation: 'Strong Hire', notes: 'Best root-cause answer so far; would want more stakeholder communication.' });
await call('POST', '/admin/ats/interviews', zainab, { candidateId: hauwa.id, requisitionId: req(0), type: 'Onsite', stage: 'First round', dateTime: day(2, 10), durationMinutes: 45, interviewerIds: [demo.users.tunde] });

const damilola = await add('Damilola Ogun', 'QA Lead', 'Cadbury Nigeria', 7, ['ISO 22000', 'Team lead'], req(0), 'Referral');
await move(damilola, 'screening'); await move(damilola, 'interview');
const o1 = await call('POST', '/admin/ats/offers', zainab, { candidateId: damilola.id, requisitionId: req(0), title: 'Quality Assurance Officer', salary: 8400000, startDate: day(30, 9).slice(0, 10) });
await call('POST', `/admin/ats/offers/${o1.id}/send`, folake);

// Sales Executive, Abuja (requisition 1): one candidate taken through to hired
const ngozi = await add('Ngozi Ekwueme', 'Sales Representative', 'Guinness Nigeria', 4, ['FMCG sales', 'Key accounts'], req(1));
await move(ngozi, 'screening'); await move(ngozi, 'interview');
const o2 = await call('POST', '/admin/ats/offers', zainab, { candidateId: ngozi.id, requisitionId: req(1), title: 'Sales Executive', salary: 6600000, startDate: day(21, 9).slice(0, 10) });
await call('POST', `/admin/ats/offers/${o2.id}/send`, folake);
await call('POST', `/admin/ats/offers/${o2.id}/respond`, zainab, { decision: 'accepted' });
await move(await add('Bayo Olaniyan', 'Sales Intern', 'Self-employed', 1, ['Retail'], req(1)), 'rejected', 'Below minimum experience');
console.log('recruitment seeded; scored candidate', ifeanyi.id);

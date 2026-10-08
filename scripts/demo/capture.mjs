// Logs in as a demo user against the LOCAL stack and screenshots the real UI with
// headless Chrome over the DevTools protocol (no extra packages needed).
//
//   node scripts/demo/capture.mjs <userKey|anon> <out.png> [--tab <sidebar label>] [--eval <file.js>]
//        [--width 1440 --height 900] [--wait 4000]
//   --geo lat,lng grants geolocation and fixes the browser position.
//   --eval runs an async script in the page (after login/tab) with helpers: type(selector, text), click(text), sleep(ms).
//
// Requires: local API on :8788, Vite on :5199 started with VITE_API_URL=http://127.0.0.1:8788,
// and scripts/demo/demo-users.json from seed-demo.mjs.

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = 'http://127.0.0.1:8788', WEB = process.env.WEB_URL || 'http://localhost:5199';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const [userKey, outArg] = args;
const width = +opt('width', 1440), height = +opt('height', 900), wait = +opt('wait', 4000), tab = opt('tab', null);
const scale = +opt('scale', 2);
const path = opt('path', '/');

const demo = JSON.parse(readFileSync(join(HERE, 'demo-users.json'), 'utf8'));
const anon = userKey === 'anon';
let login = null;
if (!anon) {
  const email = demo.users[userKey];
  if (!email) throw new Error(`unknown user ${userKey}; have ${Object.keys(demo.users).join(', ')}`);
  login = await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: demo.password }) })).json();
  if (!login.token) throw new Error('login failed: ' + JSON.stringify(login));
}
const evalFile = opt('eval', null);

const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`,
  '--hide-scrollbars', '--no-first-run', `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page').webSocketDebuggerUrl; }
  catch { await sleep(200); }
}
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Page.enable');
const geo = opt('geo', null);
if (geo) {
  const [latitude, longitude] = geo.split(',').map(Number);
  await send('Browser.grantPermissions', { origin: WEB, permissions: ['geolocation'] });
  await send('Emulation.setGeolocationOverride', { latitude, longitude, accuracy: 25 });
}
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
await send('Page.navigate', { url: WEB + path });
await sleep(1500);
if (anon) await evaluate(`localStorage.clear(); true`);
else await evaluate(`localStorage.setItem('zenhr_token', ${JSON.stringify(login.token)});
  localStorage.setItem('zenhr_user', ${JSON.stringify(JSON.stringify(login.employee))}); true`);
await send('Page.navigate', { url: WEB + path });
await sleep(wait);

if (tab) {
  // Click the sidebar entry whose label matches, as a user would.
  const clicked = await evaluate(`(() => { const want = ${JSON.stringify(tab.toLowerCase())};
    const items = [...document.querySelectorAll('aside nav button')];
    const b = items.find(x => x.textContent.trim().toLowerCase() === want) || items.find(x => x.textContent.trim().toLowerCase().startsWith(want));
    if (b) { b.click(); return true; } return false; })()`);
  if (!clicked) console.warn('sidebar item not found:', tab);
  await sleep(wait);
}

if (evalFile) {
  const body = readFileSync(resolve(evalFile), 'utf8');
  const helpers = `const sleep = ms => new Promise(r => setTimeout(r, ms));
    const type = (sel, text) => { const el = document.querySelector(sel); if (!el) throw new Error('no ' + sel);
      const set = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set; set.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true })); };
    const click = text => { const want = text.toLowerCase();
      const b = [...document.querySelectorAll('button, a, [role=button]')].find(x => x.textContent.trim().toLowerCase().includes(want));
      if (!b) throw new Error('no button ' + text); b.click(); };`;
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${helpers}\n${body}\n; return 'ok'; })()`, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) console.warn('eval error:', r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
  await sleep(wait);
}

const shot = await send('Page.captureScreenshot', { format: 'png' });
const out = resolve(outArg);
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(out);
ws.close(); chrome.kill();

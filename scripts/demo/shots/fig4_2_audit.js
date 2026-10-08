window.__TAB__ = 'audit';
// Search the workforce list for Amaka and open her profile, as a user would.
type('input[placeholder^="Search by name"]', 'Amaka');
await sleep(1200);
const card = [...document.querySelectorAll('div')].find(d => /Amaka/.test(d.textContent) && [...d.querySelectorAll('button')].some(b => /profile/i.test(b.textContent)) && d.querySelectorAll('button').length <= 3);
[...card.querySelectorAll('button')].find(b => /profile/i.test(b.textContent)).click();
await sleep(2500);
const t = (window.__TAB__ || '').toLowerCase();
if (t) { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().toLowerCase() === t); if (b) { b.click(); await sleep(1500); } else throw new Error('no tab ' + t); }

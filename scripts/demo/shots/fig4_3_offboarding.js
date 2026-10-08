// Onboarding page -> Offboarding tab -> open Tobi Bello's case.
const tabBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLowerCase() === 'offboarding');
if (!tabBtn) throw new Error('no offboarding tab'); tabBtn.click();
await sleep(1500);
const el = [...document.querySelectorAll('div, tr, button')].reverse().find(e => /Tobi/.test(e.textContent) && e.offsetHeight > 30 && e.offsetHeight < 300 && (e.onclick || e.tagName === 'BUTTON' || getComputedStyle(e).cursor === 'pointer'));
if (el) el.click();
await sleep(1500);

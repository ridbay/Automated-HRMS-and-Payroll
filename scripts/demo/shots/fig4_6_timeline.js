click('kanban');
await sleep(2000);
const el = [...document.querySelectorAll('div')].reverse().find(e => /Ifeanyi Okoro/.test(e.textContent) && e.offsetHeight > 40 && e.offsetHeight < 260);
if (!el) throw new Error('card not found'); el.click();
await sleep(2500);
click('timeline');
await sleep(1800);

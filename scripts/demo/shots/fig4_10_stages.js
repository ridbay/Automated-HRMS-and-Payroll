click('cycles');
await sleep(1000);
const btn = document.querySelector('button[title="Manage stage timeline"]');
if (btn) btn.click();
await sleep(1000);

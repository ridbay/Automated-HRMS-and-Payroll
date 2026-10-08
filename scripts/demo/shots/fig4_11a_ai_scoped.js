type('header input[aria-label="Ask ZenHR AI anything"]', 'What is our total headcount?');
await sleep(500);
const form = document.querySelector('header form');
if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
await sleep(9000);

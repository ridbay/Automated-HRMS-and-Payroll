type('header input[aria-label="Ask ZenHR AI anything"]', 'Can you show me the company payroll summary for September 2026?');
await sleep(500);
const form = document.querySelector('header form');
if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
await sleep(9000);

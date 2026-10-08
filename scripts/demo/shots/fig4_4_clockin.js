// Employee Chinedu Obi opens Time & Attendance and clocks in through the modal.
const open = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLowerCase() === 'clock in');
if (!open) throw new Error('no clock-in button'); open.click();
await sleep(6000);                                   // geolocation + reverse geocode
const confirm = [...document.querySelectorAll('button')].find(b => /confirm action/i.test(b.textContent));
if (!confirm) throw new Error('no confirm'); confirm.click();
await sleep(4000);

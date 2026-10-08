// Halima Yusuf has just been issued a temporary password by HR (POST /admin/employees/:id/reset-temporary-password).
type('input[type=email]', 'halima.yusuf@ebonycrest.example');
type('input[placeholder="••••••••"]', 'ZenHR-50b29ed0');
click('sign in to dashboard');
await sleep(2500);

fetch("http://127.0.0.1:8787/admin/employees", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-tenant-id": "zenhr"
  },
  body: JSON.stringify({
    name: "Test",
    email: "test12345@example.com",
    role: "Dev",
    department: "Engineering",
    salary: 100000,
    status: "onboarding",
    hireDate: "2023-01-01"
  })
}).then(res => res.json()).then(console.log).catch(console.error);

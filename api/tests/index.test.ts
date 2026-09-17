import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../src/index';

vi.mock('hono/jwt', () => ({
  verify: vi.fn().mockResolvedValue({
    companyId: 'comp-1',
    sub: 'emp-1',
    role: 'SUPER_ADMIN',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
}));

describe('App Integration & Route Registration', () => {
  // authMiddleware refuses to run without a real JWT_SECRET (by design — see
  // auth.middleware.ts) — routes reachable past auth need one even though
  // `verify` itself is mocked above.
  const env = { DB: {}, JWT_SECRET: 'test-secret' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /health returns OK', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
  });

  it('GET /admin/employees without token returns 401', async () => {
    const res = await app.request('/admin/employees', {
      headers: {
        'x-tenant-id': 'comp-1',
      }
    }, env as any);
    // Should fail auth middleware
    expect(res.status).toBe(401);
  });

  it('GET /admin/employees requires tenant and auth', async () => {
    const res = await app.request('/admin/employees', {
      headers: {
        'Authorization': 'Bearer fake-token',
        'x-tenant-id': 'comp-1',
      }
    }, env as any);
    
    // We mock the DB services in controllers in other tests, but here we didn't mock EmployeeService.
    // So it will try to instantiate EmployeeService and run a query, which will fail because env.DB is empty `{}`.
    // But the status should be 500 (DB failure) or 200 (if we mock it), not 401 or 403, proving it passed routing and auth!
    expect([200, 500]).toContain(res.status);
  });

  it('GET /employee/me passes routing', async () => {
    const res = await app.request('/employee/me', {
      headers: {
        'Authorization': 'Bearer fake-token',
        'x-tenant-id': 'comp-1',
      }
    }, env as any);

    expect([200, 500]).toContain(res.status);
  });

  // Regression: payroll.routes.ts used to layer tenantMiddleware on top of the
  // already-authenticated /admin group, requiring an x-company-id header the real
  // frontend never sends and overwriting the JWT-derived companyId when it was sent.
  // A valid Bearer token alone must be enough to reach the controller.
  it('GET /admin/payroll/dashboard with only a Bearer token passes tenant scoping (no x-company-id needed)', async () => {
    const res = await app.request('/admin/payroll/dashboard', {
      headers: {
        'Authorization': 'Bearer fake-token',
      }
    }, env as any);

    // Must not be rejected for "missing tenant identification" — should reach the
    // controller and fail only on the unmocked DB (500), same as other admin routes.
    expect(res.status).not.toBe(401);
    expect([200, 500]).toContain(res.status);
  });
});

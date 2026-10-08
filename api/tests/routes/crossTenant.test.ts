import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/index';
import { SupportService } from '../../src/services/support.service';
import { LearningService } from '../../src/services/learning.service';
import { EmployeeService } from '../../src/services/employee.service';
import { LeaveService } from '../../src/services/leave.service';

vi.mock('hono/jwt', () => ({
  verify: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'token-employee') {
      return {
        companyId: 'comp-A',
        sub: 'emp-A-regular',
        role: 'EMPLOYEE',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    // Default to Company A HR Admin
    return {
      companyId: 'comp-A',
      sub: 'emp-A-admin',
      role: 'HR_ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }),
}));

const mockDrizzle = {
  query: {
    employees: {
      findFirst: vi.fn(),
    },
    roles: {
      findFirst: vi.fn(),
    },
  },
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  })),
};

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => mockDrizzle),
}));

vi.mock('../../src/services/support.service');
vi.mock('../../src/services/learning.service');
vi.mock('../../src/services/employee.service');
vi.mock('../../src/services/leave.service');
vi.mock('../../src/services/audit.service', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    log: vi.fn().mockResolvedValue(true),
  })),
}));

describe('Cross-Tenant Access Boundary Tests (11 test cases)', () => {
  const env = {
    DB: {},
    JWT_SECRET: 'test-secret',
    BUCKET: {},
  };

  const adminHeaders = {
    Authorization: 'Bearer token-admin',
  };

  const employeeHeaders = {
    Authorization: 'Bearer token-employee',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDrizzle.query.employees.findFirst.mockResolvedValue(null);
  });

  // --- The 5 operations corrected during the pre-evaluation review ---

  it('1. GET /support/tickets/:id/messages: Company A caller cannot read Company B ticket messages (404)', async () => {
    // Ticket tic-B belongs to comp-B, so SupportService returns null under comp-A
    (SupportService.prototype.getTicketMessages as any).mockResolvedValue(null);

    const res = await app.request('/support/tickets/tic-B-foreign/messages', {
      headers: employeeHeaders,
    }, env as any);

    expect(res.status).toBe(404);
    expect(SupportService.prototype.getTicketMessages).toHaveBeenCalledWith(
      'comp-A',
      'tic-B-foreign',
      'emp-A-regular',
      false
    );
  });

  it('2. POST /support/tickets/:id/messages: Company A caller cannot append message to Company B ticket (404, no write)', async () => {
    (SupportService.prototype.addTicketMessage as any).mockResolvedValue(null);

    const res = await app.request('/support/tickets/tic-B-foreign/messages', {
      method: 'POST',
      headers: { ...employeeHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Cross-tenant injection attempt' }),
    }, env as any);

    expect(res.status).toBe(404);
    expect(SupportService.prototype.addTicketMessage).toHaveBeenCalledWith(
      'comp-A',
      'tic-B-foreign',
      'emp-A-regular',
      'Cross-tenant injection attempt',
      false
    );
  });

  it('3. GET /admin/courses/:id/enrollments: Company A admin cannot list enrollments of Company B course (404)', async () => {
    (LearningService.prototype.getCourseEnrollments as any).mockResolvedValue(null);

    const res = await app.request('/admin/courses/crs-B-foreign/enrollments', {
      headers: adminHeaders,
    }, env as any);

    expect(res.status).toBe(404);
    expect(LearningService.prototype.getCourseEnrollments).toHaveBeenCalledWith('crs-B-foreign', 'comp-A');
  });

  it('4. DELETE /admin/courses/:id/enrollments/:enrollmentId: Company A admin cannot remove enrollment for Company B course (404)', async () => {
    (LearningService.prototype.unassignCourse as any).mockResolvedValue(null);

    const res = await app.request('/admin/courses/crs-B-foreign/enrollments/enr-B-1', {
      method: 'DELETE',
      headers: adminHeaders,
    }, env as any);

    expect(res.status).toBe(404);
    expect(LearningService.prototype.unassignCourse).toHaveBeenCalledWith('enr-B-1', 'comp-A', 'crs-B-foreign');
  });

  it('5. POST /admin/courses/:id/assign: Company A admin cannot assign course belonging to Company B (404)', async () => {
    (LearningService.prototype.assignCourse as any).mockResolvedValue(null);

    const res = await app.request('/admin/courses/crs-B-foreign/assign', {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds: ['emp-A-1'] }),
    }, env as any);

    expect(res.status).toBe(404);
    expect(LearningService.prototype.assignCourse).toHaveBeenCalledWith('crs-B-foreign', 'comp-A', ['emp-A-1']);
  });

  it('6. POST /admin/courses/:id/assign: Company A admin cannot enroll employees belonging to Company B (400)', async () => {
    (LearningService.prototype.assignCourse as any).mockResolvedValue({
      error: 'One or more employees do not belong to this company',
    });

    const res = await app.request('/admin/courses/crs-A-1/assign', {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds: ['emp-B-foreign'] }),
    }, env as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'One or more employees do not belong to this company' });
  });

  // --- High-sensitivity routes identified in thesis Section 4.4.3 ---

  it('7. GET /admin/employees/:id: Company A admin cannot view employee profile belonging to Company B (404)', async () => {
    (EmployeeService.prototype.getEmployeeProfile as any).mockResolvedValue(null);

    const res = await app.request('/admin/employees/emp-B-foreign', {
      headers: adminHeaders,
    }, env as any);

    expect(res.status).toBe(404);
    expect(EmployeeService.prototype.getEmployeeProfile).toHaveBeenCalledWith('comp-A', 'emp-B-foreign');
  });

  it('8. PUT /admin/leaves/:id/status: Company A admin cannot decide leave request belonging to Company B (409)', async () => {
    // Foreign leave request is not found under comp-A
    (LeaveService.prototype.updateLeaveRequestStatus as any).mockResolvedValue(null);

    const res = await app.request('/admin/leaves/lr-B-foreign/status', {
      method: 'PUT',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    }, env as any);

    expect(res.status).toBe(409);
    expect(LeaveService.prototype.updateLeaveRequestStatus).toHaveBeenCalledWith(
      'comp-A',
      'lr-B-foreign',
      expect.objectContaining({ status: 'approved' })
    );
  });

  it('9. GET /admin/leaves/employee/:id/requests: Company A admin querying Company B employee leave requests returns empty without leak', async () => {
    (LeaveService.prototype.getEmployeeLeaveRequests as any).mockResolvedValue([]);

    const res = await app.request('/admin/leaves/employee/emp-B-foreign/requests', {
      headers: adminHeaders,
    }, env as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
    expect(LeaveService.prototype.getEmployeeLeaveRequests).toHaveBeenCalledWith('comp-A', 'emp-B-foreign');
  });

  it('10. GET /admin/payroll/employee/:id/payslips: Company A admin cannot view payslips of Company B employee (404)', async () => {
    // emp-B-foreign does not exist under comp-A
    mockDrizzle.query.employees.findFirst.mockResolvedValue(null);

    const res = await app.request('/admin/payroll/employee/emp-B-foreign/payslips', {
      headers: adminHeaders,
    }, env as any);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Employee not found' });
  });

  it('11. DELETE /admin/employees/:id/documents/:documentId: Company A admin cannot delete employee document of Company B (404)', async () => {
    (EmployeeService.prototype.deleteDocument as any).mockRejectedValue(new Error('Document not found'));

    const res = await app.request('/admin/employees/emp-A-1/documents/doc-B-foreign', {
      method: 'DELETE',
      headers: adminHeaders,
    }, env as any);

    expect(res.status).toBe(404);
    expect(EmployeeService.prototype.deleteDocument).toHaveBeenCalledWith(
      'comp-A',
      'emp-A-1',
      env.BUCKET,
      'doc-B-foreign'
    );
  });
});

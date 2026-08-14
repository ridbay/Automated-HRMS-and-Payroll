import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeService } from './employee.service';
import * as authService from './auth.service';

vi.mock('./auth.service', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  generateSalt: vi.fn().mockReturnValue('salt_value'),
}));

describe('Employee Service', () => {
  let mockDb: any;
  let service: EmployeeService;

  beforeEach(() => {
    mockDb = {
      query: {
        employees: {
          findMany: vi.fn().mockResolvedValue([{ id: 'emp-1', companyId: 'comp-1', passwordHash: 'hash', passwordSalt: 'salt' }]),
          findFirst: vi.fn().mockResolvedValue({ id: 'emp-1', companyId: 'comp-1', name: 'John Doe', passwordHash: 'hash', passwordSalt: 'salt' }),
        },
        departments: {
          findFirst: vi.fn().mockResolvedValue({ id: 'dept-1', companyId: 'comp-1', name: 'Engineering' }),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-emp', companyId: 'comp-1', name: 'John Doe', passwordHash: 'hashed_password', passwordSalt: 'salt_value' }]),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    // We hack the db property directly to avoid testing Drizzle internals too heavily
    service = new EmployeeService({} as any);
    (service as any).db = mockDb;
  });

  it('should fetch employees and strip sensitive fields', async () => {
    const result = await service.getAllByCompany('comp-1');
    expect(result).toHaveLength(1);
    expect(result[0].companyId).toBe('comp-1');
    expect((result[0] as any).passwordHash).toBeUndefined();
    expect((result[0] as any).passwordSalt).toBeUndefined();
  });

  it('should create an employee, generate temp password, and return safe details', async () => {
    const payload = { name: 'John Doe', emergencyContacts: [{ name: 'Jane', relationship: 'Spouse' }] };
    const result = await service.createForCompany('comp-1', payload);

    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.id).toBe('new-emp');
    expect((result as any).passwordHash).toBeUndefined();
    expect(result.temporaryPassword).toBeDefined();
    expect(result.temporaryPassword).toMatch(/^ZenHR-/);
  });

  it('should resolve departmentId to the department name when creating an employee', async () => {
    const payload = { name: 'John Doe', departmentId: 'dept-1' };
    await service.createForCompany('comp-1', payload);

    expect(mockDb.query.departments.findFirst).toHaveBeenCalled();
    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues.department).toBe('Engineering');
    expect(insertedValues.departmentId).toBe('dept-1');
  });

  it('should clear departmentId when the referenced department is not found for the company', async () => {
    mockDb.query.departments.findFirst.mockResolvedValue(undefined);
    const payload = { name: 'John Doe', departmentId: 'missing-dept' };
    await service.createForCompany('comp-1', payload);

    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues.departmentId).toBeNull();
  });

  it('should sync the department label when reassigning an employee via admin update', async () => {
    await service.updateEmployeeByAdmin('comp-1', 'emp-1', { departmentId: 'dept-1' } as any);

    const updatedValues = mockDb.set.mock.calls[0][0];
    expect(updatedValues.department).toBe('Engineering');
    expect(updatedValues.departmentId).toBe('dept-1');
  });

  it('should clear the department label when unassigning an employee via admin update', async () => {
    await service.updateEmployeeByAdmin('comp-1', 'emp-1', { departmentId: null } as any);

    const updatedValues = mockDb.set.mock.calls[0][0];
    expect(updatedValues.department).toBeNull();
  });
});

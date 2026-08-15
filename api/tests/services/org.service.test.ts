import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrgService } from '../../src/services/org.service';
import * as schema from '../../src/db/schema';

describe('Org Service', () => {
  let mockDb: any;
  let service: OrgService;

  const departmentRow = { id: 'dept-1', companyId: 'comp-1', name: 'Engineering', description: null, managerId: 'emp-mgr', teamLeadId: null };
  const employeeRows = [
    { id: 'emp-1', name: 'Jane', lastName: 'Doe', email: 'jane@x.com', role: 'Engineer', avatar: null, departmentId: 'dept-1' },
    { id: 'emp-mgr', name: 'Mo', lastName: 'Manager', email: 'mo@x.com', role: 'Lead', avatar: null, departmentId: null },
  ];
  const locationRows = [{ id: 'loc-1', companyId: 'comp-1', name: 'HQ', address: '123 Main' }];

  const rowsForTable = (table: any) => {
    if (table === schema.departments) return [departmentRow];
    if (table === schema.locations) return locationRows;
    return employeeRows;
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(() => ({
        from: vi.fn((table: any) => ({
          where: vi.fn(() => ({
            all: vi.fn().mockResolvedValue(rowsForTable(table)),
          })),
        })),
      })),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ id: 'new-dept', name: 'Sales', companyId: 'comp-1' })
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      query: {
        departments: {
          findFirst: vi.fn().mockResolvedValue(departmentRow),
        },
      },
    };

    service = new OrgService({} as any);
    (service as any).db = mockDb;
  });

  it('should fetch departments by companyId with manager and member info attached', async () => {
    const result = await service.getDepartments('comp-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Engineering');
    expect(result[0].memberCount).toBe(1);
    expect(result[0].manager).toEqual({ id: 'emp-mgr', name: 'Mo Manager', avatar: null });
    expect(result[0].teamLead).toBeNull();
  });

  it('should create a department', async () => {
    const result = await service.createDepartment('comp-1', { name: 'Sales' });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result.id).toBe('new-dept');
    expect(result.name).toBe('Sales');
  });

  it('should update a department', async () => {
    mockDb.returning.mockReturnValue({
      get: vi.fn().mockResolvedValue({ ...departmentRow, managerId: 'emp-2' }),
    });
    const result = await service.updateDepartment('comp-1', 'dept-1', { managerId: 'emp-2' });
    expect(mockDb.update).toHaveBeenCalled();
    expect(result.managerId).toBe('emp-2');
  });

  it('should clear member department fields before deleting a department', async () => {
    mockDb.returning.mockReturnValue({ get: vi.fn().mockResolvedValue(departmentRow) });
    const result: any = await service.deleteDepartment('comp-1', 'dept-1');
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.delete).toHaveBeenCalled();
    expect(result.id).toBe('dept-1');
  });

  it('should fetch department members', async () => {
    const result = await service.getDepartmentMembers('comp-1', 'dept-1');
    expect(result).toEqual(employeeRows);
  });

  it('should assign an existing employee to a department and strip password fields', async () => {
    mockDb.returning.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        id: 'emp-1', name: 'Jane', lastName: 'Doe', departmentId: 'dept-1', department: 'Engineering',
        passwordHash: 'hash', passwordSalt: 'salt',
      }),
    });
    const result = await service.assignEmployeeToDepartment('comp-1', 'dept-1', 'emp-1');
    expect(result.departmentId).toBe('dept-1');
    expect(result.department).toBe('Engineering');
    expect(result.passwordHash).toBeUndefined();
  });

  it('should return null when assigning to a department that does not exist for the company', async () => {
    mockDb.query.departments.findFirst.mockResolvedValue(undefined);
    const result = await service.assignEmployeeToDepartment('comp-1', 'missing-dept', 'emp-1');
    expect(result).toBeNull();
  });

  it('should remove an employee from a department', async () => {
    mockDb.returning.mockReturnValue({
      get: vi.fn().mockResolvedValue({ id: 'emp-1', name: 'Jane', lastName: 'Doe', departmentId: null, department: null }),
    });
    const result = await service.removeEmployeeFromDepartment('comp-1', 'dept-1', 'emp-1');
    expect(result.departmentId).toBeNull();
  });

  it('should return null when removing an employee who is not a department member', async () => {
    mockDb.returning.mockReturnValue({ get: vi.fn().mockResolvedValue(undefined) });
    const result = await service.removeEmployeeFromDepartment('comp-1', 'dept-1', 'emp-404');
    expect(result).toBeNull();
  });

  it('should fetch locations by companyId', async () => {
    const result = await service.getLocations('comp-1');
    expect(result).toEqual(locationRows);
  });

  it('should create a location', async () => {
    const result = await service.createLocation('comp-1', { name: 'HQ', address: '123 Main' });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

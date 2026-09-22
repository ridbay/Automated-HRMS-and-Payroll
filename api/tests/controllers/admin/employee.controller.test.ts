import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as employeeController from '../../../src/controllers/admin/employee.controller';
import { EmployeeService } from '../../../src/services/employee.service';
import { AuditService } from '../../../src/services/audit.service';

vi.mock('../../../src/services/employee.service');
vi.mock('../../../src/services/audit.service');

describe('Admin Employee Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    EmployeeService.prototype.getAllByCompany = vi.fn();
    EmployeeService.prototype.getDirectReports = vi.fn();
    EmployeeService.prototype.getEmployeeProfile = vi.fn();
    EmployeeService.prototype.createForCompany = vi.fn();
    EmployeeService.prototype.updateEmployeeByAdmin = vi.fn();
    EmployeeService.prototype.deleteEmployee = vi.fn();
    EmployeeService.prototype.addEmergencyContact = vi.fn();
    EmployeeService.prototype.deleteEmergencyContact = vi.fn();
    EmployeeService.prototype.addDocument = vi.fn();
    EmployeeService.prototype.deleteDocument = vi.fn();
    EmployeeService.prototype.getAuditLogs = vi.fn();
    EmployeeService.prototype.getAssets = vi.fn();
    EmployeeService.prototype.addAsset = vi.fn();
    EmployeeService.prototype.deleteAsset = vi.fn();
    AuditService.prototype.log = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
        header: vi.fn(),
        parseBody: vi.fn(),
      },
      env: { DB: {}, BUCKET: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getEmployees should return all employees', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.query.mockReturnValue('search term');
    (EmployeeService.prototype.getAllByCompany as any).mockResolvedValue([{ id: '1' }]);

    await employeeController.getEmployees(mockContext);
    expect(EmployeeService.prototype.getAllByCompany).toHaveBeenCalledWith('comp-1', 'search term');
    expect(mockContext.json).toHaveBeenCalledWith([{ id: '1' }]);
  });

  it('getEmployee should return employee profile', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.param.mockReturnValue('emp-1');
    (EmployeeService.prototype.getEmployeeProfile as any).mockResolvedValue({ id: 'emp-1' });

    await employeeController.getEmployee(mockContext);
    expect(EmployeeService.prototype.getEmployeeProfile).toHaveBeenCalledWith('comp-1', 'emp-1');
  });

  it('createEmployee should return 400 on unique constraint error', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.json.mockResolvedValue({ email: 'test' });
    (EmployeeService.prototype.createForCompany as any).mockRejectedValue(new Error('UNIQUE constraint failed'));

    const res = await employeeController.createEmployee(mockContext);
    expect(res.status).toBe(400);
  });

  it('updateEmployee should update and log audit', async () => {
    mockContext.get.mockImplementation((k: string) => k === 'companyId' ? 'comp-1' : 'actor-1');
    mockContext.req.param.mockReturnValue('emp-1');
    mockContext.req.json.mockResolvedValue({ name: 'New' });
    (EmployeeService.prototype.updateEmployeeByAdmin as any).mockResolvedValue({ name: 'New' });

    await employeeController.updateEmployee(mockContext);
    expect(EmployeeService.prototype.updateEmployeeByAdmin).toHaveBeenCalledWith('comp-1', 'emp-1', { name: 'New' });
    expect(AuditService.prototype.log).toHaveBeenCalled();
  });

  it('addDocument should parse form body and add document', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.param.mockReturnValue('emp-1');
    const mockFile = new File([''], 'test.png');
    mockContext.req.parseBody.mockResolvedValue({ file: mockFile, name: 'Doc', type: 'id' });

    await employeeController.addDocument(mockContext);
    expect(EmployeeService.prototype.addDocument).toHaveBeenCalledWith('comp-1', 'emp-1', mockContext.env.BUCKET, { file: mockFile, name: 'Doc', type: 'id' });
  });
});

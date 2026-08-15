import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as profileController from './profile.controller';
import { EmployeeService } from '../../services/employee.service';

vi.mock('../../services/employee.service');

describe('Employee Profile Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    EmployeeService.prototype.getEmployeeProfile = vi.fn();
    EmployeeService.prototype.updateMyProfile = vi.fn();
    EmployeeService.prototype.addEmergencyContact = vi.fn();
    EmployeeService.prototype.deleteEmergencyContact = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('getMyProfile should return profile', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    (EmployeeService.prototype.getEmployeeProfile as any).mockResolvedValue({ id: 'emp-1' });

    await profileController.getMyProfile(mockContext);
    expect(EmployeeService.prototype.getEmployeeProfile).toHaveBeenCalled();
  });
});

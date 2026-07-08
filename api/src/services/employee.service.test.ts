import { describe, it, expect, vi } from 'vitest';
import { EmployeeService } from './employee.service';

vi.mock('drizzle-orm/d1', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue([{ id: 'emp-1', companyId: 'comp-1' }])
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'new-emp' }])
    }),
  };
  return { drizzle: vi.fn(() => mockDb) };
});

describe('Employee Service', () => {
  it('should fetch employees by companyId', async () => {
    const service = new EmployeeService({} as any);
    const result = await service.getAllByCompany('comp-1');
    
    expect(result).toHaveLength(1);
    expect(result[0].companyId).toBe('comp-1');
  });

  it('should create an employee and inject companyId', async () => {
    const service = new EmployeeService({} as any);
    const result = await service.createForCompany('comp-1', { name: 'John Doe' });
    
    expect(result.id).toBe('new-emp');
  });
});

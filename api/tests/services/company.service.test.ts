import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyService } from '../../src/services/company.service';

describe('Company Service', () => {
  let mockDb: any;
  let service: CompanyService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ id: 'comp-1', name: 'Test Company', industry: 'Software' }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    };

    // Initialize service with mocked DB
    service = new CompanyService({} as any);
    (service as any).db = mockDb;
  });

  it('should fetch a company by ID', async () => {
    const result = await service.getCompany('comp-1');
    expect(result).toBeDefined();
    expect(result?.id).toBe('comp-1');
    expect(result?.name).toBe('Test Company');
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.get).toHaveBeenCalled();
  });

  it('should update a company', async () => {
    mockDb.get.mockResolvedValueOnce({ id: 'comp-1', name: 'Updated Company' });
    const payload = { name: 'Updated Company' };
    const result = await service.updateCompany('comp-1', payload);
    
    expect(result?.name).toBe('Updated Company');
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(payload);
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.returning).toHaveBeenCalled();
    expect(mockDb.get).toHaveBeenCalled();
  });
});

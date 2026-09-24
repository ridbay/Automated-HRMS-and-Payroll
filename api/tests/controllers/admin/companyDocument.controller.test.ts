import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminCompanyDocumentController } from '../../../src/controllers/admin/companyDocument.controller';
import { CompanyDocumentService } from '../../../src/services/companyDocument.service';
import { AuditService } from '../../../src/services/audit.service';

vi.mock('../../../src/services/companyDocument.service');
vi.mock('../../../src/services/audit.service');
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    query: { employees: { findFirst: vi.fn().mockResolvedValue({ name: 'Sarah', lastName: 'Connor' }) } },
  })),
}));

describe('AdminCompanyDocumentController', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    AuditService.prototype.log = vi.fn().mockResolvedValue(undefined);

    mockContext = {
      req: {
        formData: vi.fn(),
        param: vi.fn(),
        header: vi.fn(),
      },
      env: { DB: {}, BUCKET: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('list returns every document for the company', async () => {
    mockContext.get.mockImplementation((k: string) => (k === 'companyId' ? 'comp-1' : undefined));
    CompanyDocumentService.prototype.list = vi.fn().mockResolvedValue([{ id: 'DOC-1', title: 'Handbook' }]);

    const res: any = await AdminCompanyDocumentController.list(mockContext);

    expect(CompanyDocumentService.prototype.list).toHaveBeenCalledWith('comp-1');
    expect(res.data.data).toEqual([{ id: 'DOC-1', title: 'Handbook' }]);
  });

  it('create resolves the uploader\'s real name (not just their id) and audit-logs the upload', async () => {
    mockContext.get.mockImplementation((k: string) => ({ companyId: 'comp-1', employeeId: 'emp-1' } as any)[k]);
    const formData = new Map([
      ['title', 'Remote Work Policy'],
      ['content', 'Up to 3 days remote.'],
    ]);
    mockContext.req.formData.mockResolvedValue(formData);
    CompanyDocumentService.prototype.create = vi.fn().mockResolvedValue({ id: 'DOC-1', title: 'Remote Work Policy' });

    const res = await AdminCompanyDocumentController.create(mockContext);

    expect(CompanyDocumentService.prototype.create).toHaveBeenCalledWith(
      'comp-1',
      { id: 'emp-1', name: 'Sarah Connor' },
      { title: 'Remote Work Policy', content: 'Up to 3 days remote.', file: null },
      mockContext.env.BUCKET
    );
    expect(AuditService.prototype.log).toHaveBeenCalledWith('comp-1', expect.objectContaining({
      actorId: 'emp-1',
      module: 'documents',
    }));
    expect(res.status).toBe(201);
  });

  it('create returns 400 (not a 500) when the service rejects, e.g. missing title', async () => {
    mockContext.get.mockImplementation((k: string) => ({ companyId: 'comp-1', employeeId: 'emp-1' } as any)[k]);
    mockContext.req.formData.mockResolvedValue(new Map([['title', ''], ['content', '']]));
    CompanyDocumentService.prototype.create = vi.fn().mockRejectedValue(new Error('Title and content are required.'));

    const res = await AdminCompanyDocumentController.create(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Title and content are required.' }, 400);
    expect(res.status).toBe(400);
    expect(AuditService.prototype.log).not.toHaveBeenCalled();
  });

  it('remove deletes the document and audit-logs it with the document\'s title', async () => {
    mockContext.get.mockImplementation((k: string) => ({ companyId: 'comp-1', employeeId: 'emp-1' } as any)[k]);
    mockContext.req.param.mockReturnValue('DOC-1');
    CompanyDocumentService.prototype.get = vi.fn().mockResolvedValue({ id: 'DOC-1', title: 'Remote Work Policy' });
    CompanyDocumentService.prototype.delete = vi.fn().mockResolvedValue({ success: true });

    const res: any = await AdminCompanyDocumentController.remove(mockContext);

    expect(CompanyDocumentService.prototype.delete).toHaveBeenCalledWith('comp-1', 'DOC-1', mockContext.env.BUCKET);
    expect(AuditService.prototype.log).toHaveBeenCalledWith('comp-1', expect.objectContaining({
      action: expect.stringContaining('Remote Work Policy'),
      severity: 'warning',
    }));
    expect(res.data).toEqual({ success: true });
  });

  it('remove returns 404 when the document does not exist', async () => {
    mockContext.get.mockImplementation((k: string) => ({ companyId: 'comp-1', employeeId: 'emp-1' } as any)[k]);
    mockContext.req.param.mockReturnValue('DOC-404');
    CompanyDocumentService.prototype.get = vi.fn().mockResolvedValue(undefined);
    CompanyDocumentService.prototype.delete = vi.fn().mockRejectedValue(new Error('Document not found'));

    const res = await AdminCompanyDocumentController.remove(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Document not found' }, 404);
    expect(res.status).toBe(404);
  });
});

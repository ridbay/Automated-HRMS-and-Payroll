import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reportsController from '../../../src/controllers/admin/reports.controller';
import { ReportsService } from '../../../src/services/reports.service';

vi.mock('../../../src/services/reports.service');

describe('Admin Reports Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    ReportsService.prototype.getOverview = vi.fn();
    ReportsService.prototype.getWorkforceReport = vi.fn();
    ReportsService.prototype.getRecruitmentReport = vi.fn();
    ReportsService.prototype.exportCsv = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
      header: vi.fn(),
      body: vi.fn((content) => content),
    };
  });

  it('getOverview should fetch overview', async () => {
    mockContext.get.mockReturnValue('comp-1');
    (ReportsService.prototype.getOverview as any).mockResolvedValue({ total: 100 });

    await reportsController.getOverview(mockContext);
    expect(ReportsService.prototype.getOverview).toHaveBeenCalled();
  });

  it('exportReport should return csv', async () => {
    mockContext.get.mockReturnValue('comp-1');
    mockContext.req.query.mockImplementation((k: string) => {
      if (k === 'type') return 'employees';
    });
    (ReportsService.prototype.exportCsv as any).mockResolvedValue({ filename: 'report.csv', content: 'csv-data' });

    await reportsController.exportReport(mockContext);
    expect(ReportsService.prototype.exportCsv).toHaveBeenCalled();
    expect(mockContext.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(mockContext.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="report.csv"');
  });
});

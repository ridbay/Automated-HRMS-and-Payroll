import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonnifyService } from '../../src/services/monnify.service';

describe('MonnifyService', () => {
  let service: MonnifyService;
  let mockDb: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: {
        payrollRuns: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        payslips: {
          findMany: vi.fn(),
        },
      },
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    };

    mockEnv = {
      MONNIFY_API_KEY: 'test-api-key',
      MONNIFY_SECRET_KEY: 'test-secret-key',
      MONNIFY_CONTRACT_CODE: '1234567890',
      MONNIFY_SOURCE_ACCOUNT_NUMBER: '0123456789',
      MONNIFY_BASE_URL: 'https://sandbox.monnify.com',
    };

    service = new MonnifyService({} as any, mockEnv);
    (service as any).db = mockDb;
  });

  it('should correctly resolve Nigerian bank codes', () => {
    expect(service.resolveBankCode('GTBank')).toBe('058');
    expect(service.resolveBankCode('Access Bank')).toBe('044');
    expect(service.resolveBankCode('Zenith Bank')).toBe('057');
    expect(service.resolveBankCode('Kuda')).toBe('090267');
    expect(service.resolveBankCode(null)).toBe('058');
  });

  it('should verify webhook signatures accurately', async () => {
    const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_DISBURSEMENT' });
    
    // Test that empty signature or invalid signature returns false
    const isValid = await service.verifyWebhookSignature(rawBody, 'invalid-signature');
    expect(isValid).toBe(false);

    // Test that missing secret key returns false (never fails open)
    const unconfigured = new MonnifyService({} as any, {} as any);
    const unconfiguredValid = await unconfigured.verifyWebhookSignature(rawBody, 'any-sig');
    expect(unconfiguredValid).toBe(false);
  });

  it('should simulate disbursement when credentials are missing', async () => {
    const unconfiguredService = new MonnifyService({} as any, {} as any);
    (unconfiguredService as any).db = mockDb;

    mockDb.query.payrollRuns.findFirst.mockResolvedValue({
      id: 'run-1',
      companyId: 'comp-1',
      status: 'approved',
      periodMonth: 5,
      periodYear: 2026,
    });

    mockDb.query.payslips.findMany.mockResolvedValue([
      { id: 'ps-1', netPay: 250000, bankName: 'GTBank', accountNumber: '0123456789' },
      { id: 'ps-2', netPay: 350000, bankName: 'Zenith Bank', accountNumber: '0987654321' },
    ]);

    const result = await unconfiguredService.initiatePayrollDisbursement('comp-1', 'run-1');
    expect(result.success).toBe(true);
    expect(result.status).toBe('PAID_SIMULATED');
    expect(result.totalAmount).toBe(600000);
    expect(result.totalRecipients).toBe(2);
  });

  it('should reject disbursement if payroll run is not in approved state', async () => {
    mockDb.query.payrollRuns.findFirst.mockResolvedValue({
      id: 'run-1',
      companyId: 'comp-1',
      status: 'draft',
    });

    await expect(service.initiatePayrollDisbursement('comp-1', 'run-1')).rejects.toThrow(
      "Cannot disburse payroll run in 'draft' state"
    );
  });

  it('should handle webhook event to mark run as paid', async () => {
    mockDb.query.payrollRuns.findMany.mockResolvedValue([
      { id: 'run-123456', status: 'processing' },
    ]);

    const eventData = {
      eventType: 'SUCCESSFUL_DISBURSEMENT',
      eventData: {
        batchReference: 'ZENHR-comp-run-12-1234567890',
      },
    };

    const res = await service.handleDisbursementWebhook(eventData);
    expect(res.success).toBe(true);
    expect(res.handled).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });
});

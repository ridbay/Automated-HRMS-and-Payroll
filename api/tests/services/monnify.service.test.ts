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

  it('excludes payslips with no bank account on file from the batch instead of sending a placeholder account', async () => {
    const unconfiguredService = new MonnifyService({} as any, {} as any);
    (unconfiguredService as any).db = mockDb;

    mockDb.query.payrollRuns.findFirst.mockResolvedValue({
      id: 'run-1', companyId: 'comp-1', status: 'approved', periodMonth: 5, periodYear: 2026,
    });
    mockDb.query.payslips.findMany.mockResolvedValue([
      { id: 'ps-1', employeeId: 'emp-1', netPay: 250000, bankName: 'GTBank', accountNumber: '0123456789' },
      { id: 'ps-2', employeeId: 'emp-2', netPay: 350000, bankName: null, accountNumber: null },
    ]);

    const result = await unconfiguredService.initiatePayrollDisbursement('comp-1', 'run-1');

    expect(result.totalRecipients).toBe(1);
    expect(result.totalAmount).toBe(250000);
    expect(result.skippedForMissingBankDetails).toEqual(['emp-2']);
  });

  it('refuses to disburse when every payslip is missing bank details, rather than sending an all-zero batch', async () => {
    mockDb.query.payrollRuns.findFirst.mockResolvedValue({
      id: 'run-1', companyId: 'comp-1', status: 'approved', periodMonth: 5, periodYear: 2026,
    });
    mockDb.query.payslips.findMany.mockResolvedValue([
      { id: 'ps-1', employeeId: 'emp-1', netPay: 250000, bankName: null, accountNumber: null },
    ]);

    await expect(service.initiatePayrollDisbursement('comp-1', 'run-1')).rejects.toThrow(
      'nothing to disburse'
    );
  });

  it('caches the access token and only re-authenticates once it is close to expiry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseBody: { accessToken: 'tok-1', expiresIn: 3600 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const token1 = await service.getAccessToken();
    const token2 = await service.getAccessToken();

    expect(token1).toBe('tok-1');
    expect(token2).toBe('tok-1');
    expect(fetchMock).toHaveBeenCalledTimes(1); // second call served from cache

    vi.unstubAllGlobals();
  });

  it('throws when Monnify authentication is not configured, rather than proceeding with no token', async () => {
    const unconfiguredService = new MonnifyService({} as any, {} as any);
    await expect(unconfiguredService.getAccessToken()).rejects.toThrow('Monnify credentials are not configured.');
  });

  it('fetches and returns the live bank list once authenticated', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responseBody: { accessToken: 'tok-1', expiresIn: 3600 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responseBody: [{ name: 'GTBank', code: '058' }] }) });
    vi.stubGlobal('fetch', fetchMock);

    const banks = await service.getBankList();

    expect(banks).toEqual([{ name: 'GTBank', code: '058' }]);
    vi.unstubAllGlobals();
  });

  it('validates a bank account and returns the resolved account name', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responseBody: { accessToken: 'tok-1', expiresIn: 3600 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ requestSuccessful: true, responseBody: { accountName: 'Ada Lovelace' } }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.validateBankAccount('0123456789', '058');

    expect(result).toEqual({ accountNumber: '0123456789', accountName: 'Ada Lovelace', bankCode: '058' });
    vi.unstubAllGlobals();
  });

  it('throws with Monnify\'s own message when bank account validation fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responseBody: { accessToken: 'tok-1', expiresIn: 3600 } }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ requestSuccessful: false, responseMessage: 'Account not found' }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(service.validateBankAccount('0000000000', '058')).rejects.toThrow('Account not found');
    vi.unstubAllGlobals();
  });

  it('sends a real batch disbursement request and flips the run to "processing" (not "paid") pending the webhook', async () => {
    mockDb.query.payrollRuns.findFirst.mockResolvedValue({
      id: 'run-1', companyId: 'comp-1', status: 'approved', periodMonth: 5, periodYear: 2026,
    });
    mockDb.query.payslips.findMany.mockResolvedValue([
      { id: 'ps-1', employeeId: 'emp-1', netPay: 250000, bankName: 'GTBank', accountNumber: '0123456789' },
    ]);
    const setMock = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
    mockDb.update.mockImplementation(() => ({ set: setMock }));

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responseBody: { accessToken: 'tok-1', expiresIn: 3600 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ requestSuccessful: true, responseBody: { reference: 'batch-ref' } }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.initiatePayrollDisbursement('comp-1', 'run-1');

    expect(result.status).toBe('PROCESSING');
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'processing' }));
    vi.unstubAllGlobals();
  });

  it('surfaces Monnify\'s failure message and leaves the run untouched when the batch request itself fails', async () => {
    mockDb.query.payrollRuns.findFirst.mockResolvedValue({
      id: 'run-1', companyId: 'comp-1', status: 'approved', periodMonth: 5, periodYear: 2026,
    });
    mockDb.query.payslips.findMany.mockResolvedValue([
      { id: 'ps-1', employeeId: 'emp-1', netPay: 250000, bankName: 'GTBank', accountNumber: '0123456789' },
    ]);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responseBody: { accessToken: 'tok-1', expiresIn: 3600 } }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ requestSuccessful: false, responseMessage: 'Insufficient wallet balance' }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(service.initiatePayrollDisbursement('comp-1', 'run-1')).rejects.toThrow('Insufficient wallet balance');
    expect(mockDb.update).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
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

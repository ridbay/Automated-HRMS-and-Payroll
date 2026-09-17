import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { Bindings } from '../types';

export interface MonnifyConfig {
  apiKey?: string;
  secretKey?: string;
  contractCode?: string;
  sourceAccountNumber?: string;
  baseUrl?: string;
}

export interface BankAccountValidation {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export interface BatchDisbursementResult {
  success: boolean;
  batchReference: string;
  totalAmount: number;
  totalRecipients: number;
  status: string;
  message?: string;
  rawResponse?: any;
}

// Common Nigerian bank codes mapping as fallback for when bankCode is not explicitly stored
export const NIGERIAN_BANK_CODES: Record<string, string> = {
  'access': '044',
  'access bank': '044',
  'gtb': '058',
  'gtbank': '058',
  'guaranty trust bank': '058',
  'zenith': '057',
  'zenith bank': '057',
  'first bank': '011',
  'first bank of nigeria': '011',
  'uba': '033',
  'united bank for africa': '033',
  'stanbic': '221',
  'stanbic ibtc': '221',
  'stanbic ibtc bank': '221',
  'fcmb': '214',
  'first city monument bank': '214',
  'fidelity': '070',
  'fidelity bank': '070',
  'sterling': '232',
  'sterling bank': '232',
  'wema': '035',
  'wema bank': '035',
  'kuda': '090267',
  'kuda bank': '090267',
  'opay': '090405',
  'palmpay': '090338',
  'moniepoint': '090392',
};

export class MonnifyService {
  private db;
  private apiKey: string;
  private secretKey: string;
  private contractCode: string;
  private sourceAccountNumber: string;
  private baseUrl: string;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(dbBinding: D1Database, env: Bindings) {
    this.db = drizzle(dbBinding, { schema });
    this.apiKey = env.MONNIFY_API_KEY || '';
    this.secretKey = env.MONNIFY_SECRET_KEY || '';
    this.contractCode = env.MONNIFY_CONTRACT_CODE || '';
    this.sourceAccountNumber = env.MONNIFY_SOURCE_ACCOUNT_NUMBER || '';
    this.baseUrl = (env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com').replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.secretKey);
  }

  async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Monnify credentials are not configured.');
    }

    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 60000) {
      return this.cachedToken.token;
    }

    const authString = btoa(`${this.apiKey}:${this.secretKey}`);
    const res = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Monnify authentication failed (${res.status}): ${err}`);
    }

    const data: any = await res.json();
    const token = data?.responseBody?.accessToken;
    const expiresIn = (data?.responseBody?.expiresIn || 3600) * 1000;

    if (!token) {
      throw new Error('Invalid response from Monnify authentication endpoint.');
    }

    this.cachedToken = {
      token,
      expiresAt: now + expiresIn,
    };

    return token;
  }

  async getBankList(): Promise<any[]> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/api/v1/banks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch bank list: ${res.statusText}`);
    }

    const json: any = await res.json();
    return json?.responseBody || [];
  }

  async validateBankAccount(accountNumber: string, bankCode: string): Promise<BankAccountValidation> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/api/v1/disbursements/account/validate?accountNumber=${encodeURIComponent(
      accountNumber
    )}&bankCode=${encodeURIComponent(bankCode)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json: any = await res.json();
    if (!res.ok || !json?.requestSuccessful) {
      throw new Error(json?.responseMessage || 'Bank account validation failed.');
    }

    return {
      accountNumber,
      accountName: json?.responseBody?.accountName || '',
      bankCode,
    };
  }

  resolveBankCode(bankName?: string | null): string {
    if (!bankName) return '058'; // fallback to GTBank default
    const normalized = bankName.trim().toLowerCase();
    return NIGERIAN_BANK_CODES[normalized] || '058';
  }

  async initiatePayrollDisbursement(companyId: string, runId: string): Promise<BatchDisbursementResult> {
    const run = await this.db.query.payrollRuns.findFirst({
      where: eq(schema.payrollRuns.id, runId),
    });

    if (!run || run.companyId !== companyId) {
      throw new Error('Payroll run not found.');
    }

    if (run.status !== 'approved') {
      throw new Error(`Cannot disburse payroll run in '${run.status}' state. Only 'approved' runs can be disbursed.`);
    }

    const payslips = await this.db.query.payslips.findMany({
      where: eq(schema.payslips.runId, runId),
    });

    if (!payslips.length) {
      throw new Error('No payslips found in this payroll run.');
    }

    const batchReference = `ZENHR-${companyId.slice(0, 4)}-${runId.slice(0, 6)}-${Date.now()}`;
    const transactionList = payslips.map((ps, index) => {
      const bankCode = this.resolveBankCode(ps.bankName);
      const accountNumber = ps.accountNumber || '0000000000';

      return {
        amount: Math.round(ps.netPay),
        reference: `PS-${ps.id || index}-${Date.now()}`,
        narration: `ZenHR Salary ${run.periodMonth}/${run.periodYear}`,
        destinationBankCode: bankCode,
        destinationAccountNumber: accountNumber,
        currency: 'NGN',
      };
    });

    const totalAmount = transactionList.reduce((acc, t) => acc + t.amount, 0);

    // If Monnify credentials are not provided (e.g. in demo or test environment), simulate success
    if (!this.isConfigured()) {
      await this.db.update(schema.payrollRuns)
        .set({
          status: 'paid',
        })
        .where(eq(schema.payrollRuns.id, runId));

      return {
        success: true,
        batchReference,
        totalAmount,
        totalRecipients: transactionList.length,
        status: 'PAID_SIMULATED',
        message: 'Simulated disbursement successful (Monnify credentials not configured).',
      };
    }

    const token = await this.getAccessToken();
    const payload = {
      title: `ZenHR Payroll ${run.periodMonth}/${run.periodYear}`,
      batchReference,
      narration: `ZenHR Salary Run ${run.periodMonth}/${run.periodYear}`,
      sourceAccountNumber: this.sourceAccountNumber,
      onFailure: 'CONTINUE',
      notificationUrl: '',
      transactionList,
    };

    const res = await fetch(`${this.baseUrl}/api/v2/disbursements/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();
    if (!res.ok || !data?.requestSuccessful) {
      throw new Error(data?.responseMessage || 'Disbursement request to Monnify failed.');
    }

    // Update status to processing (will be transitioned to 'paid' when batch webhook completes)
    await this.db.update(schema.payrollRuns)
      .set({
        status: 'processing',
      })
      .where(eq(schema.payrollRuns.id, runId));

    return {
      success: true,
      batchReference,
      totalAmount,
      totalRecipients: transactionList.length,
      status: 'PROCESSING',
      rawResponse: data.responseBody,
    };
  }

  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    if (!this.secretKey) return true;

    try {
      const enc = new TextEncoder();
      const combined = this.secretKey + rawBody;
      const hashBuffer = await crypto.subtle.digest('SHA-512', enc.encode(combined));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return calculatedSignature.toLowerCase() === signature.toLowerCase();
    } catch {
      return false;
    }
  }

  async handleDisbursementWebhook(eventData: any): Promise<{ success: boolean; handled: boolean }> {
    const { eventType, eventData: details } = eventData || {};
    
    if (eventType === 'SUCCESSFUL_DISBURSEMENT' || eventType === 'BATCH_DISBURSEMENT_COMPLETED') {
      const batchReference = details?.batchReference;
      if (batchReference) {
        // Mark corresponding payroll run as paid
        const runs = await this.db.query.payrollRuns.findMany();
        const matched = runs.find((r) => r.id && batchReference.includes(r.id.slice(0, 6)));
        if (matched) {
          await this.db.update(schema.payrollRuns)
            .set({ status: 'paid' })
            .where(eq(schema.payrollRuns.id, matched.id));
          return { success: true, handled: true };
        }
      }
    }

    return { success: true, handled: false };
  }
}

import { D1Database, R2Bucket, Ai } from '@cloudflare/workers-types';

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: Ai;
  JWT_SECRET?: string;
  NODE_ENV?: 'development' | 'production';
  // Monnify (Payments & Disbursement)
  MONNIFY_API_KEY?: string;
  MONNIFY_SECRET_KEY?: string;
  MONNIFY_CONTRACT_CODE?: string;
  MONNIFY_SOURCE_ACCOUNT_NUMBER?: string;
  MONNIFY_BASE_URL?: string;
  // Mailgun (Email Delivery)
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_FROM?: string;
  MAILGUN_BASE_URL?: string;
};

export type Variables = {
  companyId: string;
  employeeId?: string;
  role?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

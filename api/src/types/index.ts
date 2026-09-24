import { D1Database, R2Bucket, Ai, AiSearchInstance } from '@cloudflare/workers-types';

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: Ai;
  // Cloudflare AI Search (formerly AutoRAG) instance — indexes uploaded
  // company knowledge-base documents straight out of R2 (PDF/DOCX/etc, no
  // manual text extraction needed). Optional: undefined until the
  // "zenhr-company-docs" instance is provisioned and bound in wrangler.toml;
  // ai.service.ts falls back to keyword search over the D1 content column
  // when it's absent.
  AI_SEARCH?: AiSearchInstance;
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

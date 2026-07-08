import { D1Database, R2Bucket } from '@cloudflare/workers-types';

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET?: string;
  NODE_ENV?: 'development' | 'production';
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

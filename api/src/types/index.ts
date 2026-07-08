export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

export type Variables = {
  companyId: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

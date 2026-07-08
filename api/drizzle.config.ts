import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

// Automatically locate the local D1 database file created by Wrangler
const d1Dir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
let localDbFile = '';
if (fs.existsSync(d1Dir)) {
  const files = fs.readdirSync(d1Dir);
  const sqliteFile = files.find(f => f.endsWith('.sqlite'));
  if (sqliteFile) {
    localDbFile = path.join(d1Dir, sqliteFile);
  }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  ...(localDbFile ? { dbCredentials: { url: localDbFile } } : {})
});

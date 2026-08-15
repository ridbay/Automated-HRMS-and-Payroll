import { R2Bucket } from '@cloudflare/workers-types';

// Thin, shared wrapper around the R2 put/delete/get calls that used to live
// inline in EmployeeService.addDocument/deleteDocument — factored out so
// candidate resumes (and any future file upload) use the exact same
// object-key convention instead of re-implementing it. R2 objects aren't
// public by default, so reads go through streamFile + a role-gated route,
// never a bare public URL.
export class StorageService {
  constructor(private bucket: R2Bucket) {}

  async uploadFile(keyPrefix: string, file: File): Promise<string> {
    const key = `${keyPrefix}/${Date.now()}-${file.name}`;
    await this.bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    if (!key) return;
    try {
      await this.bucket.delete(key);
    } catch (e) {
      // Best-effort — an orphaned R2 object is a much smaller problem than
      // failing the caller's delete of the DB row that references it.
      console.error('Failed to delete R2 object', key, e);
    }
  }

  async streamFile(key: string) {
    if (!key) return null;
    return this.bucket.get(key);
  }
}

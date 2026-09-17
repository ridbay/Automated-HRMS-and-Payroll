import { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types';

export interface UploadResult {
  key: string;
  size: number;
  contentType: string;
}

export class StorageService {
  constructor(private bucket?: R2Bucket) {}

  /**
   * Uploads a file to Cloudflare R2 under a given key prefix.
   */
  async uploadFile(keyPrefix: string, file: File, customFileName?: string): Promise<string> {
    const cleanPrefix = keyPrefix.replace(/\/+$/, '');
    const fileName = customFileName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const key = `${cleanPrefix}/${fileName}`;

    if (!this.bucket) {
      // In development or test without bound R2 bucket, simulate storage
      return key;
    }

    const buffer = await file.arrayBuffer();
    await this.bucket.put(key, buffer, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });

    return key;
  }

  /**
   * Uploads raw binary buffer (e.g. generated reports or exports).
   */
  async uploadBuffer(key: string, buffer: ArrayBuffer | Uint8Array, contentType = 'application/octet-stream'): Promise<string> {
    if (!this.bucket) {
      return key;
    }

    await this.bucket.put(key, buffer, {
      httpMetadata: { contentType },
    });

    return key;
  }

  /**
   * Deletes a file from R2 safely.
   */
  async deleteFile(key: string): Promise<void> {
    if (!key || !this.bucket) return;
    try {
      await this.bucket.delete(key);
    } catch (e) {
      // Best-effort deletion so caller is not blocked
      console.error('Failed to delete R2 object', key, e);
    }
  }

  /**
   * Retrieves an object body stream from R2.
   */
  async streamFile(key: string): Promise<R2ObjectBody | null> {
    if (!key || !this.bucket) return null;
    try {
      const obj = await this.bucket.get(key);
      return obj as R2ObjectBody | null;
    } catch {
      return null;
    }
  }

  /**
   * Uploads a company branding logo and returns the stored R2 object key.
   */
  async uploadCompanyLogo(companyId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `logo-${Date.now()}.${cleanExt}`;
    return this.uploadFile(`companies/${companyId}/branding`, file, fileName);
  }
}

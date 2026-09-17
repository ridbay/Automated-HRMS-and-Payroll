import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../../src/services/storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockBucket: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBucket = {
      put: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue({
        body: 'file-content',
        httpMetadata: { contentType: 'image/png' },
      }),
    };

    service = new StorageService(mockBucket);
  });

  it('should upload a file to Cloudflare R2 with metadata', async () => {
    const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
    const key = await service.uploadFile('companies/comp-1/avatars', file);

    expect(key).toMatch(/^companies\/comp-1\/avatars\/\d+-profile\.png$/);
    expect(mockBucket.put).toHaveBeenCalledWith(
      key,
      expect.any(ArrayBuffer),
      { httpMetadata: { contentType: 'image/png' } }
    );
  });

  it('should upload binary buffer to R2', async () => {
    const buffer = new Uint8Array([1, 2, 3]);
    const key = 'reports/comp-1/summary.pdf';
    await service.uploadBuffer(key, buffer, 'application/pdf');

    expect(mockBucket.put).toHaveBeenCalledWith(
      key,
      buffer,
      { httpMetadata: { contentType: 'application/pdf' } }
    );
  });

  it('should upload company logo with sanitized extension', async () => {
    const logoFile = new File(['logo bytes'], 'acme-corp.JPEG', { type: 'image/jpeg' });
    const key = await service.uploadCompanyLogo('comp-123', logoFile);

    expect(key).toMatch(/^companies\/comp-123\/branding\/logo-\d+\.jpeg$/);
    expect(mockBucket.put).toHaveBeenCalled();
  });

  it('should delete file without throwing error if R2 delete fails', async () => {
    mockBucket.delete.mockRejectedValueOnce(new Error('R2 network failure'));
    // Should not throw
    await expect(service.deleteFile('some/key.png')).resolves.toBeUndefined();
  });

  it('should stream file from R2', async () => {
    const result = await service.streamFile('companies/comp-1/doc.pdf');
    expect(result).not.toBeNull();
    expect(mockBucket.get).toHaveBeenCalledWith('companies/comp-1/doc.pdf');
  });

  it('should simulate operations gracefully when bucket is undefined', async () => {
    const unconfigured = new StorageService(undefined);
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });

    const key = await unconfigured.uploadFile('test/path', file);
    expect(key).toContain('test/path');

    const stream = await unconfigured.streamFile(key);
    expect(stream).toBeNull();

    await expect(unconfigured.deleteFile(key)).resolves.toBeUndefined();
  });
});

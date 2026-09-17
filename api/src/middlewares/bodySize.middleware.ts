import { Context, Next } from 'hono';
import { AppEnv } from '../types';

const JSON_LIMIT_BYTES = 1 * 1024 * 1024;   // 1 MB  — JSON request bodies
const FILE_LIMIT_BYTES = 10 * 1024 * 1024;  // 10 MB — multipart/form-data (file uploads)

/**
 * Rejects oversized request bodies before any controller reads them.
 *
 * Two limits:
 *  • application/json  → 1 MB
 *  • multipart/form-data (file uploads, resumes) → 10 MB
 *
 * Cloudflare Workers automatically truncate bodies larger than 100 MB at the
 * edge, but checking Content-Length early lets us fail fast with a clear 413
 * instead of wasting CPU parsing a giant body.
 *
 * Note: Content-Length may be absent (chunked encoding). In that case we skip
 * the upfront check and rely on Cloudflare's own limits.
 */
export const bodySizeGuard = () => {
  return async (c: Context<AppEnv>, next: Next) => {
    const method = c.req.method;

    // Only check mutating requests that carry a body
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
      return await next();
    }

    const contentLength = c.req.header('Content-Length');
    const contentType = c.req.header('Content-Type') || '';

    if (contentLength) {
      const bytes = parseInt(contentLength, 10);

      if (contentType.includes('multipart/form-data')) {
        if (bytes > FILE_LIMIT_BYTES) {
          return c.json(
            {
              error: `File upload too large. Maximum allowed size is ${FILE_LIMIT_BYTES / 1024 / 1024} MB.`,
            },
            413
          );
        }
      } else if (contentType.includes('application/json') || contentType.includes('text/')) {
        if (bytes > JSON_LIMIT_BYTES) {
          return c.json(
            {
              error: `Request body too large. Maximum allowed size is ${JSON_LIMIT_BYTES / 1024} KB.`,
            },
            413
          );
        }
      }
    }

    return await next();
  };
};

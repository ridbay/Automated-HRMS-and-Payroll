import { Context, Next } from 'hono';
import { AppEnv } from '../types';

/**
 * In-memory token-bucket rate limiter.
 *
 * Cloudflare Workers run in V8 isolates that are reused per PoP (point of
 * presence) but reset across cold starts. This means the counters are
 * best-effort within a single isolate's lifetime — good enough to stop
 * accidental hammering and slow brute-force attempts, but not a replacement
 * for Cloudflare's WAF / Rate Limiting rules for production traffic at scale.
 *
 * Bucket structure:  Map<key, { count: number; resetsAt: number }>
 * A bucket resets (count → 0) after its window (windowMs) expires.
 */

interface Bucket {
  count: number;
  resetsAt: number;
}

const buckets = new Map<string, Bucket>();

function consume(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetsAt) {
    bucket = { count: 0, resetsAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

function secondsUntilReset(key: string): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  return Math.ceil((bucket.resetsAt - Date.now()) / 1000);
}

// Occasionally prune stale entries so the Map doesn't grow unbounded inside
// long-lived isolates. Runs at most once every 5 minutes.
let lastPruneAt = 0;
function maybePrune() {
  const now = Date.now();
  if (now - lastPruneAt < 5 * 60 * 1000) return;
  lastPruneAt = now;
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetsAt) buckets.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Middleware factories
// ---------------------------------------------------------------------------

/**
 * Per-company rate limiter for authenticated routes.
 * Default: 200 requests per minute per companyId.
 */
export const companyRateLimit = (limit = 200, windowMs = 60_000) => {
  return async (c: Context<AppEnv>, next: Next) => {
    maybePrune();

    // companyId is set by authMiddleware before this runs
    const companyId = c.get('companyId') as string | undefined;
    if (!companyId) return await next(); // no identity — auth middleware handles it

    const key = `company:${companyId}`;
    const allowed = consume(key, limit, windowMs);

    if (!allowed) {
      const retryAfter = secondsUntilReset(key);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: 'Too many requests. Please slow down.', retryAfter },
        429
      );
    }

    await next();
  };
};

/**
 * Per-IP rate limiter for unauthenticated auth endpoints (login, register).
 * Default: 20 requests per minute per IP — brute-force protection.
 *
 * Falls back to the CF-Connecting-IP header (set by the Cloudflare edge for
 * all requests). In local `wrangler dev` the header is absent so we fall back
 * to a generic key — effectively no-op in dev, which is intentional.
 */
export const authRateLimit = (limit = 20, windowMs = 60_000) => {
  return async (c: Context<AppEnv>, next: Next) => {
    maybePrune();

    const ip =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
      'unknown';

    const key = `auth:${ip}`;
    const allowed = consume(key, limit, windowMs);

    if (!allowed) {
      const retryAfter = secondsUntilReset(key);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: 'Too many login attempts. Please try again later.', retryAfter },
        429
      );
    }

    await next();
  };
};

import { Hono } from 'hono';
import { listOpenPositions, getOpenPosition, applyToPosition } from '../controllers/public.controller';
import { MonnifyService } from '../services/monnify.service';
import { StorageService } from '../services/storage.service';
import { CompanyService } from '../services/company.service';
import { AppEnv } from '../types';

// Intentionally unauthenticated — mounted before authMiddleware in
// src/index.ts, no x-company-id header required. The public careers page
// (src/features/public/CareersPage.tsx), application form, and external webhooks
// are the consumers.
const publicRoutes = new Hono<AppEnv>();

publicRoutes.get('/careers/:companyIdentifier', listOpenPositions);
publicRoutes.get('/careers/:companyIdentifier/:requisitionId', getOpenPosition);
publicRoutes.post('/careers/:companyIdentifier/:requisitionId/apply', applyToPosition);

// Publicly stream company branding logo
publicRoutes.get('/company/:companyIdentifier/logo', async (c) => {
  const companyIdentifier = c.req.param('companyIdentifier');
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.getCompany(companyIdentifier);
  if (!company || !company.logoUrl) {
    return c.json({ error: 'Logo not found' }, 404);
  }

  const storage = new StorageService(c.env.BUCKET);
  const object = await storage.streamFile(company.logoUrl);
  if (!object) {
    return c.json({ error: 'Logo file not found in storage' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=86400');
  return c.body(object.body, 200, Object.fromEntries(headers.entries()));
});

// Monnify disbursement & transaction webhook
publicRoutes.post('/webhooks/monnify', async (c) => {
  try {
    const signature = c.req.header('monnify-signature') || '';
    const rawBody = await c.req.text();
    const monnify = new MonnifyService(c.env.DB, c.env);

    const isValid = await monnify.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature' }, 401);
    }

    const payload = JSON.parse(rawBody);
    const result = await monnify.handleDisbursementWebhook(payload);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default publicRoutes;

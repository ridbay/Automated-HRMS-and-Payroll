import { Hono } from 'hono';
import { listOpenPositions, getOpenPosition, applyToPosition } from '../controllers/public.controller';

// Intentionally unauthenticated — mounted before authMiddleware in
// src/index.ts, no x-company-id header required. The public careers page
// (src/features/public/CareersPage.tsx) and its application form are the
// only consumers.
const publicRoutes = new Hono();

publicRoutes.get('/careers/:companyIdentifier', listOpenPositions);
publicRoutes.get('/careers/:companyIdentifier/:requisitionId', getOpenPosition);
publicRoutes.post('/careers/:companyIdentifier/:requisitionId/apply', applyToPosition);

export default publicRoutes;

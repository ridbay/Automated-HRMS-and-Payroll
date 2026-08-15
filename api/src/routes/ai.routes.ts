import { Hono } from 'hono';
import { askAi } from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const aiRoutes = new Hono();

// Requires a real JWT (not just the x-company-id mock-header fallback) —
// role-scoped tool access in AiService has nothing to scope with otherwise.
// See ai.controller.ts's explicit role check for the actual enforcement.
aiRoutes.use('*', authMiddleware);

aiRoutes.post('/ask', askAi);

export default aiRoutes;

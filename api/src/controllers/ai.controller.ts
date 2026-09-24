import { Context } from 'hono';
import { AiService } from '../services/ai.service';
import { AppEnv } from '../types';

export const askAi = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string | undefined;
    const employeeId = c.get('employeeId') as string | undefined;
    const role = c.get('role') as string | undefined;

    // authMiddleware's x-company-id mock-header fallback never sets `role`
    // (it's JWT-only) — role-scoped tool access has nothing to scope with
    // in that case, so a real token is required here, unlike most /admin
    // routes which still work behind the mock header for local dev.
    if (!companyId || !employeeId || !role) {
      return c.json({ error: 'A valid session is required to use the assistant.' }, 401);
    }

    const { question } = await c.req.json();
    if (!question || typeof question !== 'string' || !question.trim()) {
      return c.json({ error: 'question is required' }, 400);
    }
    if (question.length > 2000) {
      return c.json({ error: 'question is too long (max 2000 characters)' }, 400);
    }

    if (!c.env.AI) {
      return c.json({ error: 'The AI assistant is not configured for this environment yet.' }, 503);
    }

    const service = new AiService(c.env.DB, c.env.AI, c.env.AI_SEARCH);
    const result = await service.ask({ companyId, employeeId, role }, question.trim());
    return c.json({ data: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

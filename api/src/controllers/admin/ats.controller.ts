import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { AtsService, AtsActor } from '../../services/ats.service';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/controlCenter.service';
import { AppEnv } from '../../types';

// Same shape/derivation as requisition.controller.ts's getActor — kept as a
// local copy rather than a shared import since each controller's actor type
// is scoped to its own service (RequisitionActor vs AtsActor) even though
// the resolution logic is identical.
const getActor = async (c: Context<AppEnv>): Promise<AtsActor> => {
  const employeeId = c.get('employeeId') as string | undefined;
  const role = c.get('role') as string | undefined;

  if (!employeeId) return { id: 'system', name: 'System', avatar: null, role };

  const db = drizzle(c.env.DB, { schema });
  const employee = await db.query.employees.findFirst({ where: eq(schema.employees.id, employeeId) });
  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(' ') : 'Unknown';
  return { id: employeeId, name, avatar: employee?.avatar || null, role };
};

// ---------------- Candidates ----------------
export const listCandidates = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new AtsService(c.env.DB);
    const rows = await service.listCandidates(companyId, {
      requisitionId: c.req.query('requisitionId'),
      status: c.req.query('status'),
    });
    return c.json({ data: rows });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getCandidate = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new AtsService(c.env.DB);
    const candidate = await service.getCandidate(companyId, (c.req.param('id') as string));
    if (!candidate) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: candidate });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// Admin-side "add candidate" — multipart so a resume can be attached
// directly, same parseBody convention as employee.controller.ts:addDocument.
export const createCandidate = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const service = new AtsService(c.env.DB);

    const contentType = c.req.header('content-type') || '';
    let payload: any;
    let resumeFileKey: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.parseBody();
      const file = formData.resume as File | undefined;
      payload = { ...formData };
      if (payload.skills && typeof payload.skills === 'string') {
        payload.skills = payload.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (file && file.size > 0 && c.env.BUCKET) {
        const storage = new StorageService(c.env.BUCKET);
        resumeFileKey = await storage.uploadFile(`companies/${companyId}/candidates/resumes`, file);
      }
    } else {
      payload = await c.req.json();
    }

    const created = await service.createCandidate(companyId, actor, payload, resumeFileKey);
    return c.json({ data: created }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.message?.includes('required') ? 400 : 500);
  }
};

export const updateCandidateStatus = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const { status, note } = await c.req.json();
    const service = new AtsService(c.env.DB);
    const updated = await service.updateCandidateStatus(companyId, actor, (c.req.param('id') as string), status, note);
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, error.message?.includes('must be one of') ? 400 : 500);
  }
};

export const rateCandidate = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const { rating } = await c.req.json();
    const service = new AtsService(c.env.DB);
    const updated = await service.rateCandidate(companyId, (c.req.param('id') as string), Number(rating));
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getCandidateResume = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new AtsService(c.env.DB);
    const candidate = await service.getCandidate(companyId, (c.req.param('id') as string));
    if (!candidate || !candidate.resumeFileKey) return c.json({ error: 'No resume on file' }, 404);
    if (!c.env.BUCKET) return c.json({ error: 'File storage is not configured' }, 503);

    const storage = new StorageService(c.env.BUCKET);
    const object = await storage.streamFile(candidate.resumeFileKey);
    if (!object) return c.json({ error: 'Resume file not found' }, 404);

    c.header('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    c.header('Content-Disposition', `inline; filename="${candidate.name.replace(/[^a-z0-9]+/gi, '-')}-resume"`);
    return c.body(object.body as any);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// ---------------- Interviews ----------------
export const listInterviews = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new AtsService(c.env.DB);
    const rows = await service.listInterviews(companyId, { candidateId: c.req.query('candidateId') });
    return c.json({ data: rows });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const scheduleInterview = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const payload = await c.req.json();
    const service = new AtsService(c.env.DB);
    const created = await service.scheduleInterview(companyId, actor, payload);
    return c.json({ data: created }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.message?.includes('required') || error.message?.includes('not found') ? 400 : 500);
  }
};

export const updateInterviewStatus = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const { status } = await c.req.json();
    const service = new AtsService(c.env.DB);
    const updated = await service.updateInterviewStatus(companyId, (c.req.param('id') as string), status);
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const submitScorecard = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const payload = await c.req.json();
    const service = new AtsService(c.env.DB);
    const created = await service.submitScorecard(companyId, actor, (c.req.param('id') as string), payload);
    return c.json({ data: created }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.message?.includes('not found') ? 404 : 500);
  }
};

// ---------------- Offers ----------------
export const listOffers = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const service = new AtsService(c.env.DB);
    return c.json({ data: await service.listOffers(companyId) });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const createOffer = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const payload = await c.req.json();
    const service = new AtsService(c.env.DB);
    const created = await service.createOffer(companyId, actor, payload);
    return c.json({ data: created }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, error.message?.includes('required') || error.message?.includes('not found') ? 400 : 500);
  }
};

export const sendOffer = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const service = new AtsService(c.env.DB);
    const updated = await service.sendOffer(companyId, actor, (c.req.param('id') as string));
    if (!updated) return c.json({ error: 'Not found' }, 404);

    const candidate = await service.getCandidate(companyId, updated.candidateId);
    await new NotificationService(c.env.DB).notify(
      companyId,
      'ats.offer_sent',
      `📨 Offer sent to ${candidate?.name || 'a candidate'} for *${updated.title}*`
    );

    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const respondToOffer = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const { decision } = await c.req.json();
    if (!['accepted', 'declined'].includes(decision)) return c.json({ error: 'decision must be "accepted" or "declined"' }, 400);
    const service = new AtsService(c.env.DB);
    const updated = await service.respondToOffer(companyId, actor, (c.req.param('id') as string), decision);
    if (!updated) return c.json({ error: 'Not found' }, 404);

    if (decision === 'accepted') {
      const candidate = await service.getCandidate(companyId, updated.candidateId);
      await new NotificationService(c.env.DB).notify(
        companyId,
        'ats.offer_accepted',
        `🎉 ${candidate?.name || 'A candidate'} accepted the offer for *${updated.title}* — welcome to the team!`
      );
    }

    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const rescindOffer = async (c: Context<AppEnv>) => {
  try {
    const companyId = c.get('companyId') as string;
    const actor = await getActor(c);
    const service = new AtsService(c.env.DB);
    const updated = await service.rescindOffer(companyId, actor, (c.req.param('id') as string));
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

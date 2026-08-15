import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import { AtsService } from '../services/ats.service';
import { StorageService } from '../services/storage.service';
import { AppEnv } from '../types';

// No DNS/subdomain routing infra exists yet (companies.subdomain is set but
// never resolved anywhere else in the app), so the public careers URL
// carries an explicit identifier and this resolves it against either the
// friendly subdomain or the raw company id — forward-compatible with real
// host-based routing later without changing the route shape.
const resolveCompany = async (c: Context<AppEnv>, identifier: string) => {
  const db = drizzle(c.env.DB, { schema });
  return db.query.companies.findFirst({
    where: or(eq(schema.companies.subdomain, identifier), eq(schema.companies.id, identifier)),
  });
};

export const listOpenPositions = async (c: Context<AppEnv>) => {
  try {
    const company = await resolveCompany(c, (c.req.param('companyIdentifier') as string));
    if (!company) return c.json({ error: 'Company not found' }, 404);

    const db = drizzle(c.env.DB, { schema });
    const rows = await db.query.jobRequisitions.findMany({
      where: and(
        eq(schema.jobRequisitions.companyId, company.id),
        eq(schema.jobRequisitions.status, 'Open'),
        eq(schema.jobRequisitions.isPubliclyListed, true)
      ),
      orderBy: (jobRequisitions, { desc }) => [desc(jobRequisitions.dateOpened)],
    });

    return c.json({
      data: {
        company: { id: company.id, name: company.name, logoUrl: company.logoUrl },
        positions: rows,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

export const getOpenPosition = async (c: Context<AppEnv>) => {
  try {
    const company = await resolveCompany(c, (c.req.param('companyIdentifier') as string));
    if (!company) return c.json({ error: 'Company not found' }, 404);

    const db = drizzle(c.env.DB, { schema });
    const posting = await db.query.jobRequisitions.findFirst({
      where: and(
        eq(schema.jobRequisitions.id, (c.req.param('requisitionId') as string)),
        eq(schema.jobRequisitions.companyId, company.id),
        eq(schema.jobRequisitions.status, 'Open'),
        eq(schema.jobRequisitions.isPubliclyListed, true)
      ),
    });
    if (!posting) return c.json({ error: 'Position not found or no longer open' }, 404);

    return c.json({ data: { company: { id: company.id, name: company.name, logoUrl: company.logoUrl }, position: posting } });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

// Unauthenticated — no employeeId/role in context, so this always applies
// with source: 'Career Page' and never trusts client-supplied status/rating.
export const applyToPosition = async (c: Context<AppEnv>) => {
  try {
    const company = await resolveCompany(c, (c.req.param('companyIdentifier') as string));
    if (!company) return c.json({ error: 'Company not found' }, 404);

    const requisitionId = (c.req.param('requisitionId') as string);
    const db = drizzle(c.env.DB, { schema });
    const posting = await db.query.jobRequisitions.findFirst({
      where: and(
        eq(schema.jobRequisitions.id, requisitionId),
        eq(schema.jobRequisitions.companyId, company.id),
        eq(schema.jobRequisitions.status, 'Open'),
        eq(schema.jobRequisitions.isPubliclyListed, true)
      ),
    });
    if (!posting) return c.json({ error: 'Position not found or no longer open' }, 404);

    const contentType = c.req.header('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'Application must be submitted as multipart/form-data' }, 400);
    }
    const formData = await c.req.parseBody();
    const file = formData.resume as File | undefined;

    if (!formData.name || !formData.email) {
      return c.json({ error: 'name and email are required' }, 400);
    }
    // A resume-less application is still a valid application (some
    // candidates apply with just a LinkedIn/portfolio link) — only cap size
    // when a file is actually attached.
    if (file && file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'Resume must be under 10MB' }, 400);
    }

    let resumeFileKey: string | null = null;
    if (file && file.size > 0) {
      if (!c.env.BUCKET) return c.json({ error: 'File uploads are temporarily unavailable' }, 503);
      const storage = new StorageService(c.env.BUCKET);
      resumeFileKey = await storage.uploadFile(`companies/${company.id}/candidates/resumes`, file);
    }

    const ats = new AtsService(c.env.DB);
    const created = await ats.createCandidate(
      company.id,
      undefined,
      {
        requisitionId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        currentTitle: formData.currentTitle,
        currentEmployer: formData.currentEmployer,
        experienceYears: formData.experienceYears,
        education: formData.education,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        coverLetter: formData.coverLetter,
        source: 'Career Page',
      },
      resumeFileKey
    );

    return c.json({ data: { id: created.id, status: created.status } }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { CompanyDocumentService, DocumentActor } from '../../services/companyDocument.service';
import { AuditService } from '../../services/audit.service';
import { AppEnv } from '../../types';

// Same pattern as transition.controller.ts's getActor: the verified JWT only
// carries employeeId, so the human-readable name has to be resolved with a
// lookup rather than trusted from the client.
const getActor = async (c: Context<AppEnv>): Promise<DocumentActor> => {
  const employeeId = c.get('employeeId') as string | undefined;
  if (!employeeId) return { id: 'system', name: 'System' };

  const db = drizzle(c.env.DB, { schema });
  const employee = await db.query.employees.findFirst({ where: eq(schema.employees.id, employeeId) });
  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(' ') : 'Unknown';
  return { id: employeeId, name };
};

export class AdminCompanyDocumentController {
  static async list(c: Context<AppEnv>) {
    const companyId = c.get('companyId');
    const service = new CompanyDocumentService(c.env.DB);
    const documents = await service.list(companyId);
    return c.json({ data: documents });
  }

  static async create(c: Context<AppEnv>) {
    const companyId = c.get('companyId');
    const employeeId = c.get('employeeId');

    const service = new CompanyDocumentService(c.env.DB);
    const formData = await c.req.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const file = (formData.get('file') as unknown as File) || null;

    try {
      const actor = await getActor(c);
      const document = await service.create(companyId, actor, { title, content, file }, c.env.BUCKET);

      await new AuditService(c.env.DB).log(companyId, {
        actorId: employeeId,
        subjectId: document?.id,
        action: `Uploaded company document "${title}"`,
        module: 'documents',
        details: file ? `With attached file: ${file.name}` : 'Text only',
        ip: c.req.header('cf-connecting-ip'),
      });

      return c.json({ data: document }, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  static async remove(c: Context<AppEnv>) {
    const companyId = c.get('companyId');
    const employeeId = c.get('employeeId');
    const id = c.req.param('id');

    const service = new CompanyDocumentService(c.env.DB);
    try {
      const doc = await service.get(companyId, id);
      await service.delete(companyId, id, c.env.BUCKET);

      await new AuditService(c.env.DB).log(companyId, {
        actorId: employeeId,
        subjectId: id,
        action: `Deleted company document "${doc?.title || id}"`,
        module: 'documents',
        severity: 'warning',
        ip: c.req.header('cf-connecting-ip'),
      });

      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  }
}

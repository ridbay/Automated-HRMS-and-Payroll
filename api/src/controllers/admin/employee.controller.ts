import { Context } from 'hono';
import { EmployeeService } from '../../services/employee.service';
import { AuditService } from '../../services/audit.service';
import { MailgunService } from '../../services/mailgun.service';
import { WorkflowEngineService } from '../../services/workflowEngine.service';
import { AppEnv } from '../../types';

export const getEmployees = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const search = c.req.query('search');
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.getAllByCompany(companyId, search);
  return c.json(result);
};

export const getEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.getEmployeeProfile(companyId, employeeId);
  if (!result) return c.json({ error: 'Employee not found' }, 404);
  return c.json(result);
};

export const getDirectReports = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  
  const directReports = await service.getDirectReports(companyId, employeeId);
  return c.json(directReports);
};

export const createEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  
  try {
    const result = await service.createForCompany(companyId, body);
    await new AuditService(c.env.DB).log(companyId, {
      actorId: c.get('employeeId'),
      subjectId: result.id,
      action: `Created employee ${result.name} ${result.lastName}`,
      module: 'workforce',
      details: `Role: ${result.role} · Department: ${result.department || 'Unassigned'}`,
      ip: c.req.header('cf-connecting-ip'),
    });

    if (result.email) {
      new MailgunService(c.env.DB, c.env).sendWelcomeEmail(companyId, {
        email: result.email,
        firstName: result.name,
        lastName: result.lastName || '',
        jobTitle: result.jobTitle || result.role,
        startDate: result.startDate,
      }).catch(() => {});
    }

    new WorkflowEngineService(c.env.DB, c.env).trigger({
      companyId,
      workflowKey: 'onboarding',
      triggerEvent: 'employee.created',
      entityId: result.id,
      actorId: c.get('employeeId'),
      data: {
        employeeName: `${result.name} ${result.lastName || ''}`.trim(),
        email: result.email,
        jobTitle: result.jobTitle || result.role,
        department: result.department,
        startDate: result.startDate,
      },
    }).catch(() => {});

    return c.json(result, 201);
  } catch (err: any) {
    const errorMessage = err.message || '';
    const causeMessage = err.cause?.message || err.cause?.cause?.message || '';
    
    if (errorMessage.includes('UNIQUE constraint failed') || causeMessage.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'An employee with this email already exists.' }, 400);
    }
    
    return c.json({ error: errorMessage || 'Internal Server Error' }, 500);
  }
};

export const updateEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  
  const result = await service.updateEmployeeByAdmin(companyId, employeeId, body);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get('employeeId'),
    subjectId: employeeId,
    action: `Updated employee profile for ${result?.name || ''} ${result?.lastName || ''}`.trim(),
    module: 'workforce',
    details: `Changed: ${Object.keys(body).join(', ')}`,
    ip: c.req.header('cf-connecting-ip'),
  });
  return c.json(result);
};

export const resetTemporaryPassword = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);

  const result = await service.resetTemporaryPassword(companyId, employeeId);
  if (!result) return c.json({ error: 'Employee not found' }, 404);

  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get('employeeId'),
    subjectId: employeeId,
    action: `Reset temporary password for ${result.name} ${result.lastName}`.trim(),
    module: 'workforce',
    severity: 'warning',
    ip: c.req.header('cf-connecting-ip'),
  });
  return c.json(result);
};

export const deleteEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);

  // Grab the name before the row is gone — deleteEmployee only returns { success }.
  const subject = await service.getEmployeeProfile(companyId, employeeId);
  const result = await service.deleteEmployee(companyId, employeeId);
  await new AuditService(c.env.DB).log(companyId, {
    actorId: c.get('employeeId'),
    subjectId: c.get('employeeId'), // the deleted employee no longer exists to file this under
    action: `Deleted employee ${subject?.name || ''} ${subject?.lastName || ''}`.trim() || `Deleted employee ${employeeId}`,
    module: 'workforce',
    severity: 'warning',
    ip: c.req.header('cf-connecting-ip'),
  });
  return c.json(result);
};

export const addEmergencyContact = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const body = await c.req.json();
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.addEmergencyContact(companyId, employeeId, body);
  return c.json(result, 201);
};

export const deleteEmergencyContact = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const contactId = c.req.param('contactId') as string;
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.deleteEmergencyContact(companyId, employeeId, contactId);
  return c.json(result);
};

export const addDocument = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  
  const formData = await c.req.parseBody();
  const file = formData.file as File;
  const name = formData.name as string;
  const type = formData.type as string;
  
  if (!file) return c.json({ error: 'No file uploaded' }, 400);

  const result = await service.addDocument(companyId, employeeId, c.env.BUCKET, { name, type, file });
  return c.json(result, 201);
};

export const deleteDocument = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const documentId = c.req.param('documentId') as string;
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.deleteDocument(companyId, employeeId, c.env.BUCKET, documentId);
  return c.json(result);
};

export const getAuditLogs = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.getAuditLogs(companyId, employeeId);
  return c.json(result);
};

export const getAssets = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  const result = await service.getAssets(companyId, employeeId);
  return c.json(result);
};

export const addAsset = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  const result = await service.addAsset(companyId, employeeId, body);
  return c.json(result, 201);
};

export const deleteAsset = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const assetId = c.req.param('assetId') as string;
  const service = new EmployeeService(c.env.DB);
  const result = await service.deleteAsset(companyId, employeeId, assetId);
  return c.json(result);
};

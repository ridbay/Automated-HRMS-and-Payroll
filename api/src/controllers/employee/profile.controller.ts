import { Context } from 'hono';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

export const getMyProfile = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  const profile = await service.getEmployeeProfile(companyId, employeeId);
  if (!profile) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  return c.json(profile);
};

export const getDirectory = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  if (!companyId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  const directory = await service.getDirectory(companyId);
  return c.json(directory);
};

export const updateMyProfile = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  const data = await c.req.json();
  const profile = await service.updateEmployeeProfile(companyId, employeeId, data);

  if (!profile) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  return c.json(profile);
};

export const addEmergencyContact = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  const data = await c.req.json();
  const contact = await service.addEmergencyContact(companyId, employeeId, data);
  return c.json(contact);
};

export const deleteEmergencyContact = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const contactId = c.req.param('id');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  await service.deleteEmergencyContact(companyId as string, employeeId, contactId as string);
  return c.json({ success: true });
};

export const uploadDocument = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  const formData = await c.req.formData();
  const file = formData.get('file') as unknown as File;
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;

  if (!file || !name || !type) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const document = await service.addDocument(companyId as string, employeeId, c.env.BUCKET, { name, type, file });
  return c.json(document);
};

export const deleteDocument = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const documentId = c.req.param('id');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);
  await service.deleteDocument(companyId as string, employeeId, c.env.BUCKET, documentId as string);
  return c.json({ success: true });
};

export const downloadDocument = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const employeeId = c.get('employeeId');
  const documentId = c.req.param('id');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  const service = new EmployeeService(c.env.DB);

  try {
    const { file, doc } = await service.getDocumentFile(companyId as string, employeeId, c.env.BUCKET, documentId as string);
    c.header('Content-Type', file.httpMetadata?.contentType || 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${doc.name}"`);
    return c.body(file.body);
  } catch (err: any) {
    return c.json({ error: err.message }, 404);
  }
};

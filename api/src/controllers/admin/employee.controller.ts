import { Context } from 'hono';
import { EmployeeService } from '../../services/employee.service';
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
  
  const employees = await service.getAllByCompany(companyId);
  const directReports = employees.filter((emp: any) => emp.managerId === employeeId);
  return c.json(directReports);
};

export const createEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  
  try {
    const result = await service.createForCompany(companyId, body);
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
  return c.json(result);
};

export const deleteEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.req.param('id') as string;
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.deleteEmployee(companyId, employeeId);
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

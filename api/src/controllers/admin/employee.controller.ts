import { Context } from 'hono';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

export const getEmployees = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const service = new EmployeeService(c.env.DB);
  
  const result = await service.getAllByCompany(companyId);
  return c.json(result);
};

export const createEmployee = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  
  const result = await service.createForCompany(companyId, body);
  return c.json(result, 201);
};

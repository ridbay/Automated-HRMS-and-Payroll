import { Context } from 'hono';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

export const getMyProfile = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const service = new EmployeeService(c.env.DB);

  // Mock Auth: Auto-pick if missing
  if (!employeeId) {
    const defaultId = await service.getFirstEmployeeId(companyId);
    if (!defaultId) {
      return c.json({ error: 'No employee found to mock auth' }, 404);
    }
    employeeId = defaultId;
  }

  const profile = await service.getEmployeeProfile(companyId, employeeId);
  if (!profile) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  return c.json(profile);
};

export const updateMyProfile = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  let employeeId = c.req.header('x-employee-id');
  
  const service = new EmployeeService(c.env.DB);

  // Mock Auth: Auto-pick if missing
  if (!employeeId) {
    const defaultId = await service.getFirstEmployeeId(companyId);
    if (!defaultId) {
      return c.json({ error: 'No employee found to mock auth' }, 404);
    }
    employeeId = defaultId;
  }

  const data = await c.req.json();
  const profile = await service.updateEmployeeProfile(companyId, employeeId, data);
  
  if (!profile) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  return c.json(profile);
};

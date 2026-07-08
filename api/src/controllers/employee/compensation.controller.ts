import { Context } from 'hono';
import { BenefitsService } from '../../services/benefits.service';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

export const getMyCompensation = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  let employeeId = c.req.header('x-employee-id');
  
  try {
    const employeeService = new EmployeeService(c.env.DB);
    
    // Mock Auth: Auto-pick if missing
    if (!employeeId) {
      const defaultId = await employeeService.getFirstEmployeeId(companyId);
      if (!defaultId) {
        return c.json({ error: 'No employee found to mock auth' }, 404);
      }
      employeeId = defaultId;
    }

    const benefitsService = new BenefitsService(c.env.DB);
    const compensation = await benefitsService.getEmployeeCompensation(companyId, employeeId);
    return c.json(compensation);
  } catch (error: any) {
    console.error('Error fetching compensation:', error);
    return c.json({ error: error.message }, 500);
  }
};

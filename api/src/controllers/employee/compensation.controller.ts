import { Context } from 'hono';
import { BenefitsService } from '../../services/benefits.service';
import { AppEnv } from '../../types';

export const getMyCompensation = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId') as string;
  const employeeId = c.get('employeeId');

  if (!employeeId) {
    return c.json({ error: 'Unauthorized: No employee ID found' }, 401);
  }

  try {
    const benefitsService = new BenefitsService(c.env.DB);
    const compensation = await benefitsService.getEmployeeCompensation(companyId, employeeId);
    return c.json(compensation);
  } catch (error: any) {
    console.error('Error fetching compensation:', error);
    return c.json({ error: error.message }, 500);
  }
};

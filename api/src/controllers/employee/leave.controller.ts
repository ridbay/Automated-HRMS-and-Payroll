import { Context } from 'hono';
import { LeaveService } from '../../services/leave.service';
import { AppEnv } from '../../types';

export const getLeaveRequests = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const service = new LeaveService(c.env.DB);
  
  const result = await service.getAllByCompany(companyId);
  return c.json(result);
};

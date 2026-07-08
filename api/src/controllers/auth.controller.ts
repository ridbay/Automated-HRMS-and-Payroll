import { Context } from 'hono';
import { AuthService } from '../services/auth.service';
import { AppEnv } from '../types';

export const login = async (c: Context<AppEnv>) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const authService = new AuthService(c.env.DB);
    const jwtSecret = c.env.JWT_SECRET || 'fallback_secret_for_local_dev';
    
    const result = await authService.login(email, password, jwtSecret);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
};

export const changePassword = async (c: Context<AppEnv>) => {
  try {
    // Both employeeId and companyId should come from the verified JWT (or req header during initial auth)
    const employeeId = c.get('employeeId') || c.req.header('x-employee-id');
    if (!employeeId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new passwords are required' }, 400);
    }

    const authService = new AuthService(c.env.DB);
    await authService.changePassword(employeeId, currentPassword, newPassword);

    return c.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

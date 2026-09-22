import { Context } from 'hono';
import { AuthService } from '../services/auth.service';
import { AppEnv } from '../types';

// Refuse to sign tokens without a real secret rather than silently falling
// back to a predictable key any attacker could use — mirrors the same
// fail-closed check auth.middleware.ts applies on the verify side.
const requireJwtSecret = (c: Context<AppEnv>): string | null => {
  const jwtSecret = c.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[auth] JWT_SECRET env var is not set — refusing request');
  }
  return jwtSecret || null;
};

export const login = async (c: Context<AppEnv>) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const jwtSecret = requireJwtSecret(c);
    if (!jwtSecret) {
      return c.json({ error: 'Server misconfiguration: authentication unavailable' }, 503);
    }

    const authService = new AuthService(c.env.DB);
    const result = await authService.login(email, password, jwtSecret);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
};

export const changePassword = async (c: Context<AppEnv>) => {
  try {
    // employeeId is set by authMiddleware from the verified JWT — never trust a
    // client-supplied header for identity on a credential-mutating endpoint.
    const employeeId = c.get('employeeId');
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

export const registerCompany = async (c: Context<AppEnv>) => {
  try {
    const payload = await c.req.json();
    const { companyName, adminFirstName, adminLastName, adminEmail, adminPassword } = payload;
    
    if (!companyName || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    const jwtSecret = requireJwtSecret(c);
    if (!jwtSecret) {
      return c.json({ error: 'Server misconfiguration: authentication unavailable' }, 503);
    }

    const authService = new AuthService(c.env.DB);
    const result = await authService.registerCompany(payload, jwtSecret);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const forgotPassword = async (c: Context<AppEnv>) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const jwtSecret = requireJwtSecret(c);
    if (!jwtSecret) {
      return c.json({ error: 'Server misconfiguration: authentication unavailable' }, 503);
    }

    const authService = new AuthService(c.env.DB);
    const result = await authService.requestPasswordReset(email, jwtSecret);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const resetPassword = async (c: Context<AppEnv>) => {
  try {
    const { token, newPassword } = await c.req.json();
    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    const jwtSecret = requireJwtSecret(c);
    if (!jwtSecret) {
      return c.json({ error: 'Server misconfiguration: authentication unavailable' }, 503);
    }

    const authService = new AuthService(c.env.DB);
    const result = await authService.resetPassword(token, newPassword, jwtSecret);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

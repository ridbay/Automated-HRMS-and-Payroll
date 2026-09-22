import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';
import { sign, verify } from 'hono/jwt';
import { employees } from '../models/employee.model';
import * as schema from '../db/schema';

// Helper for PBKDF2 hashing
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
};

export const generateSalt = (): string => {
  return crypto.randomUUID();
};

export class AuthService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async login(email: string, passwordAttempt: string, jwtSecret: string) {
    const employee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.email, email),
    });

    if (!employee) {
      throw new Error('Invalid email or password');
    }

    if (!employee.passwordHash || !employee.passwordSalt) {
      // Allow them to set a password later if the admin hasn't generated one yet
      throw new Error('Account not fully set up. Contact HR.');
    }

    const hashedAttempt = await hashPassword(passwordAttempt, employee.passwordSalt);

    if (hashedAttempt !== employee.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Issue JWT
    const payload = {
      sub: employee.id,
      companyId: employee.companyId,
      role: employee.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
    };

    const token = await sign(payload, jwtSecret);

    return {
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role,
        avatar: employee.avatar,
        isPasswordChanged: employee.isPasswordChanged,
        companyId: employee.companyId,
        status: employee.status,
      }
    };
  }

  async changePassword(employeeId: string, currentPasswordAttempt: string, newPassword: string) {
    const employee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.id, employeeId),
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!employee.passwordHash || !employee.passwordSalt) {
      // Every employee is issued a password (temporary or self-set) at creation time —
      // this should be unreachable in practice. Refuse rather than silently accepting
      // any "current password" when there is nothing to verify it against.
      throw new Error('Account not fully set up. Contact HR.');
    }

    const hashedAttempt = await hashPassword(currentPasswordAttempt, employee.passwordSalt);
    if (hashedAttempt !== employee.passwordHash) {
      throw new Error('Invalid current password');
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    await this.db.update(employees)
      .set({
        passwordHash: newHash,
        passwordSalt: newSalt,
        isPasswordChanged: true,
      })
      .where(eq(employees.id, employeeId));

    return { success: true };
  }

  async registerCompany(payload: any, jwtSecret: string) {
    const { companyName, industry, adminFirstName, adminLastName, adminEmail, adminPassword } = payload;

    // Check if email already exists
    const existingEmployee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.email, adminEmail),
    });

    if (existingEmployee) {
      throw new Error('Email is already in use');
    }

    const companyId = `comp-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    const employeeId = `EMP-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

    // Create Company
    await this.db.insert(schema.companies).values({
      id: companyId,
      name: companyName,
      industry: industry || 'Software',
    });

    // Hash Password
    const salt = generateSalt();
    const hash = await hashPassword(adminPassword, salt);

    // Create Employee
    await this.db.insert(schema.employees).values({
      id: employeeId,
      companyId: companyId,
      name: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      role: 'SUPER_ADMIN',
      status: 'active',
      department: 'Administration',
      employmentType: 'Full-time',
      passwordHash: hash,
      passwordSalt: salt,
      isPasswordChanged: true,
    });

    // Issue JWT
    const tokenPayload = {
      sub: employeeId,
      companyId: companyId,
      role: 'SUPER_ADMIN',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
    };

    const token = await sign(tokenPayload, jwtSecret);

    return {
      token,
      employee: {
        id: employeeId,
        name: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        role: 'SUPER_ADMIN',
        avatar: null,
        isPasswordChanged: true,
        companyId: companyId,
        status: 'active',
      }
    };
  }

  async requestPasswordReset(email: string, jwtSecret: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const employee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.email, normalizedEmail),
    });

    if (!employee) {
      return {
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been dispatched.',
      };
    }

    // Sign a temporary reset token (valid for 15 minutes)
    const payload = {
      sub: employee.id,
      email: employee.email,
      purpose: 'password_reset',
      h: (employee.passwordHash || '').slice(0, 12),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    };

    const resetToken = await sign(payload, jwtSecret);

    return {
      success: true,
      message: 'Password reset token generated successfully.',
      resetToken,
      email: employee.email,
    };
  }

  async resetPassword(token: string, newPassword: string, jwtSecret: string) {
    if (!token || !newPassword) {
      throw new Error('Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    let payload: any;
    try {
      payload = await verify(token, jwtSecret, 'HS256');
    } catch {
      throw new Error('Invalid or expired password reset token');
    }

    if (!payload || payload.purpose !== 'password_reset' || !payload.sub) {
      throw new Error('Invalid password reset token');
    }

    const employee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.id, payload.sub),
    });

    if (!employee) {
      throw new Error('Employee account not found');
    }

    // Invalidate if token was already used (fingerprint changed)
    if (payload.h && (employee.passwordHash || '').slice(0, 12) !== payload.h) {
      throw new Error('This password reset token has already been used');
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    await this.db.update(schema.employees)
      .set({
        passwordHash: newHash,
        passwordSalt: newSalt,
        isPasswordChanged: true,
      })
      .where(eq(schema.employees.id, employee.id));

    return {
      success: true,
      message: 'Password has been reset successfully. You may now log in.',
    };
  }
}

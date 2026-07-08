import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';
import { sign } from 'hono/jwt';
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

    if (employee.passwordHash && employee.passwordSalt) {
      const hashedAttempt = await hashPassword(currentPasswordAttempt, employee.passwordSalt);
      if (hashedAttempt !== employee.passwordHash) {
        throw new Error('Invalid current password');
      }
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
}

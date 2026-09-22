import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService, hashPassword, generateSalt } from '../../src/services/auth.service';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('mocked_jwt_token'),
  verify: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'invalid') throw new Error('Invalid token');
    return { sub: 'emp-1', purpose: 'password_reset', h: 'valid_hash_o' };
  }),
}));

describe('Auth Service', () => {
  let mockDb: any;
  let service: AuthService;

  beforeEach(() => {
    mockDb = {
      query: {
        employees: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };

    service = new AuthService({} as any);
    (service as any).db = mockDb;
  });

  describe('Hash & Salt Utils', () => {
    it('should generate a valid UUID salt', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should hash a password deterministically with the same salt', async () => {
      const salt = generateSalt();
      const hash1 = await hashPassword('password123', salt);
      const hash2 = await hashPassword('password123', salt);
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
    });

    it('should produce different hashes for different passwords with the same salt', async () => {
      const salt = generateSalt();
      const hash1 = await hashPassword('password123', salt);
      const hash2 = await hashPassword('password456', salt);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('login', () => {
    it('should throw error if employee not found', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.login('test@test.com', 'password', 'secret')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if account is not fully set up (no hash/salt)', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ email: 'test@test.com' }); // No hash/salt
      await expect(service.login('test@test.com', 'password', 'secret')).rejects.toThrow('Account not fully set up');
    });

    it('should throw error on invalid password', async () => {
      const salt = generateSalt();
      const hash = await hashPassword('correct_password', salt);
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ 
        email: 'test@test.com',
        passwordSalt: salt,
        passwordHash: hash
      });

      await expect(service.login('test@test.com', 'wrong_password', 'secret')).rejects.toThrow('Invalid email or password');
    });

    it('should return token and employee details on successful login', async () => {
      const salt = generateSalt();
      const hash = await hashPassword('correct_password', salt);
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ 
        id: 'emp-1',
        email: 'test@test.com',
        name: 'John',
        lastName: 'Doe',
        role: 'EMPLOYEE',
        isPasswordChanged: true,
        passwordSalt: salt,
        passwordHash: hash
      });

      const result = await service.login('test@test.com', 'correct_password', 'secret');
      expect(result.token).toBe('mocked_jwt_token');
      expect(result.employee.id).toBe('emp-1');
      expect(result.employee.email).toBe('test@test.com');
    });
  });

  describe('changePassword', () => {
    it('should throw error if employee not found', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.changePassword('emp-1', 'old', 'new')).rejects.toThrow('Employee not found');
    });

    it('should throw error if account has no password set (never bypass the check)', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-1' }); // No hash/salt
      await expect(service.changePassword('emp-1', 'anything', 'new')).rejects.toThrow('Account not fully set up');
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should throw error if current password attempt is incorrect', async () => {
      const salt = generateSalt();
      const hash = await hashPassword('correct_old', salt);
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ 
        id: 'emp-1',
        passwordSalt: salt,
        passwordHash: hash
      });

      await expect(service.changePassword('emp-1', 'wrong_old', 'new')).rejects.toThrow('Invalid current password');
    });

    it('should update password hash and salt on success', async () => {
      const salt = generateSalt();
      const hash = await hashPassword('correct_old', salt);
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ 
        id: 'emp-1',
        passwordSalt: salt,
        passwordHash: hash
      });

      const result = await service.changePassword('emp-1', 'correct_old', 'new_password');
      expect(result.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      
      const setCallArgs = mockDb.set.mock.calls[0][0];
      expect(setCallArgs.isPasswordChanged).toBe(true);
      expect(setCallArgs.passwordHash).toBeDefined();
      expect(setCallArgs.passwordHash).not.toBe(hash);
      expect(setCallArgs.passwordSalt).toBeDefined();
      expect(setCallArgs.passwordSalt).not.toBe(salt);
    });
  });

  describe('registerCompany', () => {
    it('should throw error if email is already in use', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({ id: 'emp-1' });
      await expect(service.registerCompany({ adminEmail: 'test@test.com' }, 'secret')).rejects.toThrow('Email is already in use');
    });

    it('should register company, create admin employee, and return token', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce(undefined); // Email not in use
      
      const payload = {
        companyName: 'Test Corp',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@testcorp.com',
        adminPassword: 'secure_password'
      };

      const result = await service.registerCompany(payload, 'secret');
      
      // Verify company insert
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // One for company, one for employee
      
      // Verify token
      expect(result.token).toBe('mocked_jwt_token');
      expect(result.employee.role).toBe('SUPER_ADMIN');
      expect(result.employee.name).toBe('John');
      expect(result.employee.email).toBe('john@testcorp.com');
    });
  });

  describe('requestPasswordReset', () => {
    it('should throw if email is missing', async () => {
      await expect(service.requestPasswordReset('', 'secret')).rejects.toThrow('Email is required');
    });

    it('should return safe message when employee does not exist', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce(undefined);
      const res = await service.requestPasswordReset('nonexistent@company.com', 'secret');
      expect(res.success).toBe(true);
      expect(res.resetToken).toBeUndefined();
    });

    it('should generate resetToken when employee exists', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({
        id: 'emp-1',
        email: 'john@company.com',
        passwordHash: 'valid_hash_12345',
      });

      const res = await service.requestPasswordReset('john@company.com', 'secret');
      expect(res.success).toBe(true);
      expect(res.resetToken).toBe('mocked_jwt_token');
    });
  });

  describe('resetPassword', () => {
    it('should throw if token or new password is missing or short', async () => {
      await expect(service.resetPassword('', 'newpassword', 'secret')).rejects.toThrow('Reset token and new password are required');
      await expect(service.resetPassword('tok', '123', 'secret')).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should throw on invalid token', async () => {
      await expect(service.resetPassword('invalid', 'newpassword', 'secret')).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should reset password and update database on valid token', async () => {
      mockDb.query.employees.findFirst.mockResolvedValueOnce({
        id: 'emp-1',
        email: 'john@company.com',
        passwordHash: 'valid_hash_old',
      });

      const res = await service.resetPassword('valid-token', 'newpassword123', 'secret');
      expect(res.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      const setArgs = mockDb.set.mock.calls[0][0];
      expect(setArgs.isPasswordChanged).toBe(true);
      expect(setArgs.passwordHash).toBeDefined();
    });
  });
});

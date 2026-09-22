import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, changePassword, registerCompany, forgotPassword, resetPassword } from '../../src/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';

vi.mock('../../src/services/auth.service');

describe('Auth Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      req: {
        json: vi.fn(),
        header: vi.fn(),
      },
      env: { DB: {}, JWT_SECRET: 'secret' },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  describe('login', () => {
    it('should return 400 if email or password missing', async () => {
      mockContext.req.json.mockResolvedValueOnce({ email: 'test@test.com' });
      const res = await login(mockContext);
      
      expect(mockContext.json).toHaveBeenCalledWith({ error: 'Email and password are required' }, 400);
      expect(res.status).toBe(400);
    });

    it('should call AuthService.login and return result', async () => {
      mockContext.req.json.mockResolvedValueOnce({ email: 'test@test.com', password: 'password123' });
      AuthService.prototype.login = vi.fn().mockResolvedValue({ token: 'jwt' });

      const res = await login(mockContext);

      expect(AuthService.prototype.login).toHaveBeenCalledWith('test@test.com', 'password123', 'secret');
      expect(mockContext.json).toHaveBeenCalledWith({ token: 'jwt' });
    });

    it('should return 401 on login failure', async () => {
      mockContext.req.json.mockResolvedValueOnce({ email: 'test@test.com', password: 'wrong' });
      AuthService.prototype.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

      const res = await login(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith({ error: 'Invalid credentials' }, 401);
      expect(res.status).toBe(401);
    });
  });

  describe('changePassword', () => {
    it('should return 401 if employeeId is missing', async () => {
      mockContext.get.mockReturnValue(null);
      mockContext.req.header.mockReturnValue(null);

      const res = await changePassword(mockContext);
      expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    });

    it('should return 400 if passwords are missing', async () => {
      mockContext.get.mockReturnValue('emp-1');
      mockContext.req.json.mockResolvedValueOnce({ currentPassword: 'old' }); // Missing newPassword

      const res = await changePassword(mockContext);
      expect(mockContext.json).toHaveBeenCalledWith({ error: 'Current and new passwords are required' }, 400);
    });

    it('should call AuthService.changePassword on success', async () => {
      mockContext.get.mockReturnValue('emp-1');
      mockContext.req.json.mockResolvedValueOnce({ currentPassword: 'old', newPassword: 'new' });
      
      AuthService.prototype.changePassword = vi.fn().mockResolvedValue(undefined);

      const res = await changePassword(mockContext);

      expect(AuthService.prototype.changePassword).toHaveBeenCalledWith('emp-1', 'old', 'new');
      expect(mockContext.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });
  });

  describe('registerCompany', () => {
    it('should return 400 if fields are missing', async () => {
      mockContext.req.json.mockResolvedValueOnce({ companyName: 'Corp' }); // Missing other fields

      const res = await registerCompany(mockContext);
      expect(mockContext.json).toHaveBeenCalledWith({ error: 'All fields are required' }, 400);
    });

    it('should call AuthService.registerCompany', async () => {
      const payload = { companyName: 'Corp', adminFirstName: 'A', adminLastName: 'B', adminEmail: 'e@e.com', adminPassword: 'pwd' };
      mockContext.req.json.mockResolvedValueOnce(payload);
      
      AuthService.prototype.registerCompany = vi.fn().mockResolvedValue({ token: 'jwt' });

      const res = await registerCompany(mockContext);

      expect(AuthService.prototype.registerCompany).toHaveBeenCalledWith(payload, 'secret');
      expect(mockContext.json).toHaveBeenCalledWith({ token: 'jwt' });
    });
  });

  describe('forgotPassword', () => {
    it('should return 400 if email is missing', async () => {
      mockContext.req.json.mockResolvedValueOnce({});
      const res = await forgotPassword(mockContext);
      expect(mockContext.json).toHaveBeenCalledWith({ error: 'Email is required' }, 400);
      expect(res.status).toBe(400);
    });

    it('should call AuthService.requestPasswordReset with email and secret', async () => {
      mockContext.req.json.mockResolvedValueOnce({ email: 'user@company.com' });
      AuthService.prototype.requestPasswordReset = vi.fn().mockResolvedValue({
        success: true,
        resetToken: 'test-token',
      });

      const res = await forgotPassword(mockContext);
      expect(AuthService.prototype.requestPasswordReset).toHaveBeenCalledWith('user@company.com', 'secret');
      expect(mockContext.json).toHaveBeenCalledWith({ success: true, resetToken: 'test-token' });
    });
  });

  describe('resetPassword', () => {
    it('should return 400 if token or newPassword is missing', async () => {
      mockContext.req.json.mockResolvedValueOnce({ token: 'tok' });
      const res = await resetPassword(mockContext);
      expect(mockContext.json).toHaveBeenCalledWith({ error: 'Token and new password are required' }, 400);
      expect(res.status).toBe(400);
    });

    it('should call AuthService.resetPassword and return success', async () => {
      mockContext.req.json.mockResolvedValueOnce({ token: 'tok', newPassword: 'newpassword123' });
      AuthService.prototype.resetPassword = vi.fn().mockResolvedValue({
        success: true,
        message: 'Password has been reset successfully.',
      });

      const res = await resetPassword(mockContext);
      expect(AuthService.prototype.resetPassword).toHaveBeenCalledWith('tok', 'newpassword123', 'secret');
      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password has been reset successfully.',
      });
    });
  });
});

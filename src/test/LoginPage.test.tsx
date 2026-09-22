import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../features/core/LoginPage';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  loginUser: vi.fn(),
  changeUserPassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPasswordWithToken: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(client.loginUser).mockReset();
    vi.mocked(client.changeUserPassword).mockReset();
    vi.mocked(client.requestPasswordReset).mockReset();
    vi.mocked(client.resetPasswordWithToken).mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const fillLogin = (email = 'ada@acme.com', password = 'password123') => {
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: password } });
  };

  it('calls onLogin directly when the password has already been changed', async () => {
    vi.mocked(client.loginUser).mockResolvedValue({
      employee: { id: 'emp-1', isPasswordChanged: true },
      token: 'jwt-1',
    });
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    fillLogin();
    fireEvent.click(screen.getByText('Sign in to Dashboard'));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ id: 'emp-1', isPasswordChanged: true }, 'jwt-1'));
  });

  it('shows a forced password-change form instead of logging in when isPasswordChanged is false', async () => {
    vi.mocked(client.loginUser).mockResolvedValue({
      employee: { id: 'emp-1', isPasswordChanged: false },
      token: 'jwt-1',
    });
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    fillLogin();
    fireEvent.click(screen.getByText('Sign in to Dashboard'));

    await waitFor(() => expect(screen.getByText(/change your temporary password/)).toBeInTheDocument());
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('shows the login error and never calls onLogin on invalid credentials', async () => {
    vi.mocked(client.loginUser).mockRejectedValue(new Error('Invalid email or password'));
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    fillLogin();
    fireEvent.click(screen.getByText('Sign in to Dashboard'));

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument());
    expect(onLogin).not.toHaveBeenCalled();
  });

  describe('Forced password change', () => {
    const getToPasswordChangeStep = async () => {
      vi.mocked(client.loginUser).mockResolvedValue({
        employee: { id: 'emp-1', isPasswordChanged: false },
        token: 'temp-jwt',
      });
      const onLogin = vi.fn();
      render(<LoginPage onLogin={onLogin} />);
      fillLogin('ada@acme.com', 'temp-pass');
      fireEvent.click(screen.getByText('Sign in to Dashboard'));
      await waitFor(() => expect(screen.getByPlaceholderText('New password')).toBeInTheDocument());
      return onLogin;
    };

    it('blocks submission when the new passwords do not match', async () => {
      await getToPasswordChangeStep();

      fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass1' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'different' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument());
      expect(client.changeUserPassword).not.toHaveBeenCalled();
    });

    it('sets a temporary auth token, calls changeUserPassword, then logs in with the real session on success', async () => {
      const onLogin = await getToPasswordChangeStep();
      vi.mocked(client.changeUserPassword).mockResolvedValue({});

      fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass1' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass1' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(client.changeUserPassword).toHaveBeenCalledWith({ currentPassword: 'temp-pass', newPassword: 'newpass1' }));
      expect(onLogin).toHaveBeenCalledWith({ id: 'emp-1', isPasswordChanged: false }, 'temp-jwt');
    });

    it('removes the temporary token from localStorage if the password change itself fails', async () => {
      await getToPasswordChangeStep();
      vi.mocked(client.changeUserPassword).mockRejectedValue(new Error('Current password is incorrect'));

      fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass1' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass1' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(screen.getByText('Current password is incorrect')).toBeInTheDocument());
      expect(localStorage.getItem('zenhr_token')).toBeNull();
    });
  });

  describe('Forgot password flow', () => {
    it('shows an account-not-found error when the server returns no reset token', async () => {
      vi.mocked(client.requestPasswordReset).mockResolvedValue({});
      render(<LoginPage onLogin={vi.fn()} />);

      fireEvent.click(screen.getByText('Forgot?'));
      fireEvent.change(screen.getByPlaceholderText('employee@company.com'), { target: { value: 'nobody@acme.com' } });
      fireEvent.click(screen.getByText('Generate Reset Token'));

      await waitFor(() => expect(screen.getByText(/No account found with this email/)).toBeInTheDocument());
    });

    it('advances to the reset step once a token is issued', async () => {
      vi.mocked(client.requestPasswordReset).mockResolvedValue({ resetToken: 'RESET-TOKEN-123' });
      render(<LoginPage onLogin={vi.fn()} />);

      fireEvent.click(screen.getByText('Forgot?'));
      fireEvent.change(screen.getByPlaceholderText('employee@company.com'), { target: { value: 'ada@acme.com' } });
      fireEvent.click(screen.getByText('Generate Reset Token'));

      await waitFor(() => expect(screen.getByText('Create New Password')).toBeInTheDocument());
      expect(screen.getByDisplayValue('RESET-TOKEN-123')).toBeInTheDocument();
    });

    it('rejects a too-short new password on the reset step', async () => {
      vi.mocked(client.requestPasswordReset).mockResolvedValue({ resetToken: 'TOK-1' });
      render(<LoginPage onLogin={vi.fn()} />);

      fireEvent.click(screen.getByText('Forgot?'));
      fireEvent.change(screen.getByPlaceholderText('employee@company.com'), { target: { value: 'ada@acme.com' } });
      fireEvent.click(screen.getByText('Generate Reset Token'));
      await waitFor(() => expect(screen.getByText('Create New Password')).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText('•••••••• (min 6 characters)'), { target: { value: 'abc' } });
      // The confirm-password field's placeholder is a bare "••••••••", which
      // also matches the underlying sign-in form's own password field that
      // stays mounted behind this modal overlay — take the last password
      // input in the document (the modal's, since it renders after the form).
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      fireEvent.change(passwordInputs[passwordInputs.length - 1], { target: { value: 'abc' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument());
      expect(client.resetPasswordWithToken).not.toHaveBeenCalled();
    });

    it('completes the reset and pre-fills the sign-in form with the new credentials', async () => {
      vi.mocked(client.requestPasswordReset).mockResolvedValue({ resetToken: 'TOK-1' });
      vi.mocked(client.resetPasswordWithToken).mockResolvedValue({ message: 'All set!' });
      render(<LoginPage onLogin={vi.fn()} />);

      fireEvent.click(screen.getByText('Forgot?'));
      fireEvent.change(screen.getByPlaceholderText('employee@company.com'), { target: { value: 'ada@acme.com' } });
      fireEvent.click(screen.getByText('Generate Reset Token'));
      await waitFor(() => expect(screen.getByText('Create New Password')).toBeInTheDocument());

      // Same overlap as above: the underlying sign-in form's password field
      // is still in the DOM, so take the last two password inputs (the
      // modal's new + confirm fields, in that order) rather than the first two.
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const [newPassInput, confirmInput] = [passwordInputs[passwordInputs.length - 2], passwordInputs[passwordInputs.length - 1]];
      fireEvent.change(newPassInput, { target: { value: 'brandnew1' } });
      fireEvent.change(confirmInput, { target: { value: 'brandnew1' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(screen.getByText('Password Updated!')).toBeInTheDocument());
      expect(client.resetPasswordWithToken).toHaveBeenCalledWith({ token: 'TOK-1', newPassword: 'brandnew1' });

      fireEvent.click(screen.getByText('Return to Sign In'));
      expect((screen.getByPlaceholderText('name@company.com') as HTMLInputElement).value).toBe('ada@acme.com');
      expect((screen.getByPlaceholderText('••••••••') as HTMLInputElement).value).toBe('brandnew1');
    });
  });

  it('calls onNavigateRegister from "Start your free trial"', () => {
    const onNavigateRegister = vi.fn();
    render(<LoginPage onLogin={vi.fn()} onNavigateRegister={onNavigateRegister} />);
    fireEvent.click(screen.getByText('Start your free trial'));
    expect(onNavigateRegister).toHaveBeenCalled();
  });
});

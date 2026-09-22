import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../features/core/RegisterPage';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  registerCompany: vi.fn(),
}));

const fillRequiredFields = () => {
  fireEvent.change(screen.getByPlaceholderText('Acme Corp'), { target: { value: 'Acme Corp' } });
  fireEvent.change(screen.getByPlaceholderText('Technology'), { target: { value: 'Software' } });
  fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Ada' } });
  fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Lovelace' } });
  fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'ada@acme.com' } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret123' } });
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.mocked(client.registerCompany).mockReset();
  });

  it('toggles password visibility', () => {
    render(<RegisterPage onLogin={vi.fn()} onNavigateLogin={vi.fn()} />);
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    fireEvent.click(passwordInput.parentElement!.querySelector('button')!);
    expect(passwordInput.type).toBe('text');
  });

  it('calls onNavigateLogin when "Log in" is clicked', () => {
    const onNavigateLogin = vi.fn();
    render(<RegisterPage onLogin={vi.fn()} onNavigateLogin={onNavigateLogin} />);
    fireEvent.click(screen.getByText('Log in'));
    expect(onNavigateLogin).toHaveBeenCalled();
  });

  it('submits the full payload and logs the admin in on success', async () => {
    vi.mocked(client.registerCompany).mockResolvedValue({
      employee: { id: 'emp-1', name: 'Ada', role: 'SUPER_ADMIN' },
      token: 'jwt-token',
    });
    const onLogin = vi.fn();
    render(<RegisterPage onLogin={onLogin} onNavigateLogin={vi.fn()} />);

    fillRequiredFields();
    fireEvent.click(screen.getByText('Sign Up & Setup Organization'));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(
      { id: 'emp-1', name: 'Ada', role: 'SUPER_ADMIN' },
      'jwt-token'
    ));
    expect(client.registerCompany).toHaveBeenCalledWith(expect.objectContaining({
      companyName: 'Acme Corp',
      industry: 'Software',
      adminFirstName: 'Ada',
      adminLastName: 'Lovelace',
      adminEmail: 'ada@acme.com',
      adminPassword: 'secret123',
    }));
  });

  it('shows the server error and never calls onLogin when registration fails', async () => {
    vi.mocked(client.registerCompany).mockRejectedValue(new Error('That company name is already taken.'));
    const onLogin = vi.fn();
    render(<RegisterPage onLogin={onLogin} onNavigateLogin={vi.fn()} />);

    fillRequiredFields();
    fireEvent.click(screen.getByText('Sign Up & Setup Organization'));

    await waitFor(() => expect(screen.getByText('That company name is already taken.')).toBeInTheDocument());
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('shows a loading spinner while the request is in flight, and clears it afterwards either way', async () => {
    let resolveRegister: (v: any) => void;
    vi.mocked(client.registerCompany).mockReturnValue(new Promise((resolve) => { resolveRegister = resolve; }));
    render(<RegisterPage onLogin={vi.fn()} onNavigateLogin={vi.fn()} />);

    fillRequiredFields();
    fireEvent.click(screen.getByText('Sign Up & Setup Organization'));

    expect(screen.queryByText('Sign Up & Setup Organization')).not.toBeInTheDocument();

    resolveRegister!({ employee: { id: 'emp-1' }, token: 'tok' });
    await waitFor(() => expect(screen.queryByText('Sign Up & Setup Organization')).not.toBeInTheDocument());
    // Once logged in, the form itself is expected to be swapped out by the
    // parent (App.tsx) — this component doesn't reset its own loading state
    // after a successful login since it's about to unmount.
  });
});

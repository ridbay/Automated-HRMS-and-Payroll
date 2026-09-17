import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

const TestAuthConsumer = () => {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <div data-testid="auth-token">{token || 'none'}</div>
      <button
        data-testid="login-btn"
        onClick={() =>
          login(
            {
              id: 'emp-1',
              name: 'John Doe',
              email: 'john@zenhr.com',
              role: 'HR_ADMIN',
              companyId: 'comp-test',
            } as any,
            'jwt-token-123'
          )
        }
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with unauthenticated state when localStorage is empty', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  it('should store user in state and localStorage on login, and clear on logout', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('john@zenhr.com');
    expect(screen.getByTestId('auth-token').textContent).toBe('jwt-token-123');
    expect(localStorage.getItem('zenhr_token')).toBe('jwt-token-123');

    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    expect(localStorage.getItem('zenhr_token')).toBeNull();
  });
});

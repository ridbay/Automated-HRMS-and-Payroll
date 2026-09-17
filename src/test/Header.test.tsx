import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../layouts/Header';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider } from '../context/NavigationContext';
import { AuthContext } from '../context/AuthContext';

describe('Header Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const mockUser = {
    id: 'emp-1',
    name: 'Sarah Connor',
    email: 'sarah@zenhr.test',
    role: 'HR_ADMIN',
    companyId: 'comp-1',
    companyName: 'ZenHR Tech',
  };

  const mockLogout = vi.fn();

  const renderHeader = (user = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/payroll']}>
          <AuthContext.Provider
            value={{
              user: user as any,
              token: 'test-token',
              isAuthenticated: !!user,
              login: vi.fn(),
              logout: mockLogout,
              updateUser: vi.fn(),
            }}
          >
            <NavigationProvider>
              <Header />
            </NavigationProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders title and user information when logged in', () => {
    renderHeader();

    expect(screen.getByText('Payroll')).toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('HR ADMIN')).toBeInTheDocument();
  });

  it('toggles profile menu when clicking avatar', () => {
    renderHeader();

    const profileTrigger = screen.getByText('Sarah Connor').closest('div');
    expect(profileTrigger).toBeInTheDocument();

    fireEvent.click(profileTrigger!);
    expect(screen.getByText('Logout')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('returns null when user is not authenticated', () => {
    const { container } = renderHeader(null as any);
    expect(container.firstChild).toBeNull();
  });
});

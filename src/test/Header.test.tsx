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

  it('opens Command Palette when clicking search trigger', () => {
    renderHeader();

    const searchTrigger = screen.getByText('Global search...');
    expect(searchTrigger).toBeInTheDocument();

    fireEvent.click(searchTrigger);
    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeInTheDocument();
  });

  it('toggles Notification Center when clicking the bell icon', () => {
    renderHeader();

    const bellButton = screen.getByTitle('Notifications');
    expect(bellButton).toBeInTheDocument();

    fireEvent.click(bellButton);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText(/Payroll Batch Prepared/i)).toBeInTheDocument();
  });

  it('returns null when user is not authenticated', () => {
    const { container } = renderHeader(null as any);
    expect(container.firstChild).toBeNull();
  });

  it('renders topbar AI input space with friendly placeholder and allows typing', () => {
    renderHeader();

    const aiInput = screen.getByLabelText(/Ask ZenHR AI anything/i) as HTMLInputElement;
    expect(aiInput).toBeInTheDocument();
    expect(aiInput.placeholder).toMatch(/Ask (ZenHR )?AI/i);

    fireEvent.change(aiInput, { target: { value: 'How many leave days do I have?' } });
    expect(aiInput.value).toBe('How many leave days do I have?');
  });

  it('submits query from topbar AI input and opens AI assistant drawer', () => {
    renderHeader();

    const aiInput = screen.getByLabelText(/Ask ZenHR AI anything/i) as HTMLInputElement;
    fireEvent.change(aiInput, { target: { value: 'When is the next payday?' } });

    // Submit via form / Enter key
    fireEvent.submit(aiInput.closest('form')!);

    // AIAssistant should be open with the question
    expect(screen.getByText('When is the next payday?')).toBeInTheDocument();
    expect(screen.getByText('ZenHR Assistant')).toBeInTheDocument();
    expect(aiInput.value).toBe('');
  });

  it('opens AI assistant drawer when clicking the Sparkles button in topbar', () => {
    renderHeader();

    const openAiBtn = screen.getByTitle('ZenHR AI Assistant');
    expect(openAiBtn).toBeInTheDocument();

    fireEvent.click(openAiBtn);
    expect(screen.getByText('ZenHR Assistant')).toBeInTheDocument();
  });
});

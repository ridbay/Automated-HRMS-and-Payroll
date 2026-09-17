import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';

const TestConsumer = () => {
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar } = useNavigation();
  return (
    <div>
      <div data-testid="active-tab">{activeTab}</div>
      <div data-testid="sidebar-open">{isSidebarOpen ? 'open' : 'closed'}</div>
      <button data-testid="go-payroll" onClick={() => setActiveTab('payroll')}>Go Payroll</button>
      <button data-testid="toggle-sidebar" onClick={toggleSidebar}>Toggle</button>
    </div>
  );
};

describe('NavigationContext', () => {
  it('should initialize activeTab from URL path', () => {
    render(
      <MemoryRouter initialEntries={['/workforce']}>
        <NavigationProvider>
          <TestConsumer />
        </NavigationProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('active-tab').textContent).toBe('workforce');
    expect(screen.getByTestId('sidebar-open').textContent).toBe('open');
  });

  it('should update activeTab and toggle sidebar state', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <NavigationProvider>
          <TestConsumer />
        </NavigationProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('active-tab').textContent).toBe('dashboard');

    act(() => {
      screen.getByTestId('go-payroll').click();
    });

    expect(screen.getByTestId('active-tab').textContent).toBe('payroll');

    act(() => {
      screen.getByTestId('toggle-sidebar').click();
    });

    expect(screen.getByTestId('sidebar-open').textContent).toBe('closed');
  });
});

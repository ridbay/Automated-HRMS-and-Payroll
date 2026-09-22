import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import EmployeeOnboarding from '../features/employee/EmployeeOnboarding';

// framer-motion's AnimatePresence (mode="wait") wraps the step content here.
// In jsdom there's no real animation frame timing, so its exit transition
// never resolves and the previous step's DOM sticks around forever — any
// test that clicks through steps needs this stripped down to a plain
// pass-through, matching how the real DOM behaves once the CSS transition
// actually completes in a browser.
vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, ...rest
  }: any) => rest;
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref })),
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

// This is the flow the 2026-09-17 audit addendum documents as having shipped
// with a real bug: the completion handler used to call AuthContext.login with
// swapped arguments, corrupting the stored session instead of just patching
// the in-memory user. These tests pin the fixed behavior (a single updateUser
// call with the merged user object) so that regression can't silently return.

const mockUpdateUser = vi.fn();
const mockLogout = vi.fn();
const mockUser: any = {
  id: 'emp-1',
  name: 'Ada Lovelace',
  email: 'ada@zenhr.test',
  role: 'EMPLOYEE',
  status: 'onboarding',
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    updateUser: mockUpdateUser,
  }),
}));

const mockAlert = vi.fn();
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({
    alert: mockAlert,
    confirm: vi.fn(),
    prompt: vi.fn(),
  }),
}));

const mockMutate = vi.fn();
vi.mock('../api/client', () => ({
  useUpdateAdminEmployee: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe('EmployeeOnboarding wizard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdateUser.mockClear();
    mockLogout.mockClear();
    mockAlert.mockClear();
    mockMutate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const goToStep4WithBankDetails = () => {
    render(<EmployeeOnboarding />);

    // Step 1 -> 2
    fireEvent.click(screen.getByText('Continue'));
    // Step 2: fill required bank fields
    fireEvent.change(screen.getByDisplayValue('Select Bank...'), { target: { value: 'Zenith Bank' } });
    fireEvent.change(screen.getByPlaceholderText('10 digits'), { target: { value: '0123456789' } });
    // Step 2 -> 3 -> 4
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
  };

  it('starts on step 1 (Tax & Statutory) with Go Back effectively disabled', () => {
    render(<EmployeeOnboarding />);

    expect(screen.getByText('1. Tax & Statutory')).toBeInTheDocument();
    expect(screen.getByText('Go Back').className).toMatch(/opacity-30/);
  });

  it('advances through steps on Continue and swaps the button label to "Complete Profile" on the last step', () => {
    render(<EmployeeOnboarding />);

    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('2. Bank Details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('3. Document Upload')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('4. Emergency Contacts')).toBeInTheDocument();
    expect(screen.getByText('Complete Profile')).toBeInTheDocument();
  });

  it('blocks completion and never calls the mutation when bank name/account number are missing', () => {
    render(<EmployeeOnboarding />);

    fireEvent.click(screen.getByText('Continue')); // step 2
    fireEvent.click(screen.getByText('Continue')); // step 3
    fireEvent.click(screen.getByText('Continue')); // step 4
    fireEvent.click(screen.getByText('Complete Profile'));

    expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Bank Name and Account Number'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits with status "active" once bank details are present, and patches the session via updateUser (not login) after the success delay', () => {
    goToStep4WithBankDetails();

    fireEvent.click(screen.getByText('Complete Profile'));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        id: 'emp-1',
        data: expect.objectContaining({
          status: 'active',
          bankName: 'Zenith Bank',
          accountNumber: '0123456789',
        }),
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );

    // Simulate the mutation resolving successfully.
    const [, callbacks] = mockMutate.mock.calls[0];
    act(() => {
      callbacks.onSuccess({ id: 'emp-1', name: 'Ada Lovelace', status: 'onboarding' });
    });

    expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Welcome aboard'));
    // updateUser is deferred 3s so the celebration animation has time to play.
    expect(mockUpdateUser).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledWith({ id: 'emp-1', name: 'Ada Lovelace', status: 'active' });
  });

  it('surfaces the mutation error via popup instead of throwing', () => {
    goToStep4WithBankDetails();

    fireEvent.click(screen.getByText('Complete Profile'));

    const [, callbacks] = mockMutate.mock.calls[0];
    act(() => {
      callbacks.onError({ message: 'Network error' });
    });

    expect(mockAlert).toHaveBeenCalledWith('Network error');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

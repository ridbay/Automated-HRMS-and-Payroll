import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Payroll from '../features/payroll/Payroll';
import * as client from '../api/client';

// Payroll wraps its tab content in framer-motion's AnimatePresence
// (mode="wait"), which never resolves its exit transition in jsdom — so a
// tab-bar click that swaps activeTab leaves the previous tab's DOM stuck.
// Strip it down to a plain pass-through, matching real post-transition DOM.
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

const mockUser: any = { id: 'emp-1', name: 'Sarah Connor', role: 'HR_ADMIN' };

// Kept as stable spies (not a fresh vi.fn() per render, unlike the other
// mutation hooks below) because these two are the ones we actually assert
// call arguments on — a plain factory closure would hand back a new mock
// function on every re-render, losing the call history we need to inspect.
const { mockRecompute, mockSubmit, mockConfirm } = vi.hoisted(() => ({
  mockRecompute: vi.fn(),
  mockSubmit: vi.fn(),
  mockConfirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: vi.fn(), confirm: mockConfirm, prompt: vi.fn() }),
}));

const mutationStub = () => ({ mutate: vi.fn(), isPending: false });

vi.mock('../api/client', () => ({
  useEmployees: vi.fn(() => ({ data: [] })),
  usePayrollDashboard: vi.fn(() => ({ data: undefined, isLoading: false })),
  usePayrollPreview: vi.fn(() => ({ data: undefined, isLoading: false })),
  useRecomputePayrollPreview: vi.fn(() => ({ mutate: mockRecompute, isPending: false })),
  useSubmitPayrollRun: vi.fn(() => ({ mutate: mockSubmit, isPending: false })),
  usePayrollRuns: vi.fn(() => ({ data: [] })),
  usePayrollRun: vi.fn(() => ({ data: undefined })),
  useApprovePayrollRun: vi.fn(() => mutationStub()),
  useRejectPayrollRun: vi.fn(() => mutationStub()),
  useMarkPayrollRunPaid: vi.fn(() => mutationStub()),
  useDisbursePayrollRun: vi.fn(() => mutationStub()),
  downloadPayrollBankFile: vi.fn(),
  useComplianceTasks: vi.fn(() => ({ data: [] })),
  useCompleteComplianceTask: vi.fn(() => mutationStub()),
  useTaxBrackets: vi.fn(() => ({ data: [] })),
  useUpdateTaxBrackets: vi.fn(() => mutationStub()),
  useLoans: vi.fn(() => ({ data: [] })),
  useCreateLoan: vi.fn(() => mutationStub()),
  useDeleteLoan: vi.fn(() => mutationStub()),
  useLoanRepayments: vi.fn(() => ({ data: [] })),
  useSalaryComponents: vi.fn(() => ({ data: [] })),
  useCreateSalaryComponent: vi.fn(() => mutationStub()),
  useDeleteSalaryComponent: vi.fn(() => mutationStub()),
  usePayGrades: vi.fn(() => ({ data: [] })),
  useCreatePayGrade: vi.fn(() => mutationStub()),
  useDeletePayGrade: vi.fn(() => mutationStub()),
  usePayrollSettings: vi.fn(() => ({ data: null })),
  useUpdatePayrollSettings: vi.fn(() => mutationStub()),
}));

describe('Payroll (admin) dashboard and tab routing', () => {
  beforeEach(() => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({ data: undefined, isLoading: false } as any);
    vi.mocked(client.usePayrollRuns).mockReturnValue({ data: [] } as any);
    vi.mocked(client.useComplianceTasks).mockReturnValue({ data: [] } as any);
    mockUser.role = 'HR_ADMIN';
  });

  it('shows "Start Payroll Run" and a no-exceptions empty state when no run exists yet for the period', () => {
    render(<Payroll />);

    expect(screen.getByText('Start Payroll Run')).toBeInTheDocument();
    expect(screen.getByText('No Run Yet · Preview')).toBeInTheDocument();
    expect(screen.getByText(/No exceptions — every active employee is payroll-ready/)).toBeInTheDocument();
  });

  it('switches to "Continue Processing" and shows the run status once a run exists for the selected period', () => {
    const now = new Date();
    vi.mocked(client.usePayrollRuns).mockReturnValue({
      data: [{ id: 'RUN-1', periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(), status: 'pending_approval', createdAt: '2026-01-01T00:00:00Z' }],
    } as any);

    render(<Payroll />);

    expect(screen.getByText('Continue Processing')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.queryByText('Start Payroll Run')).not.toBeInTheDocument();
  });

  it('hides write actions and the Salary Setup tab, and shows a read-only notice, for a non-write role', () => {
    mockUser.role = 'MANAGER';

    render(<Payroll />);

    expect(screen.getByText(/\(Read-only access\)/)).toBeInTheDocument();
    expect(screen.queryByText('Start Payroll Run')).not.toBeInTheDocument();
    expect(screen.queryByText('Salary Setup')).not.toBeInTheDocument();
  });

  it('opens directly on the Compliance tab when initialTab="compliance" is passed', () => {
    render(<Payroll initialTab="compliance" />);

    expect(screen.getByText('Tax Configuration')).toBeInTheDocument();
    expect(screen.getByText('Remittance History')).toBeInTheDocument();
    expect(screen.getByText(/No remittance tasks yet/)).toBeInTheDocument();
    // The dashboard content shouldn't also be mounted underneath it.
    expect(screen.queryByText('Payroll Exceptions')).not.toBeInTheDocument();
  });

  it('renders remittance tasks with amount and status when compliance tasks exist', () => {
    vi.mocked(client.useComplianceTasks).mockReturnValue({
      data: [{ id: 'CT-1', title: 'PAYE Remittance', dueDate: '2026-02-10', amount: 150000, status: 'pending' }],
    } as any);

    render(<Payroll initialTab="compliance" />);

    expect(screen.getByText('PAYE Remittance')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('navigates from Dashboard to Compliance via the tab bar', () => {
    render(<Payroll />);

    expect(screen.getByText('Payroll Exceptions')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Compliance'));
    expect(screen.getByText('Tax Configuration')).toBeInTheDocument();
  });
});

describe('Payroll Run Wizard', () => {
  const now = new Date();

  beforeEach(() => {
    vi.mocked(client.usePayrollDashboard).mockReturnValue({ data: undefined, isLoading: false } as any);
    vi.mocked(client.usePayrollRuns).mockReturnValue({ data: [] } as any); // no run yet -> preview drives the wizard
    vi.mocked(client.usePayrollRun).mockReturnValue({ data: undefined } as any);
    mockUser.role = 'HR_ADMIN';
    mockRecompute.mockClear();
    mockSubmit.mockClear();
    mockConfirm.mockClear().mockResolvedValue(true);
  });

  it('flags a mid-month hire as "Prorated" on the Attendance step', () => {
    vi.mocked(client.usePayrollPreview).mockReturnValue({
      data: {
        payslips: [{ employeeId: 'E1', employeeName: 'Ada Lovelace', isProrated: true, presentDays: 10, workingDays: 20, absentDays: 0, overtimeHours: 0 }],
        exceptions: [],
      },
      isLoading: false,
    } as any);

    render(<Payroll initialTab="wizard" />);

    expect(screen.getByText('Attendance & Time Review')).toBeInTheDocument();
    expect(screen.getByText('Prorated')).toBeInTheDocument();
  });

  it('tracks a per-employee bonus override, keyed by employeeId, when the Bonuses field changes', () => {
    // Two employees, so this also pins that overrides are keyed correctly
    // rather than accidentally shared/overwritten across rows.
    vi.mocked(client.usePayrollPreview).mockReturnValue({
      data: {
        payslips: [
          { employeeId: 'E1', employeeName: 'Ada Lovelace', department: 'Engineering', grossPay: 500000, basicSalary: 200000, allowances: 300000, bonuses: 5000, overtimeHours: 0 },
          { employeeId: 'E2', employeeName: 'Grace Hopper', department: 'Engineering', grossPay: 600000, basicSalary: 240000, allowances: 360000, bonuses: 1000, overtimeHours: 0 },
        ],
        exceptions: [],
      },
      isLoading: false,
    } as any);

    render(<Payroll initialTab="wizard" />);
    fireEvent.click(screen.getByText('Earnings'));

    const adaBonusInput = screen.getByDisplayValue('5000') as HTMLInputElement;
    fireEvent.change(adaBonusInput, { target: { value: '7500' } });

    // Ada's field reflects the override; Grace's is untouched by it.
    expect(screen.getByDisplayValue('7500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('blocks Submit and lists each red-severity exception on the Review step', () => {
    vi.mocked(client.usePayrollPreview).mockReturnValue({
      data: {
        payslips: [{ employeeId: 'E1', employeeName: 'Bob Marley', grossPay: 400000, netPay: 350000 }],
        exceptions: [{ severity: 'red', employeeName: 'Bob Marley', issue: 'Missing bank details' }],
        totalGross: 400000, totalNet: 350000,
      },
      isLoading: false,
    } as any);

    render(<Payroll initialTab="wizard" />);
    fireEvent.click(screen.getByText('Review'));

    expect(screen.getByText(/1 blocking exception — resolve before submitting/)).toBeInTheDocument();
    expect(screen.getByText('Bob Marley: Missing bank details')).toBeInTheDocument();
    expect(screen.getByText('Submit for Approval')).toBeDisabled();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('allows Submit and calls the mutation once no blocking exceptions remain', async () => {
    vi.mocked(client.usePayrollPreview).mockReturnValue({
      data: {
        payslips: [{ employeeId: 'E1', employeeName: 'Bob Marley', grossPay: 400000, netPay: 350000 }],
        exceptions: [],
        totalGross: 400000, totalNet: 350000,
      },
      isLoading: false,
    } as any);

    render(<Payroll initialTab="wizard" />);
    fireEvent.click(screen.getByText('Review'));

    expect(screen.queryByText(/blocking exception/)).not.toBeInTheDocument();
    const submitButton = screen.getByText('Submit for Approval');
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    await Promise.resolve(); // let the confirm() promise settle before the mutate call fires

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockSubmit).toHaveBeenCalledWith(
      { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(), overrides: {} },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('tells the user payment is still pending on the Post-Payroll step until the run is actually paid', () => {
    vi.mocked(client.usePayrollPreview).mockReturnValue({
      data: { payslips: [], exceptions: [] },
      isLoading: false,
    } as any);

    render(<Payroll initialTab="wizard" />);
    fireEvent.click(screen.getByText('Post-Payroll'));

    expect(screen.getByText(/hasn't been paid yet — complete Payment \(step 6\) first/)).toBeInTheDocument();
  });
});

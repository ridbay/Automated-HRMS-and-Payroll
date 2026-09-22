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

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ setActiveTab: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: vi.fn(), confirm: vi.fn().mockResolvedValue(true), prompt: vi.fn() }),
}));

const mutationStub = () => ({ mutate: vi.fn(), isPending: false });

vi.mock('../api/client', () => ({
  useEmployees: vi.fn(() => ({ data: [] })),
  usePayrollDashboard: vi.fn(() => ({ data: undefined, isLoading: false })),
  usePayrollPreview: vi.fn(() => ({ data: undefined, isLoading: false })),
  useRecomputePayrollPreview: vi.fn(() => mutationStub()),
  useSubmitPayrollRun: vi.fn(() => mutationStub()),
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

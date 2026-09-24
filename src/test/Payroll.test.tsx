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
  // Cached per tag so the same component type is reused across renders —
  // an uncached Proxy trap returns a brand-new forwardRef() on every access,
  // and React remounts (rather than updates) a subtree whose component type
  // changed identity, which silently invalidates any DOM node reference a
  // test captured before a re-render.
  const componentCache = new Map<string, any>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!componentCache.has(tag)) {
          componentCache.set(
            tag,
            React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref }))
          );
        }
        return componentCache.get(tag);
      },
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
const {
  mockRecompute,
  mockSubmit,
  mockConfirm,
  mockCreateLoan,
  mockUpdateLoan,
  mockDeleteLoan,
  mockRecordLoanRepayment,
  mockCreateSalaryComponent,
  mockUpdateSalaryComponent,
  mockDeleteSalaryComponent,
  mockCreatePayGrade,
  mockUpdatePayGrade,
  mockDeletePayGrade,
  mockUpdatePayrollSettings,
} = vi.hoisted(() => ({
  mockRecompute: vi.fn(),
  mockSubmit: vi.fn(),
  mockConfirm: vi.fn().mockResolvedValue(true),
  mockCreateLoan: vi.fn(),
  mockUpdateLoan: vi.fn(),
  mockDeleteLoan: vi.fn(),
  mockRecordLoanRepayment: vi.fn(),
  mockCreateSalaryComponent: vi.fn(),
  mockUpdateSalaryComponent: vi.fn(),
  mockDeleteSalaryComponent: vi.fn(),
  mockCreatePayGrade: vi.fn(),
  mockUpdatePayGrade: vi.fn(),
  mockDeletePayGrade: vi.fn(),
  mockUpdatePayrollSettings: vi.fn(),
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

const mutationStub = (mutateFn = vi.fn()) => ({ mutate: mutateFn, isPending: false });

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
  useCreateLoan: vi.fn(() => mutationStub(mockCreateLoan)),
  useUpdateLoan: vi.fn(() => mutationStub(mockUpdateLoan)),
  useDeleteLoan: vi.fn(() => mutationStub(mockDeleteLoan)),
  useLoanRepayments: vi.fn(() => ({ data: [] })),
  useRecordLoanRepayment: vi.fn(() => mutationStub(mockRecordLoanRepayment)),
  useSalaryComponents: vi.fn(() => ({ data: [] })),
  useCreateSalaryComponent: vi.fn(() => mutationStub(mockCreateSalaryComponent)),
  useUpdateSalaryComponent: vi.fn(() => mutationStub(mockUpdateSalaryComponent)),
  useDeleteSalaryComponent: vi.fn(() => mutationStub(mockDeleteSalaryComponent)),
  usePayGrades: vi.fn(() => ({ data: [] })),
  useCreatePayGrade: vi.fn(() => mutationStub(mockCreatePayGrade)),
  useUpdatePayGrade: vi.fn(() => mutationStub(mockUpdatePayGrade)),
  useDeletePayGrade: vi.fn(() => mutationStub(mockDeletePayGrade)),
  usePayrollSettings: vi.fn(() => ({ data: null })),
  useUpdatePayrollSettings: vi.fn(() => mutationStub(mockUpdatePayrollSettings)),
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

describe('Payroll Administration: Loans & Advances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.role = 'HR_ADMIN';
    vi.mocked(client.useEmployees).mockReturnValue({
      data: [
        { id: 'emp-1', name: 'John', lastName: 'Doe', email: 'john@example.com' },
        { id: 'emp-2', name: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ],
    } as any);
  });

  it('renders active loans with balances and summary metrics', () => {
    vi.mocked(client.useLoans).mockReturnValue({
      data: [
        {
          id: 'loan-1',
          employeeId: 'emp-1',
          employeeName: 'John Doe',
          type: 'personal',
          principal: 500000,
          remainingBalance: 300000,
          monthlyInstallment: 50000,
          status: 'active',
          purpose: 'Emergency home repair',
        },
      ],
      isLoading: false,
    } as any);

    render(<Payroll initialTab="loans" />);

    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Emergency home repair')).toBeInTheDocument();
    expect(screen.getAllByText('₦300,000').length).toBeGreaterThan(0);
    expect(screen.getByText('New Loan Setup')).toBeInTheDocument();
  });

  it('filters loans by search and status filter', () => {
    vi.mocked(client.useLoans).mockReturnValue({
      data: [
        {
          id: 'loan-1',
          employeeId: 'emp-1',
          employeeName: 'John Doe',
          type: 'personal',
          principal: 500000,
          remainingBalance: 300000,
          monthlyInstallment: 50000,
          status: 'active',
          purpose: 'Personal support',
        },
        {
          id: 'loan-2',
          employeeId: 'emp-2',
          employeeName: 'Jane Smith',
          type: 'emergency',
          principal: 100000,
          remainingBalance: 0,
          monthlyInstallment: 20000,
          status: 'completed',
          purpose: 'Medical bills',
        },
      ],
      isLoading: false,
    } as any);

    render(<Payroll initialTab="loans" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search staff or purpose…');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('opens New Loan Setup modal and calls useCreateLoan on submit', () => {
    vi.mocked(client.useLoans).mockReturnValue({ data: [], isLoading: false } as any);

    render(<Payroll initialTab="loans" />);

    fireEvent.click(screen.getByText('New Loan Setup'));
    expect(screen.getAllByText('New Loan Setup').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'emp-1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500000'), { target: { value: '250000' } });

    fireEvent.click(screen.getByText('Create Loan'));

    expect(mockCreateLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'emp-1',
        principal: 250000,
      }),
      expect.any(Object)
    );
  });
});

describe('Payroll Administration: General Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.role = 'HR_ADMIN';
  });

  it('renders General Configuration with settings and saves updates', () => {
    vi.mocked(client.usePayrollSettings).mockReturnValue({
      data: {
        pensionEmployerRate: 10,
        pensionEmployeeRate: 8,
        nhfRate: 2.5,
        nsitfRate: 1,
        itfRate: 1,
        paymentDay: 25,
        currency: 'NGN',
        payrollLocked: false,
      },
    } as any);

    render(<Payroll initialTab="settings" />);

    expect(screen.getAllByText('General Configuration').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();

    const dayInput = screen.getByDisplayValue('25');
    fireEvent.change(dayInput, { target: { value: '28' } });

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockUpdatePayrollSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentDay: 28,
        pensionEmployerRate: 10,
        pensionEmployeeRate: 8,
      }),
      expect.any(Object)
    );
  });
});

describe('Payroll Administration: Salary Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.role = 'HR_ADMIN';
  });

  it('switches to Salary Components, lists components and opens Add Component modal', () => {
    vi.mocked(client.useSalaryComponents).mockReturnValue({
      data: [
        {
          id: 'comp-1',
          name: 'Basic Salary',
          code: 'BASIC',
          type: 'earning',
          taxable: true,
          statutory: true,
          description: 'Base pay element',
        },
        {
          id: 'comp-2',
          name: 'Housing Allowance',
          code: 'HOUSING',
          type: 'earning',
          taxable: true,
          statutory: false,
        },
      ],
      isLoading: false,
    } as any);

    render(<Payroll initialTab="settings" />);

    // Switch to Salary Components sub-tab
    fireEvent.click(screen.getByText('Salary Components'));

    expect(screen.getByText('BASIC')).toBeInTheDocument();
    expect(screen.getByText('HOUSING')).toBeInTheDocument();
    expect(screen.getByText('Statutory')).toBeInTheDocument();

    // Open add component modal
    fireEvent.click(screen.getByText('Add Component'));
    expect(screen.getByText('New Salary Component')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Remote Work Stipend/i), { target: { value: 'Transport Allowance' } });
    fireEvent.change(screen.getByPlaceholderText(/TRANSPORT/i), { target: { value: 'TRANS' } });

    fireEvent.click(screen.getByText('Create Component'));

    expect(mockCreateSalaryComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Transport Allowance',
        code: 'TRANS',
        type: 'earning',
      }),
      expect.any(Object)
    );
  });
});

describe('Payroll Administration: Pay Grades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.role = 'HR_ADMIN';
  });

  it('switches to Pay Grades, lists grades and opens Create Pay Grade modal', () => {
    vi.mocked(client.usePayGrades).mockReturnValue({
      data: [
        {
          id: 'pg-1',
          name: 'Junior Software Engineer',
          code: 'ENG-L1',
          level: 1,
          minSalary: 350000,
          maxSalary: 550000,
          currency: 'NGN',
        },
      ],
      isLoading: false,
    } as any);

    render(<Payroll initialTab="settings" />);

    // Switch to Pay Grades sub-tab
    fireEvent.click(screen.getByText('Pay Grades'));

    expect(screen.getByText('Junior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('ENG-L1')).toBeInTheDocument();
    expect(screen.getByText('₦350,000 – ₦550,000')).toBeInTheDocument();

    // Open Add Pay Grade modal
    fireEvent.click(screen.getByText('New Grade'));
    expect(screen.getByText('New Pay Grade')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Senior Principal/i), { target: { value: 'Principal Architect' } });
    fireEvent.change(screen.getByPlaceholderText(/ENG-L1/i), { target: { value: 'ARCH-01' } });
    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '5' } });
    const zeroInputs = screen.getAllByDisplayValue('0');
    fireEvent.change(zeroInputs[0], { target: { value: '1500000' } });
    fireEvent.change(zeroInputs[1], { target: { value: '2500000' } });

    fireEvent.click(screen.getByText('Create Pay Grade'));

    expect(mockCreatePayGrade).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Principal Architect',
        code: 'ARCH-01',
        level: 5,
        minSalary: 1500000,
        maxSalary: 2500000,
      }),
      expect.any(Object)
    );
  });
});


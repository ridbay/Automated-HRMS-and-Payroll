import { Hono } from 'hono';
import {
  getPayrollSettings,
  updatePayrollSettings,
  getTaxBrackets,
  updateTaxBrackets,
  getSalaryComponents,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  getPayGrades,
  createPayGrade,
  updatePayGrade,
  deletePayGrade,
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanRepayments,
  recordLoanRepayment,
  previewPayroll,
  recomputePreview,
  submitPayrollRun,
  getPayrollRuns,
  getPayrollRun,
  approvePayrollRun,
  rejectPayrollRun,
  markPayrollRunPaid,
  getBankFile,
  getRemittanceSchedule,
  getComplianceTasks,
  completeComplianceTask,
  getPayrollDashboard,
  getEmployeePayslips,
  disbursePayrollRun,
  validateBankAccount,
  getMonnifyBanks,
} from '../controllers/admin/payroll.controller';
import { requireRole, requirePermission } from '../middlewares/role.middleware';

const payrollRoutes = new Hono();

// companyId/employeeId/role are already set by authMiddleware, applied to the whole
// /admin group upstream (admin.routes.ts). Do NOT layer tenantMiddleware here — it
// would overwrite the JWT-derived companyId with a client-supplied x-company-id
// header/query param, letting an authenticated user spoof another tenant's payroll
// data (or simply 401 every request, since the real frontend never sends that header).

// Only administrators and payroll officers may configure or process payroll (Table 3.1).
// Line managers have no payroll access.
// requirePermission narrows further for anyone assigned a custom role (no-op otherwise).
const adminOnly = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_OFFICER');

// Settings
payrollRoutes.get('/settings', adminOnly, requirePermission('payroll', 'view'), getPayrollSettings);
payrollRoutes.put('/settings', adminOnly, requirePermission('payroll', 'edit'), updatePayrollSettings);

// Tax brackets
payrollRoutes.get('/tax-brackets', adminOnly, requirePermission('payroll', 'view'), getTaxBrackets);
payrollRoutes.put('/tax-brackets', adminOnly, requirePermission('payroll', 'edit'), updateTaxBrackets);

// Salary components
payrollRoutes.get('/salary-components', adminOnly, requirePermission('payroll', 'view'), getSalaryComponents);
payrollRoutes.post('/salary-components', adminOnly, requirePermission('payroll', 'create'), createSalaryComponent);
payrollRoutes.put('/salary-components/:id', adminOnly, requirePermission('payroll', 'edit'), updateSalaryComponent);
payrollRoutes.delete('/salary-components/:id', adminOnly, requirePermission('payroll', 'delete'), deleteSalaryComponent);

// Pay grades
payrollRoutes.get('/pay-grades', adminOnly, requirePermission('payroll', 'view'), getPayGrades);
payrollRoutes.post('/pay-grades', adminOnly, requirePermission('payroll', 'create'), createPayGrade);
payrollRoutes.put('/pay-grades/:id', adminOnly, requirePermission('payroll', 'edit'), updatePayGrade);
payrollRoutes.delete('/pay-grades/:id', adminOnly, requirePermission('payroll', 'delete'), deletePayGrade);

// Loans
payrollRoutes.get('/loans', adminOnly, requirePermission('payroll', 'view'), getLoans);
payrollRoutes.post('/loans', adminOnly, requirePermission('payroll', 'create'), createLoan);
payrollRoutes.put('/loans/:id', adminOnly, requirePermission('payroll', 'edit'), updateLoan);
payrollRoutes.delete('/loans/:id', adminOnly, requirePermission('payroll', 'delete'), deleteLoan);
payrollRoutes.get('/loans/:id/repayments', adminOnly, requirePermission('payroll', 'view'), getLoanRepayments);
payrollRoutes.post('/loans/:id/repayments', adminOnly, requirePermission('payroll', 'edit'), recordLoanRepayment);

// Preview
payrollRoutes.get('/preview', adminOnly, requirePermission('payroll', 'view'), previewPayroll);
payrollRoutes.post('/preview', adminOnly, requirePermission('payroll', 'edit'), recomputePreview);

// Dashboard
payrollRoutes.get('/dashboard', adminOnly, requirePermission('payroll', 'view'), getPayrollDashboard);

// Payroll runs
payrollRoutes.post('/runs', adminOnly, requirePermission('payroll', 'create'), submitPayrollRun);
payrollRoutes.get('/runs', adminOnly, requirePermission('payroll', 'view'), getPayrollRuns);
// Run detail includes each payslip's bank account snapshot, so it stays admin-only.
payrollRoutes.get('/runs/:id', adminOnly, requirePermission('payroll', 'view'), getPayrollRun);
payrollRoutes.post('/runs/:id/approve', adminOnly, requirePermission('payroll', 'approve'), approvePayrollRun);
payrollRoutes.post('/runs/:id/reject', adminOnly, requirePermission('payroll', 'edit'), rejectPayrollRun);
payrollRoutes.post('/runs/:id/disburse', adminOnly, requirePermission('payroll', 'edit'), disbursePayrollRun);
payrollRoutes.post('/runs/:id/mark-paid', adminOnly, requirePermission('payroll', 'edit'), markPayrollRunPaid);
payrollRoutes.get('/runs/:id/bank-file', adminOnly, requirePermission('payroll', 'view'), getBankFile);
payrollRoutes.get('/runs/:id/remittance/:type', adminOnly, requirePermission('payroll', 'view'), getRemittanceSchedule);
payrollRoutes.get('/banks', adminOnly, requirePermission('payroll', 'view'), getMonnifyBanks);
payrollRoutes.get('/validate-account', adminOnly, requirePermission('payroll', 'view'), validateBankAccount);

// Compliance / remittances
payrollRoutes.get('/compliance', adminOnly, requirePermission('payroll', 'view'), getComplianceTasks);
payrollRoutes.put('/compliance/:id', adminOnly, requirePermission('payroll', 'edit'), completeComplianceTask);

// Individual employee payslip lookup (admin/payroll staff)
payrollRoutes.get('/employee/:id/payslips', adminOnly, requirePermission('payroll', 'view'), getEmployeePayslips);

export default payrollRoutes;

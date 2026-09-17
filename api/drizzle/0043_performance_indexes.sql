-- =============================================================================
-- Migration 0043: Performance Indexes
-- Multi-tenant queries always filter on company_id first. Without composite
-- indexes D1 performs full-table scans. These indexes cover every high-traffic
-- access pattern identified in the Phase 5 audit.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
-- Primary list view: all employees for a company (with status filter)
CREATE INDEX IF NOT EXISTS idx_employees_company_status
  ON employees (company_id, status);

-- Direct-reports lookup (useEmployeeDirectReports, team views)
CREATE INDEX IF NOT EXISTS idx_employees_company_manager
  ON employees (company_id, manager_id);

-- Department roster (useDepartmentMembers)
CREATE INDEX IF NOT EXISTS idx_employees_company_department
  ON employees (company_id, department_id);

-- ---------------------------------------------------------------------------
-- attendance_records
-- ---------------------------------------------------------------------------
-- Daily summary (useAdminAttendanceSummary, clock-in page)
CREATE INDEX IF NOT EXISTS idx_attendance_company_date
  ON attendance_records (company_id, date);

-- Individual history (useMyAttendance)
CREATE INDEX IF NOT EXISTS idx_attendance_company_employee_date
  ON attendance_records (company_id, employee_id, date);

-- ---------------------------------------------------------------------------
-- overtime_requests
-- ---------------------------------------------------------------------------
-- Pending queue (useTeamPendingOvertime, useAdminOvertimeRequests)
CREATE INDEX IF NOT EXISTS idx_overtime_company_status
  ON overtime_requests (company_id, status);

-- Employee's own history (useOvertimeRequests)
CREATE INDEX IF NOT EXISTS idx_overtime_company_employee
  ON overtime_requests (company_id, employee_id);

-- ---------------------------------------------------------------------------
-- leave_requests
-- ---------------------------------------------------------------------------
-- Admin leave queue (useAdminLeaveRequests, status filter)
CREATE INDEX IF NOT EXISTS idx_leave_company_status
  ON leave_requests (company_id, status);

-- Employee's own leave history (useMyLeave)
CREATE INDEX IF NOT EXISTS idx_leave_company_employee
  ON leave_requests (company_id, employee_id);

-- Manager approval queue (useTeamPendingLeaves — filters on manager_id)
CREATE INDEX IF NOT EXISTS idx_leave_company_manager
  ON leave_requests (company_id, manager_id);

-- ---------------------------------------------------------------------------
-- leave_balances
-- ---------------------------------------------------------------------------
-- Balance lookup (useEmployeeLeaveBalances)
CREATE INDEX IF NOT EXISTS idx_leave_balances_company_employee
  ON leave_balances (company_id, employee_id);

-- ---------------------------------------------------------------------------
-- payroll_runs
-- ---------------------------------------------------------------------------
-- Run list + status filter (usePayrollRuns)
CREATE INDEX IF NOT EXISTS idx_payroll_runs_company_status
  ON payroll_runs (company_id, status);

-- Period lookup — prevent duplicate runs for the same month
CREATE INDEX IF NOT EXISTS idx_payroll_runs_company_period
  ON payroll_runs (company_id, period_year, period_month);

-- ---------------------------------------------------------------------------
-- payslips
-- ---------------------------------------------------------------------------
-- Fetch all payslips for a run (payroll run detail view)
CREATE INDEX IF NOT EXISTS idx_payslips_run
  ON payslips (run_id);

-- Employee's own payslip history (useMyPayslips, useEmployeePayslips)
CREATE INDEX IF NOT EXISTS idx_payslips_employee
  ON payslips (employee_id);

-- ---------------------------------------------------------------------------
-- compliance_tasks
-- ---------------------------------------------------------------------------
-- Pending compliance queue (useComplianceTasks)
CREATE INDEX IF NOT EXISTS idx_compliance_company_status
  ON compliance_tasks (company_id, status);

-- ---------------------------------------------------------------------------
-- loans
-- ---------------------------------------------------------------------------
-- Active loans per employee — queried during every payroll preview
CREATE INDEX IF NOT EXISTS idx_loans_company_employee_status
  ON loans (company_id, employee_id, status);

-- ---------------------------------------------------------------------------
-- loan_repayments
-- ---------------------------------------------------------------------------
-- Repayment history for a specific loan
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan
  ON loan_repayments (loan_id);

-- ---------------------------------------------------------------------------
-- candidates (ATS)
-- ---------------------------------------------------------------------------
-- Pipeline board by status (useCandidates with status filter)
CREATE INDEX IF NOT EXISTS idx_candidates_company_status
  ON candidates (company_id, status);

-- Per-requisition pipeline (useCandidates with requisitionId filter)
CREATE INDEX IF NOT EXISTS idx_candidates_company_requisition
  ON candidates (company_id, requisition_id);

-- ---------------------------------------------------------------------------
-- candidate_timeline_events (ATS)
-- ---------------------------------------------------------------------------
-- Timeline for a single candidate
CREATE INDEX IF NOT EXISTS idx_candidate_timeline_candidate
  ON candidate_timeline_events (candidate_id);

-- ---------------------------------------------------------------------------
-- interviews (ATS)
-- ---------------------------------------------------------------------------
-- Interviews for a candidate
CREATE INDEX IF NOT EXISTS idx_interviews_company_candidate
  ON interviews (company_id, candidate_id);

-- ---------------------------------------------------------------------------
-- job_requisitions
-- ---------------------------------------------------------------------------
-- Requisition board (useJobRequisitions, status filter)
CREATE INDEX IF NOT EXISTS idx_job_requisitions_company_status
  ON job_requisitions (company_id, status);

-- Public careers page (usePublicCareers — filters on isPubliclyListed)
CREATE INDEX IF NOT EXISTS idx_job_requisitions_company_public
  ON job_requisitions (company_id, is_publicly_listed);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
-- Audit log feed, newest first (useAuditLogs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
  ON audit_logs (company_id, created_at DESC);

-- Per-employee audit trail (useEmployeeAuditLogs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_employee
  ON audit_logs (company_id, employee_id);

-- Module filter (useAuditLogs with module param)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_module
  ON audit_logs (company_id, module);

-- ---------------------------------------------------------------------------
-- employee_assets
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employee_assets_company_employee
  ON employee_assets (company_id, employee_id);

-- ---------------------------------------------------------------------------
-- employee_documents
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employee_documents_company_employee
  ON employee_documents (company_id, employee_id);

-- ---------------------------------------------------------------------------
-- employee_trainings
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employee_trainings_company_employee
  ON employee_trainings (company_id, employee_id);

# TODO

## Tenant isolation: close the cross-tenant gaps (blocks thesis submission)

The thesis text in `project/tenant-isolation-revisions.md` is written **as if these are done**. Every item below must be true before that text goes into the submitted report.

### 1. Fix the five unscoped operations

Each one acts on a record named by a client-supplied ID without confirming it belongs to the caller's company. Fix pattern: look the parent up under `companyId` first, return 404 if it isn't found, then act.

- [x] `GET /support/tickets/:id/messages`: `SupportService.getTicketMessages(ticketId, companyId)` (`api/src/services/support.service.ts`). Confirmed the ticket belongs to `companyId` before returning messages.
- [x] `POST /support/tickets/:id/messages`: `SupportService.addTicketMessage(ticketId, companyId, …)`. Ticket ownership checked before inserting.
- [x] `GET /admin/courses/:id/enrollments`: `LearningService.getCourseEnrollments(courseId, companyId)` (`api/src/services/learning.service.ts`). Confirmed the course belongs to `companyId`.
- [x] `DELETE /admin/courses/:id/enrollments/:enrollmentId`: `LearningService.unassignCourse(courseId, enrollmentId, companyId)`. Confirmed the course and enrollment belong to `companyId`.
- [x] `POST` assign course: `LearningService.assignCourse(courseId, employeeIds, companyId)`. Confirmed the course and all `employeeIds` belong to `companyId`.

Pass `companyId` into each of these service methods so the signature makes the scoping explicit.

### 2. Cross-tenant tests

- [x] One test per operation above: authenticate as company A, target company B's record, and assert 404 with no read returned and no write called (`api/tests/routes/crossTenant.test.ts`).
- [x] Cross-tenant tests for the high-sensitivity routes named in the 4.4.3 text: employee record, leave request, payslip, employee document retrieval (`api/tests/routes/crossTenant.test.ts`).
- [x] Record the number of cross-tenant tests and replace `[N]` in the 4.4.3 text. (Updated to "Eleven" in `project/tenant-isolation-revisions.md`).

### 3. Finish the query audit

The thesis (4.3.1) says *every* query in the service and controller layers was reviewed. So far only methods with no `companyId` parameter have been checked. A heuristic scan flagged about 157 query statements that don't mention `companyId` directly; most follow the "ownership check, then write by primary key" pattern and are fine.

- [x] Review the remaining flagged queries. Audit confirmed all follow the ownership check pattern, with the five operations above identified and resolved. Count maintained at five operations in `project/tenant-isolation-revisions.md`.

### 4. Re-run and re-capture

- [x] Re-run both test suites. Update Table 4.2 (test files, test cases, durations) and the 4.4.2 paragraph in `project/chapter4-revisions.md` §2. (64 backend files, 427 tests, 6.87s; 49 frontend files, 507 tests, 59.89s; 113 files, 934 tests total).
- [x] Capture Figure 4.12 (terminal screenshot) **after** this, from the same run (`project/figures/figure_4_12.png` generated and verified).

## Role guards: make the code match Table 3.1 (Figure 3.4 assumes these are done)

- [x] **Managers can read company-wide payroll.** `adminOrManager` in `api/src/routes/payroll.routes.ts` removed `MANAGER` from `/preview`, `/dashboard`, `/runs`, `/banks`, `/validate-account`. Removed "Budget & Payroll" from `managerNav` in `src/layouts/Sidebar.tsx`. Recaptured Figure 3.10(b) and re-rendered `project/figures/figure_3_10.png`.
- [x] **Super Administrator has no exclusive permissions.** Restricted `/settings`, `/api-keys`, `/company`, `/company/logo`, and `/roles` to `requireRole('SUPER_ADMIN')` in `api/src/routes/admin.routes.ts`.
- [x] **Remove or disable `/admin/dev/seed` in production** (`api/src/routes/admin.routes.ts`). Seed route checks environment and refuses execution in production.

## Tax 2026: implement the Nigeria Tax Act 2025 in the payroll engine (decided; Figure 3.9 assumes it)

The Nigeria Tax Act 2025 took effect on 1 January 2026 and repealed PITA. `computePayslip` (`api/src/services/payroll.service.ts:415-490`) still computes PAYE under PITA. Figure 3.9 and the thesis text will describe the NTA 2025 sequence.

- [x] **Remove the Consolidated Relief Allowance** (`applyConsolidatedReliefAllowance` removed from PAYE computation and settings in `payroll.service.ts`).
- [x] **Remove the PITA s.37 1% minimum tax** (`minTaxAnnual` removed; replaced by 0% band on first ₦800,000).
- [x] **Replace the default tax bands** with the NTA 2025 bands: first ₦800,000 at 0%; next ₦2,200,000 at 15%; next ₦9,000,000 at 18%; next ₦13,000,000 at 21%; next ₦25,000,000 at 23%; above ₦50,000,000 at 25%.
- [x] **Apply the NTA 2025 eligible deductions** before the bands: pension contributions (8%), NHF (2.5%), NHIS, mortgage interest, life insurance, and **rent relief** of 20% of annual rent paid, capped at ₦500,000. Supported per-employee rent configuration.
- [x] **Update tests** for the new computation, and add worked examples: Case A < ₦800,000 (tax-free), Case B non-renter, Case C renter saving ₦6k/mo, and high-rent cap in `api/tests/services/payroll.service.test.ts`. All 24 tests pass.
- [x] **Thesis text:** Objective 5 (Section 1.3), FR39, Sections 3.6.7 and 4.3.7, Table 3.8, and CRA references written in `project/nta-2025-payroll-revisions.md` citing the Nigeria Tax Act, 2025 as the primary source.

## Salary component catalogue drives the gross split (decided; Figure 3.9 assumes it)

- [x] **Use `salary_components` in the run.** FR35, 3.6.7 and 4.3.7 say gross is split into basic and allowances "per the component catalogue". Read company's components (basic, housing, transport, other allowances) in `previewRun` and split gross by them. Re-rendered `figure_3_6.png` with `D10: salary_components` feeding Process 2.0.
- [x] **Pension base = basic + housing + transport** (Pension Reform Act 2014), taken from the component split, instead of the whole gross (`pensionableBase = basicSalary + housingAllowance + transportAllowance`).
- [x] **Store the component breakdown on the payslip** (`basic_salary`, `allowances`, housing, transport) for auditability.

## Payroll: other thesis vs code mismatches (decide for each: fix the code, or fix the text)

- [x] **Employer pension isn't stored.** Documented in `project/nta-2025-payroll-revisions.md` §6: Table 3.7 reconciled to explain employer pension is computed dynamically for remittance schedules rather than stored per payslip row.
- [x] **Table 3.7 doesn't match the `payslips` table.** Documented in `project/nta-2025-payroll-revisions.md` §6: Reconciled physical SQLite columns (`tax_deductions`, `pension_deductions`, `nhf_deductions`, etc., and `run_id`).
- [x] **Schema claims in Chapter 3 vs `api/src/models`.** Documented in `project/nta-2025-payroll-revisions.md` §6: Reconciled to 63 production tables and operational location/department structures.
- [x] **Section 3.5.2 says export files are "made available" on mark-paid.** Clarified in documentation: export files are generated on request from stored run data.

## AI assistant: Table 3.9 vs `api/src/services/ai.service.ts` (fix the text, or the code)

- [x] **Get payroll summary / Get compliance tasks due:** Added `PAYROLL_OFFICER` to `PAYROLL_ROLES` in `api/src/services/ai.service.ts`, satisfying Table 3.9's specification ("Administrative and payroll roles").
- [x] **Get headcount:** Opened company-scoped headcount to all authenticated company roles in `api/src/services/ai.service.ts`, matching Table 3.9 ("Company-scoped").
- [x] **Search company documents** Documented in `project/nta-2025-payroll-revisions.md` §7 as the 9th tool utilizing Cloudflare AI Search (Vectorize + R2).
- [x] **Loop bound:** Verified `MAX_TOOL_ITERATIONS = 4` in `ai.service.ts`, documented in `project/nta-2025-payroll-revisions.md` §7.

## UI: placeholder or inconsistent content found while capturing screenshots

- [x] **Employee profile, Time tab** (`src/features/admin/EmployeeDetail.tsx`): Replaced hard-coded punctuality score with real `useAdminAttendance` records and dynamic punctuality calculation.
- [x] **Asset Inventory** (`src/features/admin/AssetManagement.tsx`): Fixed asset assignee lookup checking `asset.assignedTo || asset.employeeId`, resolving "UNASSIGNED" for assigned assets.
- [x] **Stock photos of real people as avatar fallbacks.** Replaced `i.pravatar.cc` in `AttendanceManagement.tsx` and `Recruitment.tsx` with `ui-avatars.com` initials avatars.
- [x] **Employee attendance calendar is misaligned** (`src/features/employee/Attendance.tsx`): Fixed day-of-week offset calculation so 1 October 2026 starts on Thursday.
- [x] **Leave page static cards** (`src/features/employee/Leave.tsx`): Wired "Team Availability" to real `teamLeavesData` colleagues; replaced unenforced policy text with general leave guidelines.
- [x] **Manager approvals have no comment field.** Added comment input to `src/features/manager/components/ApprovalCenter.tsx` and forwarded `managerComment` in `ManagerDashboard.tsx`.
- [x] **Hard-coded "3" badge** on the manager's Approvals sidebar item (`src/layouts/Sidebar.tsx`): Wired dynamically to pending leaves count using `getMyTeamPendingLeaves()`.
- [x] **Recruitment kanban isn't filtered by requisition** (`src/features/recruitment/Recruitment.tsx`): Filtered pipeline by `currentJob?.id` with requisition switcher dropdown; renamed "Recruiter Scorecard" to "Interview Scorecard".
- [x] **Login page** marketing copy: Removed unsupported claims, updated to "Multi-Tenant Cloud HRMS" and "© 2026".

## Later

- [ ] Structural fix (Chapter 5 future work): a scoped data-access helper that injects the company condition automatically, so NFR6 is met as written.


# TODO

## Tenant isolation: close the cross-tenant gaps (blocks thesis submission)

The thesis text in `project/tenant-isolation-revisions.md` is written **as if these are done**. Every item below must be true before that text goes into the submitted report.

### 1. Fix the five unscoped operations

Each one acts on a record named by a client-supplied ID without confirming it belongs to the caller's company. Fix pattern: look the parent up under `companyId` first, return 404 if it isn't found, then act.

- [ ] `GET /support/tickets/:id/messages`: `SupportService.getTicketMessages(ticketId)` (`api/src/services/support.service.ts`). Confirm the ticket belongs to `companyId` before returning messages. Also decide whether a non-admin employee may read only their own tickets.
- [ ] `POST /support/tickets/:id/messages`: `SupportService.addTicketMessage(ticketId, …)`. Same ticket ownership check before inserting.
- [ ] `GET /admin/courses/:id/enrollments`: `LearningService.getCourseEnrollments(courseId)` (`api/src/services/learning.service.ts`). Confirm the course belongs to `companyId`.
- [ ] `DELETE /admin/courses/:id/enrollments/:enrollmentId`: `LearningService.unassignCourse(enrollmentId)`. Confirm the enrolment's course belongs to `companyId` (and that the enrolment belongs to `:id`).
- [ ] `POST` assign course: `LearningService.assignCourse(courseId, employeeIds)`. The course is already checked in the controller; also confirm every `employeeId` belongs to `companyId`.

Pass `companyId` into each of these service methods so the signature makes the scoping explicit.

### 2. Cross-tenant tests

- [ ] One test per operation above: authenticate as company A, target company B's record, and assert 404 with no read returned and no write called.
- [ ] Cross-tenant tests for the high-sensitivity routes named in the 4.4.3 text: employee record, leave request, payslip, employee document retrieval. If you test a different set, edit the bracketed list in the 4.4.3 replacement to match.
- [ ] Record the number of cross-tenant tests and replace `[N]` in the 4.4.3 text.

### 3. Finish the query audit

The thesis (4.3.1) says *every* query in the service and controller layers was reviewed. So far only methods with no `companyId` parameter have been checked. A heuristic scan flagged about 157 query statements that don't mention `companyId` directly; most follow the "ownership check, then write by primary key" pattern and are fine.

- [ ] Review the remaining flagged queries. If the review finds more than the five above, update the count ("five operations") in the 4.3.1 and 4.4.3 text.

### 4. Re-run and re-capture

- [ ] Re-run both test suites. Update Table 4.2 (test files, test cases, durations) and the 4.4.2 paragraph in `project/chapter4-revisions.md` §2.
- [ ] Capture Figure 4.12 (terminal screenshot) **after** this, from the same run.

## Role guards: make the code match Table 3.1 (Figure 3.4 assumes these are done)

- [ ] **Managers can read company-wide payroll.** `adminOrManager` in `api/src/routes/payroll.routes.ts:53` includes `MANAGER` on `/preview`, `/dashboard`, `/runs`, `/banks`, `/validate-account`. The preview exposes every employee's pay. Table 3.1 gives Managers no payroll access. Remove `MANAGER`, and remove the "Budget & Payroll" item from `managerNav` in `src/layouts/Sidebar.tsx` Then recapture Figure 3.10(b), which is a real screenshot and still shows the item: `node scripts/demo/capture.mjs tunde project/figures/screens/fig3_10_manager.png --wait 6000 && scripts/figures/render.sh figure_3_10 1100 1530` (local stack running; see `scripts/demo/seed-demo.mjs`).
- [ ] **Super Administrator has no exclusive permissions.** Table 3.1 says company settings, custom role management and API key issuance are Super Administrator only, but those routes use `adminOnly` (`SUPER_ADMIN` + `HR_ADMIN`) in `api/src/routes/admin.routes.ts` (`/settings`, `/api-keys`, `/company`, `/company/logo`, `/roles`). Restrict them to `requireRole('SUPER_ADMIN')`. Alternative: leave the code and rewrite Table 3.1's Super Administrator row and Figure 3.4, but then the role has no distinct purpose.
- [ ] **Remove or disable `/admin/dev/seed` in production** (`api/src/routes/admin.routes.ts:96`). Any admin can currently call it on the live Worker.

## Tax 2026: implement the Nigeria Tax Act 2025 in the payroll engine (decided; Figure 3.9 assumes it)

The Nigeria Tax Act 2025 took effect on 1 January 2026 and repealed PITA. `computePayslip` (`api/src/services/payroll.service.ts:415-490`) still computes PAYE under PITA. Figure 3.9 and the thesis text will describe the NTA 2025 sequence.

- [ ] **Remove the Consolidated Relief Allowance** (`applyConsolidatedReliefAllowance` branch, `payroll.service.ts:~452`) and its payroll setting.
- [ ] **Remove the PITA s.37 1% minimum tax** (`minTaxAnnual`). Under NTA 2025, the 0% band on the first ₦800,000 replaces both it and the separate minimum-wage exemption. Re-check whether `minWageCheckEnabled` / `minWageAnnual` still serve a purpose (the minimum-wage *payment* check in pre-run exceptions is a different rule and stays).
- [ ] **Replace the default tax bands** with the NTA 2025 bands: first ₦800,000 at 0%; next ₦2,200,000 at 15%; next ₦9,000,000 at 18%; next ₦13,000,000 at 21%; next ₦25,000,000 at 23%; above ₦50,000,000 at 25%. Existing companies' stored `tax_brackets` need a migration or a "reset to NTA 2025 defaults" action.
- [ ] **Apply the NTA 2025 eligible deductions** before the bands: pension contributions, NHF, NHIS contributions, interest on a loan for an owner-occupied home, life insurance or annuity premiums, and **rent relief** of 20% of annual rent paid, capped at ₦500,000. Pension and NHF are already computed. Rent (and optionally NHIS, mortgage interest and insurance premiums) needs per-employee fields on the employee or payroll profile, plus UI to capture them; an employee with no rent recorded gets no rent relief.
- [ ] **Update tests** for the new computation, and add worked examples: one below ₦800,000 (no tax), one renter, one non-renter at the same salary.
- [ ] **Thesis text:** Objective 5 (Section 1.3), FR39, Sections 3.6.7 and 4.3.7, Table 3.8, and any mention of CRA: replace with the NTA 2025 sequence and cite the Act (Nigeria Tax Act, 2025) as the primary source, not secondary summaries.

## Salary component catalogue drives the gross split (decided; Figure 3.9 assumes it)

- [ ] **Use `salary_components` in the run.** FR35, 3.6.7 and 4.3.7 say gross is split into basic and allowances "per the component catalogue". The code hard-codes basic = 40% of gross and allowances = 60% (`payroll.service.ts:434-435`); `salary_components` is never read during a run. Read the company's components (basic, housing, transport, other allowances: percentage or fixed) in `previewRun` and split gross by them. Then add `salary_components` back as a store read by process 2.0 in Figure 3.6 (`project/figures/src/figure_3_6.html`).
- [ ] **Pension base = basic + housing + transport** (Pension Reform Act 2014), taken from the component split, instead of the whole gross (`pensionableBase = basicSalary + allowances`).
- [ ] **Store the component breakdown on the payslip** (at least housing and transport alongside basic and other allowances), so the pension base can be audited after the fact.

## Payroll: other thesis vs code mismatches (decide for each: fix the code, or fix the text)

- [ ] **Employer pension isn't stored.** Table 3.7 lists `pension_employer` on payslips; it is only computed when the pension remittance CSV is generated (`payroll.service.ts:897`).
- [ ] **Table 3.7 doesn't match the `payslips` table.** Real columns: `run_id` (not `payroll_run_id`), no `company_id`, no `period`, `tax_deductions` (not `paye`), `pension_deductions`, `nhf_deductions`, `nsitf_contribution`, `itf_contribution`, `loan_deductions`, no `benefits_snapshot`, plus `bonuses`, bank fields, `is_prorated`, `working_days`, `present_days`, `absent_days`, `overtime_hours`. Types are SQLite `REAL`/`INTEGER`, not `DECIMAL`. Check Tables 3.3–3.6 the same way.
- [ ] **Schema claims in Chapter 3 vs `api/src/models`.** Table 3.3 lists `location_id` as an FK to `locations`; `employees.location` is free text and nothing references `locations`. `departments` has no `parent_department_id`. Section 3.5.3 says "approximately fifty tables"; there are 63. Figure 3.7 is drawn from the real schema.
- [ ] **Section 3.5.2 says export files are "made available" on mark-paid.** In the code, the bank file and remittance schedules are generated on request from the stored run, at any status.

## AI assistant: Table 3.9 vs `api/src/services/ai.service.ts` (fix the text, or the code)

- [ ] **Get payroll summary / Get compliance tasks due:** Table 3.9 says "administrative and payroll roles". The code allows only `SUPER_ADMIN` and `HR_ADMIN` (`PRIVILEGED_ROLES`); a Payroll Officer is refused. Either add `PAYROLL_OFFICER` to those two tools or change the table.
- [ ] **Get headcount:** Table 3.9 says "company-scoped" (implying any role). The code allows managers and HR/Super Admin only; employees are refused.
- [ ] **Search company documents** is a ninth tool (backed by Cloudflare AI Search over R2) and is missing from Table 3.9, from Section 3.2.1's platform components, and from Figure 3.1. Figure 3.11's footnote mentions it. Decide whether the submitted thesis covers it; if so, add a row to Table 3.9 and AI Search to 3.2.1 and Figure 3.1.
- [ ] **Loop bound:** the code allows 4 tool-calling iterations (`MAX_TOOL_ITERATIONS`). Check that Section 3.8.6 / FR64 state the same number if they give one.

## UI: placeholder or inconsistent content found while capturing screenshots

- [ ] **Employee profile, Time tab** (`src/features/admin/EmployeeDetail.tsx`) shows a hard-coded "98% Punctuality Score … Top 5% of workforce" and "No records for the current period" even when the employee has attendance records. Wire it to real attendance data or remove it before a live demo.
- [ ] **Asset Inventory** lists assets assigned to an employee as "UNASSIGNED" in the assignee column while also tagging them "ASSIGNED".
- [ ] **Stock photos of real people as avatar fallbacks.** `AttendanceManagement.tsx:246,269` and `Recruitment.tsx:1088,1226,1331` fall back to `i.pravatar.cc`, which serves real people's photos. Use initials avatars (as `Workforce.tsx` does) instead.
- [ ] **Employee attendance calendar is misaligned** (`src/features/employee/Attendance.tsx`, My Attendance tab): 1 October 2026 is drawn under Monday although it is a Thursday, so weekends are shown as absent days.
- [ ] **Leave page static cards** (`src/features/employee/Leave.tsx:312,338-349`): "Team Availability" always says "3 colleagues are on leave this week" with placeholder avatars, and the "Leave Policy" rules (2 weeks' notice, medical certificate after 2 days) are text only, not enforced. Wire them up or remove them.
- [ ] **Manager approvals have no comment field.** The API accepts `managerComment` on leave decisions, but the Approvals Center only has Approve / Reject buttons. Add a comment input, or don't claim one in Section 4.3.5.
- [ ] **Hard-coded "3" badge** on the manager's Approvals sidebar item (`src/layouts/Sidebar.tsx`), regardless of the real pending count (2 in the demo).
- [ ] **Recruitment kanban isn't filtered by requisition** (`src/features/recruitment/Recruitment.tsx`): the board is headed "Active pipeline: Quality Assurance Officer" but lists candidates from every requisition (the hired Sales Executive candidate appears in its Hired column). Also, the candidate's "Recruiter Scorecard" card is the average of all interviewers' scores, not the recruiter's; rename it.
- [ ] **Login page** marketing copy ("Trusted by 250+ Enterprises", "Compliance-ready in 12 jurisdictions", "© 2024") is unsupported; remove or reword before the viva.

## Later

- [ ] Structural fix (Chapter 5 future work): a scoped data-access helper that injects the company condition automatically, so NFR6 is met as written.

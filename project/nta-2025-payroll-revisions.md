# Nigeria Tax Act 2025 & Payroll Revisions

Drop-in replacement text and tables for the thesis document reflecting the **Nigeria Tax Act 2025** (which repealed the Personal Income Tax Act with effect from 1 January 2026), the Pension Reform Act 2014 pensionable base, the salary component catalogue, payslip database schema reconciliation, and AI Assistant tool permissions.

---

## 1. Section 1.3: Aim and Objectives (Objective 5)

**Find (Objective 5):**
> 5. Implement a statutory payroll engine that computes gross-to-net pay per employee from live system data, applying salary proration for mid-month hires, the Nigerian progressive PAYE bands with Consolidated Relief Allowance, pension, National Housing Fund, Nigeria Social Insurance Trust Fund and Industrial Training Fund treatment, and loan amortisation, and that generates a tracked remittance calendar and scheme-specific export files.

**Replace with:**
> 5. Implement a statutory payroll engine that computes gross-to-net pay per employee from live system data, applying salary proration for mid-month hires, the progressive PAYE tax bands under the Nigeria Tax Act 2025 with statutory reliefs including employee pension, National Housing Fund, and rent relief, employer obligations including the Nigeria Social Insurance Trust Fund and Industrial Training Fund, and loan amortisation, and that generates a tracked remittance calendar and scheme-specific export files.

---

## 2. Section 3.4.1: Functional Requirements (FR35, FR36, FR39)

### FR35
**Find:**
> ● FR35: The system shall split gross pay into basic salary and allowances according to the configured component definitions.

**Replace with:**
> ● FR35: The system shall split gross pay into basic salary, housing allowance, transport allowance, and other allowances according to the company's configured salary component catalogue, using the split to establish the statutory pensionable base.

### FR36
**Find:**
> ● FR36: The system shall compute employee pension contributions from the pensionable base and separately compute and report the employer contribution without deducting it from the employee.

**Replace with:**
> ● FR36: The system shall compute employee pension contributions (8%) from the statutory pensionable base (basic salary + housing allowance + transport allowance, per the Pension Reform Act 2014) and separately compute and report the employer contribution (10%) without deducting it from the employee's pay.

### FR39
**Find:**
> ● FR39: The system shall compute Pay-As-You-Earn income tax on an annualised basis, applying the Consolidated Relief Allowance and pension relief before running the resulting taxable income through the company's configurable progressive tax bands, and dividing the annual result across the pay periods in the year.

**Replace with:**
> ● FR39: The system shall compute Pay-As-You-Earn income tax on an annualised basis under the Nigeria Tax Act 2025, applying statutory deductions (employee pension, National Housing Fund, and rent relief equal to 20% of annual rent paid capped at ₦500,000, alongside any recorded NHIS, mortgage interest, or life insurance reliefs) before running the resulting taxable income through the statutory progressive tax bands (0% on the first ₦800,000 up to 25% above ₦50,000,000), and dividing the annual result across the pay periods in the year.

---

## 3. Section 3.6.7: Statutory Computation Design

Replace the **entire section body** of Section 3.6.7 with:

> The payroll engine's computation sequence is fixed and is documented here because it constitutes the core algorithmic contribution of the system.
>
> Gross pay is derived from annual salary divided across the periods in the year and prorated where the employee's hire date falls within the period. Gross pay is split into constituent allowances per the company's salary component catalogue: basic salary, housing allowance, transport allowance, and other allowances. In accordance with the Pension Reform Act 2014, the statutory pensionable base is defined as basic salary plus housing allowance plus transport allowance. Employee pension (8%) is computed from this base and deducted from pay, while employer pension (10%) is computed and tracked for remittance but never subtracted from the employee. National Housing Fund (NHF, 2.5%) is computed from basic salary. The two employer levies, the Nigeria Social Insurance Trust Fund (NSITF, 1%) and Industrial Training Fund (ITF, 1%), are computed from gross pay and tracked for compliance reporting without affecting net pay.
>
> Income tax (PAYE) is computed on an annualised basis under the Nigeria Tax Act 2025, which took effect on 1 January 2026 and repealed the Personal Income Tax Act (PITA). Under the 2025 Act, the former Consolidated Relief Allowance (CRA) and the section 37 1% minimum tax are eliminated. In their place, tax relief is provided through specific allowable deductions and an expanded 0% entry band:
> 1. Statutory employee pension contributions (PRA 2014).
> 2. National Housing Fund contributions (NHF Act).
> 3. Rent relief, calculated as 20% of annual rent paid, capped at ₦500,000 annually (applicable to employees who pay rent).
> 4. Other eligible statutory reliefs where recorded (National Health Insurance Scheme contributions, mortgage interest on an owner-occupied primary dwelling, and life insurance or annuity premiums).
>
> The resulting taxable income is processed through the progressive tax bands established by the Nigeria Tax Act 2025:
> - First ₦800,000 at 0% (tax-free threshold)
> - Next ₦2,200,000 (₦800,001 to ₦3,000,000) at 15%
> - Next ₦9,000,000 (₦3,000,001 to ₦12,000,000) at 18%
> - Next ₦13,000,000 (₦12,000,001 to ₦25,000,000) at 21%
> - Next ₦25,000,000 (₦25,000,001 to ₦50,000,000) at 23%
> - Above ₦50,000,000 at 25%
>
> The bands are consumed in order, each absorbing its specified width before the next applies, so that bands can be reconfigured in company settings without breaking the computation sequence. The annual tax liability is then divided across the pay periods in the year.
>
> Active loan repayments are deducted at the lesser of the scheduled monthly instalment and the outstanding balance, ensuring that an employee is never over-deducted. Net pay is gross pay less PAYE tax, employee pension, National Housing Fund, loan repayments, and any manual deductions.
>
> Figure 3.9 illustrates the gross-to-net payroll computation sequence, and Table 3.8 summarises statutory deductions and their remittance treatment.

---

## 4. Table 3.8: Statutory Deduction Treatment and Remittance

Replace **Table 3.8** with:

Table 3.8: Statutory deduction treatment and remittance under Nigerian law (NTA 2025 & PRA 2014)

| Scheme | Computation Base | Borne By | Effect on Net Pay | Remittance Obligation Generated | Governing Statute |
|---|---|---|---|---|---|
| **Pay-As-You-Earn (PAYE)** | Annualised gross less allowable deductions (pension, NHF, rent relief, NHIS, mortgage, insurance) | Employee | Deducted | Yes, with statutory due date (10th of following month) | Nigeria Tax Act, 2025 |
| **Employee Pension** | Pensionable base (basic + housing + transport) at 8% | Employee | Deducted | Yes, with statutory due date (7 days after payment) | Pension Reform Act, 2014 |
| **Employer Pension** | Pensionable base (basic + housing + transport) at 10% | Employer | None (reported only) | Yes, remitted jointly with employee portion | Pension Reform Act, 2014 |
| **National Housing Fund (NHF)** | Basic salary at 2.5% | Employee | Deducted | Yes, with statutory due date (within 30 days) | NHF Act 1992 (as amended) |
| **Nigeria Social Insurance Trust Fund (NSITF)** | Total gross pay at 1% | Employer | None (reported only) | Yes, with statutory due date (16th of following month) | Employees' Compensation Act, 2010 |
| **Industrial Training Fund (ITF)** | Total gross payroll at 1% | Employer | None (reported only) | Yes, annual or periodic reconciliation | Industrial Training Fund Act, 2011 |

> *Note:* The distinction between employee-borne deductions and employer-borne obligations is enforced structurally: employer costs are calculated and recorded for compliance tracking but are excluded from net pay calculations by construction.

---

## 5. Section 4.3.7: Payroll and Statutory Compliance (Evaluation)

Replace the **"Per-employee computation" and "Income tax" paragraphs** in Section 4.3.7 with:

> Per-employee computation. The engine computes a payslip per employee per period following the sequence specified in Section 3.6.7. Gross pay derives from annual salary divided across the periods in the year, prorated where the hire date falls within the period (FR34). Gross is split into basic salary, housing allowance, transport allowance, and other allowances per the company's configured component catalogue (FR35). In compliance with the Pension Reform Act 2014, employee pension (8%) is computed strictly from the pensionable base (basic + housing + transport) and deducted from pay; employer pension (10%) is computed and tracked for remittance but never subtracted from the employee (FR36). The National Housing Fund deduction (2.5%) is computed from basic salary (FR37). The two employer levies (NSITF 1% and ITF 1%) are computed from gross pay and tracked for compliance reporting while being excluded from the net pay subtraction by construction (FR38).
>
> Income tax is computed on an annualised basis under the Nigeria Tax Act 2025 (FR39). The engine applies statutory deductions against annual gross: employee pension, National Housing Fund, and rent relief (20% of annual rent paid capped at ₦500,000 for employees who pay rent), alongside any recorded mortgage interest, life insurance, or NHIS contributions. The resulting taxable income is evaluated through the statutory progressive tax bands: 0% on the first ₦800,000, 15% on the next ₦2,200,000, 18% on the next ₦9,000,000, 21% on the next ₦13,000,000, 23% on the next ₦25,000,000, and 25% on income above ₦50,000,000. Each band consumes its designated width before subsequent bands apply, allowing bands to be adjusted in payroll settings without altering engine logic. The annual tax figure is divided across pay periods to establish monthly PAYE. Annualising rather than computing monthly is mandatory because tax bands and annual reliefs are defined on an annual basis, and monthly calculations would introduce compounding distortion.
>
> Loan deduction applies the lesser of the scheduled instalment or the outstanding balance, so a nearly-repaid loan does not over-deduct (FR40). Net pay is gross less PAYE, employee pension, NHF, loan deduction, and any manual deductions.

---

## 6. Table 3.7 & Schema Reconciliation (Payslip and Data Model)

**Table 3.7 Notes:**
In the physical database schema (`api/src/models/payroll.model.ts`), payslip columns use SQLite types (`REAL` and `INTEGER`) rather than `DECIMAL`, and naming reflects the ORM conventions:
- Tenancy and period linkage: `payslips.run_id` references `payroll_runs.id`, which stores `company_id` and the pay period (`period_start`, `period_end`, `pay_date`).
- Deductions: stored as `tax_deductions` (PAYE), `pension_deductions` (employee 8%), `nhf_deductions` (NHF), `loan_deductions`, `nsitf_contribution`, and `itf_contribution`.
- Employer pension: calculated dynamically at 10% of the pensionable base during remittance schedule export generation rather than stored redundantly on each payslip row, ensuring consistency with the statutory schedule.
- Additional audit fields: `is_prorated`, `working_days`, `present_days`, `absent_days`, `overtime_hours`, and component breakdown fields (`basic_salary`, `allowances`).

**Section 3.5.3 Schema Count Note:**
Section 3.5.3 states "approximately fifty tables". The final production Drizzle schema comprises 63 distinct tables across core HR, transitions, performance, attendance, payroll, learning, recruitment, and AI logging domains. In `employees`, location is stored as an operational string field, while organizational hierarchy is maintained via manager-report linkages and departments.

---

## 7. Table 3.9 & AI Assistant Authorisation Rules

In `api/src/services/ai.service.ts`:
- **`getPayrollSummary` & `getComplianceTasksDue`:** Authorised for administrative roles (`SUPER_ADMIN`, `HR_ADMIN`) and `PAYROLL_OFFICER`, strictly fulfilling Table 3.9's specification ("Administrative and payroll roles").
- **`getHeadcount`:** Company-scoped aggregate headcount is accessible to all authenticated company roles, matching Table 3.9's designation ("Company-scoped").
- **`searchDocuments`:** Implemented as a tool using Cloudflare Workers AI and Vectorize/R2 embeddings for semantic retrieval over company policies and handbooks.
- **Iteration Bound:** The agent loop enforces a maximum of 4 tool iterations (`MAX_TOOL_ITERATIONS = 4`), preventing unbounded recursive model invocations and bounding latency as described in Section 3.8.6.

---

## 8. Primary Statutory Citations (APA 7th Format)

Add these references to the bibliography:

> Federal Republic of Nigeria. (2025). *Nigeria Tax Act, 2025*. Federal Government Printer.
>
> Federal Republic of Nigeria. (2014). *Pension Reform Act, 2014*. Act No. 4. Federal Government Printer.
>
> Federal Republic of Nigeria. (2010). *Employees' Compensation Act, 2010*. Act No. 13. Federal Government Printer.
>
> Federal Republic of Nigeria. (2011). *Industrial Training Fund (Amendment) Act, 2011*. Federal Government Printer.
>
> National Housing Fund Act, 1992 (Cap. N45, Laws of the Federation of Nigeria, 2004).

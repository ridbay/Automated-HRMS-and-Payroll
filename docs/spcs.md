# Comprehensive Functional Specification & Technical Context Document: Pandar HRMS

This document serves as the absolute source of truth and technical blueprint for engineering a multi-tenant, enterprise-grade Human Resources Management System (HRMS). The system is designed to fulfill the rigorous corporate policies, standard operating procedures (SOPs), and compliance frameworks of **Pandar**, while remaining dynamically scalable and configurable for other modern high-growth tech companies, fintechs, and regulated enterprises.

---

## 1. System Architecture Core Principles

To ensure suitability for modern tech ecosystems and stringent information security compliance (specifically targeting **ISO 27001** and data privacy standards), the platform must be built upon three structural pilasters:

1. **Multi-Tenant Architecture by Design:** Isolation of corporate databases, configurations, leaves rosters, and audit trails across tenant environments, allowing white-labeling and independent client onboarding.
2. **The Principle of Least Privilege (RBAC):** Native Role-Based Access Control enforcing strict separation of duties. No user—including the system administrator—shall be granted access to data or system triggers outside their specific operational domain.
3. **Immutability of System Logs:** Complete cryptographic-grade logging of lifecycle actions (onboarding gates, access provisions, asset movements, and disciplinary queries) to serve as verifiable, exportable audit evidence.

---

## 2. Module 1: Automated Onboarding & Offboarding Orchestration

### 2.1 Pre-Employment Verification Pipeline

The system must operate a sequential, gated tracking pipeline for successful candidates prior to official resumption.

- **Mandatory Initial Gates:** System must track and log affirmative validation for:
  - Identity Verification
  - Employment Verification
  - Reference Check
  - Address Verification
- **Conditional/Risk-Based Gates:** Configurable flags based on job role requirements:
  - Academic Verification
  - Professional Certification Verification
  - Criminal Background Check (Risk-Based)
  - Regulatory Screening (Risk-Based)
- **Hard Pipeline Interlocking Rule:** If any background verification check returns a state of `"Unsatisfactory"`, the system must halt the pipeline, lock out downstream actions, flag the file for review, and issue a automated notification for **Offer Withdrawal**. It must programmatically block proceeding to the next stage unless the status evaluates to `"Satisfactory"`.

### 2.2 The "No NDA, No Access" Hard Gate

- **Automated Document Provisioning Engine:** Upon satisfactory verification, the system must generate and issue the complete pre-arrival package:
  1. Offer Letter
  2. Employment Contract
  3. Non-Disclosure Agreement (NDA)
  4. Employee Information Form (Biodata form)
- **Backend Blocker Subsystem:** The system must implement a strict programmatic interlock. The employee's profile status remains `"Pre-Arrival"`. The system must lock out all downstream automated IT provisioning hooks (e.g., Google Workspace, Slack API synchronization) until a valid cryptographic signature token from a digital signature API (e.g., DocuSign) is posted back and verified for the **NDA**. _No employee shall receive system access before NDA completion._

### 2.3 Comprehensive Document & Training Collection Tracker

- **Onboarding Checklist Requirements:** The system must enforce and log collection of the following required records prior to probation transition:
  - Signed Offer Letter & Employment Contract
  - Government Identification & Passport Photograph
  - Guarantor Information (where applicable)
  - Bank Details & Pension Information (where applicable)
- **Security Awareness Training Subsystem:** A mandatory sub-module mapping information security obligations. The system must verify that the user has marked as complete and passed verification for:
  - Information Security Awareness
  - Confidentiality Training
  - Acceptable Use Training
  - Remote Work Security Training
- **Policy Acknowledgement Hard Ledger:** A unified digital signature portal where the employee must actively check, read, and sign off acknowledgment for:
  - Employee Handbook
  - Acceptable Use Policy
  - Remote Work Policy
  - Information Security Policies
  - Confidentiality Requirements
  - _System Action:_ These records must be written automatically as immutable PDFs directly into the secure employee file.

### 2.4 Cross-Departmental Offboarding Task Boards

- **Separation Initiation Trigger:** When a resignation notice, termination event, retirement, or contract expiration is logged, the system transitions the employee state to `"Separation Pipeline"`.
- **Dependency-Mapped Clearance Checklist:** The system must generate a multi-tenant shared checklist across five core functional tokens:
  1.  **Direct Manager:** Verification that the _Work Handover is Complete_.
  2.  **Information Security / IT:** Multi-step automated/manual verification that all _Security Access is Revoked and Verified_.
  3.  **Administration:** Verification that all company property and _Assets are Returned_.
  4.  **Finance:** Verification that all _Financial Obligations are Cleared_.
  5.  **People & Culture:** Execution of _Employee File Archiving_.
- **Clearance Rule Engine:** The system must block the generation of a **Final Clearance Form** or payout trigger until all five departmental tokens evaluate to exactly `"Complete"`.

---

## 3. Module 2: Dynamic IT Access & Asset Management Matrix

### 3.1 Role-Based Access Control (RBAC) & Principle of Least Privilege

- **Hiring Manager Provisioning Dashboard:** Hiring Managers must complete an Access Request Form within the platform during onboarding, explicitly defining requested application access boundaries based entirely on the target job role.
- **The 5-Day Access Verification Cron-Job:** To adhere to internal security controls, the system must trigger a automated cron-job exactly **five (5) business days** after an employee's official resumption date. This cron-job fires an urgent high-priority compliance notification to the immediate Line Manager, forcing them to formally verify that the employee’s granted application access precisely aligns with their defined operational role and adheres to the _Least Privilege_ and _Need-to-Know_ principles.

### 3.2 Asset Lifecycle Register & Shared Liability Subsystem

- **Hardware Tracking Ledger:** Track physical company property (Laptops, Mobile Devices, Access Cards, Security Tokens, and Peripheral Equipment) from initial issuance to formal de-allocation.
- **Depreciation & Ownership Tracker:** The system must track usage milestones. If a laptop hits its **3-year usage milestone** from the original assignment date, the asset must be flagged automatically in the database. Upon initiation of an offboarding sequence for that employee, the system must alert HR and Management that this specific laptop is eligible for an **ownership transfer**, subject to final discretionary approval overrides.
- **Shared Liability Cost Calculator:** An interface to log damaged, destroyed, or lost physical company assets. The engine must compute financial deductions against the payroll module based on the following hardcoded business rules:
  $$\text{Liability Amount} = \begin{cases} 0.50 \times \text{Replacement Cost}, & \text{if Assessment} = \text{"Accidental Damage"} \\ 1.00 \times \text{Replacement Cost}, & \text{if Assessment} = \text{"Proven Negligence / Misuse / Loss"} \end{cases}$$

---

## 4. Module 3: Strict Compliance Time & Attendance Module

### 4.1 The "10:10 AM" Grace-Period Clock

- **Hybrid Attendance Engine:** Support attendance logs ingested via physical office biometric clock-ins or remote IP/location-verified check-ins.
- **Database Tagging Parameter:** Official resumption is hardcoded to **10:00 AM**. The system provides a **10-minute grace period**. The database assessment logic must evaluate check-in timestamps as follows:
  $$\text{Attendance Tag} = \begin{cases} \text{"On-Time"}, & \text{if Timestamp} \le \text{10:10:00 AM} \\ \text{"Late"}, & \text{if Timestamp} \ge \text{10:10:01 AM} \end{cases}$$
  _System Action:_ Repeated `"Late"` tags must automatically generate an alert to HR for corrective review.

### 4.2 Three-Day Job Abandonment Trigger

- **Silent Monitoring Daemon:** The attendance module must continuously check daily logs. If a permanent or contract employee accumulates **three (3) consecutive working days** with zero attendance logs AND zero documented communication records (e.g., absence notifications, approved leave records), the system must instantly fire an automated security sequence:
  1. Lock the employee's HRMS profile status to `"Suspended - Under Review"`.
  2. Route an urgent `"Deemed Job Abandonment / Termination Review"` alert to the People & Culture administrators.

### 4.3 Missing Report Penalty & Fine Ledger

- **Document Upload Portal:** Implement a secure document repository where employees are required to submit their formal **Monthly Reports**.
- **Automated Payroll Deduction Interlock:** HODs compile departmental updates, and final reports must be uploaded by a hard deadline relative to the Monthly General Meeting. If the system detects that a monthly report remains unsubmitted past the compliance parameter without a valid approved justification, it must execute the following state machine:
  - **1st Occurrence:** Automatically append a hardcoded **$₦50,000$ deduction parameter** directly onto that employee's next processing payroll run and fire an electronic warning.
  - **3rd Occurrence (3 Strikes Rule):** Automatically invoke the Disciplinary Module, generate an open **Disciplinary Query**, and freeze any active promotion/bonus evaluation pathways.

---

## 5. Module 4: Complex Leave Engine with Embedded Business Rules

### 5.1 Proportional Annual Leave & Hard November Reset

- **Hardcoded Allocation Limits:** Confirmed employees are entitled to exactly **15 working days** of annual leave per cycle. The system must partition this allocation as **10 Rest Days** and **5 Sick Days**.
- **The 70/30 Scheduling Constraint:** At the opening of the annual leave cycle, the system must force a verification gate: the user is required to pre-schedule at least **70% of their total leave entitlement (10.5 days, rounded to 11 days)** into the team's annual leave roster, leaving a maximum of **30% (4 days)** as floating unallocated balances for personal exigencies.
- **The November 30th Hard Reset Clause:** The leave year strictly bounds from March 1st to November 30th. On exactly **November 30th at 11:59:59 PM**, the leave engine must trigger an automated clean-up script. All remaining unused annual leave balances across all employees are **forfeited completely**. Accumulation is banned; rollovers or cash-outs must evaluate to exactly $0$.

### 5.2 Maternity & Paternity Pay Tiering Logic

The leave request workflow for maternity or paternity events must interface directly with the tenure calculation database and the payroll module to apply strict regulatory compensation tiering rules.

#### Maternity Leave Rule Engine

- **Tenure Requirement:** Evaluates if the female employee is confirmed AND has continuous tenure $\ge 1\text{ Year}$.
- **Duration:** Hardcoded to exactly **16 weeks** (8 weeks pre-confinement, 8 weeks post-confinement).
- **Compensation Logic Formulation:**
  $$\text{Maternity Monthly Payout} = \begin{cases} 1.00 \times \text{Gross Pay} - (\text{Feeding Allowance} + \text{Transport Allowance}), & \text{if Tenure} \ge 1 \text{ Year and Confirmed} \\ 0.45 \times \text{Monthly Gross Salary} - (\text{Feeding Allowance} + \text{Transport Allowance}), & \text{if Tenure} < 1 \text{ Year or Unconfirmed} \end{cases}$$

#### The 24-Month Frequency Gate

- **Interlocking Query:** Before approving a Maternity or Paternity leave claim at full/standard pay parameters, the engine must query historical logs. If the timestamp of the new application falls within exactly **24 months** of the commencement date of a previously approved maternity/paternity claim, the system must trigger a restriction: it forces the current claim's compensation level down to exactly **45% of gross pay** regardless of tenure or confirmation status.

#### Post-Maternity Resumption Annual Leave Block

- **Button Freeze Rule:** Upon the formal resumption date of an employee returning from a maternity leave cycle, the system must programmatically disable, grey out, and block the `"Apply for Annual Leave"` UI button for that employee for precisely **six (6) calendar months** post-resumption.

### 5.3 Conflict Prevention Scheduling Engine

- **Cross-Check Schedule Gate:** When an employee submits any annual leave request, the engine must parse the corporate structure matrix to identify their specific organizational unit/team. The system must evaluate concurrent leave applications within that exact unit. If another employee on the same small team has an overlapping approved leave window during those dates, the system must trigger a soft conflict warning or block submission to enforce operational business continuity, routing it for explicit cross-team review.

---

## 6. Module 5: Dual Framework Career Progression & Succession Planner

The system must entirely abandon manual or subjective career tracking by implementing a dual-metric database engine that measures separate vectors: **Performance** (what was achieved) and **Competency** (the capability depth and readiness for higher scope).

### 6.1 The 50/15/20/15 Weighted KPI Scorecard

The performance appraisal engine must compile scorecard evaluations at Mid-Year and Year-End cycles using an immutable weighted formulation structure:

| Category       | Component Description                                                          | Mathematical Weight |
| :------------- | :----------------------------------------------------------------------------- | :-----------------: |
| **Category 1** | KPIs & Projects (Goal achievement, output quality, innovation, impact)         |       $50\%$        |
| **Category 2** | Learning & Development (Training completions, certified skill acquisition)     |       $20\%$        |
| **Category 3** | Timely Execution (Responsiveness, timeline adherence, deliverables completion) |       $15\%$        |
| **Category 4** | Behaviour & Communication (Ownership, teamwork, professionalism, attendance)   |       $15\%$        |

$$\text{Overall Performance Score} = (0.50 \times \text{KPI}) + (0.20 \times \text{L\&D}) + (0.15 \times \text{Execution}) + (0.15 \times \text{Behaviour})$$

### 6.2 Matrix-Based Promotion Eligibility Engine

The platform must implement an automated "Promotion Readiness" analytics dashboard. An employee can only be awarded an `"Eligible for Promotion"` status badge if the core transactional database confirms that they satisfy the following five business constraints **simultaneously**:

1.  **Tenure Constraint:** Continuous tenure within the current career level must be $\ge 12 \text{ months}$.
2.  **Performance Score Threshold:** The calculated average score across the weighted KPI scorecard must be $\ge 70\%$ over **two (2) consecutive** appraisal cycles.
3.  **Competency Proficiency Threshold:** The average rating across the core competency vectors evaluated on the 1-5 proficiency scale must be $\ge 3.0$ (Proficient).
4.  **Disciplinary Interlock:** The active count of disciplinary queries, formal warnings, or open corrective actions against the employee must equal exactly **0**.
5.  **Evidence Submission Requirement:** The employee file must contain attached verifiable artifacts of work, revenue/cost savings, or project delivery confirmations.

### 6.3 High-Potential (HiPo) Calibration & Succession Pipeline

- **9-Box Matrix Calibration Mapping:** Combine the overall Performance Score with the Competency Readiness assessment to plot employees dynamically onto a High-Potential framework.
- **Succession Pipeline Registry:** A planning grid allowing HR and Executive Management to link verified internal successors to critical corporate roles (e.g., Team Leads, HODs, Level 5 Executive roles) with defined readiness states (`"Ready Now"`, `"Ready in 1-2 Years"`), establishing clear organizational redundancy and business continuity pathways.

---

## 7. Module 6: Regulatory Audit Support & Security Vault

### 7.1 Three-Query Disciplinary Tracker & Progressive Correction Engine

- **Progressive Action State Machine:** The corrective action tracker must enforce a structured workflow for policy or performance violations. It must calculate progressive states precisely:
  $$\text{State Action} = \text{First Query} \longrightarrow \text{Second Query} \longrightarrow \text{Third Query (Final Warning)} \longrightarrow \text{Suspension / Termination Review}$$
- **Gross Misconduct Bypass Gate:** The administrator panel must retain a secure, audited override switch labeled `"Gross Misconduct Bypass"`. If activated for severe incidents (such as theft, fraud, physical violence, sexual harassment, deliberate security breach, or record falsification), the system permits the workflow to skip the intermediate queries entirely and transition immediately to absolute **Immediate Suspension or Termination Review**.

### 7.2 ISO 27001 Log Generator & Cryptographic Compliance Vault

- **Audit Trail Ledger:** The framework must maintain completely immutable log records of all security-relevant operational actions. This provides instant exportable compliance evidence for external ISO 27001 and regulatory auditors. Actions that require forced cryptographic logging include:
  - Onboarding checklist completions and document uploads.
  - Asset assignment forms and cryptographically verified digital NDA records.
  - Signed policy acknowledgments (Handbook, Remote Work Policy, Acceptable Use Policy).
  - Accounts access creation and explicit access revocation events.

### 7.3 Secure Record Disposal Engine

- **Lifecycle Retention Scheduler:** To comply with data privacy standards, all separated employee records (archived contracts, performance ratings, disciplinary records) must be assigned a legal retention duration.
- **Forced Destruction Workflow:** Upon expiration of the lifecycle timeline, the system must flag the record, block standard user visibility, and prompt the HR Compliance Officer to authorize a `"Secure Deletion Protocol"`. Once executed, the system permanently purges the sensitive files and automatically appends an un-deletable entry into the system-wide **Record Disposal Log**, capturing the date, method, and author of the destruction event.

---

## 8. Data Dictionary & Hardcoded System Constants

To ensure zero ambiguity during database schema design and business logic implementation, the following constants must be set as global multi-tenant parameters:

| Variable Identifier        | System Hardcoded Value | Operational Target Module | Contextual Rule Context                                            |
| :------------------------- | :--------------------- | :------------------------ | :----------------------------------------------------------------- |
| `RESUMPTION_TIME`          | `10:00:00 AM`          | Time & Attendance         | Baseline official start time                                       |
| `GRACE_PERIOD_LIMIT`       | `10:10:00 AM`          | Time & Attendance         | Cut-off timestamp for "On-Time" log status                         |
| `JOB_ABANDONMENT_DAYS`     | `3`                    | Time & Attendance         | Consecutive days of uncommunicated absence to trigger profile lock |
| `MONTHLY_REPORT_FINE`      | `₦50,000`              | Payroll / Ledger          | Deduction penalty for unsubmitted reports                          |
| `ANNUAL_LEAVE_TOTAL`       | `15 Days`              | Leave Management Engine   | Distributed as 10 Rest Days and 5 Sick Days                        |
| `LEAVE_PRE_SCHEDULE_PCT`   | `70%`                  | Leave Management Engine   | Minimum allocation required at start of cycle                      |
| `LEAVE_CYCLE_RESET`        | `November 30`          | Leave Management Engine   | Hard expiration date; remaining balances drop to 0                 |
| `MATERNITY_DURATION`       | `16 Weeks`             | Leave Management Engine   | Equal split of 8 weeks pre- and post-confinement                   |
| `MATERNITY_TENURED_PAY`    | `100% Gross`           | Payroll Engine            | Minus feeding and transport allowances                             |
| `MATERNITY_UNTENURED_PAY`  | `45% Gross`            | Payroll Engine            | Applied if tenure < 1 year or unconfirmed                          |
| `FREQUENCY_GATE_LIMIT`     | `24 Months`            | Leave Management Engine   | Minimum allowed gap between full-pay claims                        |
| `ANNUAL_LEAVE_FREEZE`      | `6 Months`             | Leave Management Engine   | Duration annual leave button is locked post-maternity              |
| `PROMOTION_TENURE_MIN`     | `12 Months`            | Career Progression Engine | Minimum stay at current career level                               |
| `PROMOTION_KPI_MIN`        | `70.00%`               | Career Progression Engine | Minimum average performance over two cycles                        |
| `PROMOTION_COMP_MIN`       | `3.00 / 5.00`          | Career Progression Engine | Minimum proficiency scale rating across core vectors               |
| `DISCIPLINARY_MAX_STRIKES` | `3 Queries`            | Disciplinary Tracker      | Limit before triggering suspension workflow                        |

---

## 9. Key API & Core Infrastructure Integration Hooks

The HRMS platform must expose native webhooks and integrate out-of-the-box with three specialized categories of external platforms:

1.  **Identity & Background Screening Verification APIs:** Seamlessly hook into regional background check platforms to automate updates to the Pre-Employment Verification Pipeline status.
2.  **Enterprise Digital Signature Platforms (DocuSign / HelloSign):** Two-way synchronization mapping employment offer packages, generating document status events, and releasing the backend blocker token upon absolute verification of an NDA signature.
3.  **Mobile Device Management (MDM) Engines (Kandji / Jamf / Google MDM):** Critical security integration layer. When an offboarding sequence triggers the final Information Security / IT clearance token, the HRMS system must fire an immediate API call to the MDM provider to remotely wipe corporate profiles, lock corporate hardware, and revoke organizational single sign-on (SSO) credentials instantly.

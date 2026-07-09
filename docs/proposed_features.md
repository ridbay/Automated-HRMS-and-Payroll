# Proposed HRMS Features & Additions

Based on the core specifications in `spcs.md`, here are several high-impact features and modules that can be added to the Pandar HRMS platform, categorized by role:

## 1. For the Super Admin / IT Admin (Focus on Scale, Security & System Health)
* **API & Webhook Management Dashboard:** A centralized dashboard to view webhook statuses, API rate limits, and a "Retry Failed Webhook" button for external system (MDM, DocuSign, ATS) downtime.
* **Custom Workflow & Form Builder:** A drag-and-drop form and approval workflow builder allowing Super Admins to digitize random company requests (e.g., "Request for new software license", "Travel Authorization") without requiring developer intervention.
* **Granular Audit Log Query Engine:** An advanced SQL-like search or filtering interface to quickly export logs for specific security events during an external ISO 27001 audit.

## 2. For HR / People & Culture (Focus on Talent, Culture & Total Compliance)
* **Anonymous Whistleblower / Grievance Portal:** A secure, encrypted channel where employees can report fraud, harassment, or policy violations, feeding directly into the "Gross Misconduct" workflow.
* **Pre-Offer Applicant Tracking System (ATS) Integrations:** Integrating with ATS platforms (like Lever, Greenhouse) or a lightweight native ATS to automatically pull in candidate data upon offer acceptance.
* **Pulse Surveys & eNPS (Employee Net Promoter Score):** Automated, periodic, anonymous surveys to help HR gauge team morale and predict flight risks.
* **Benefits & HMO Administration Dashboard:** A module to manage Health Maintenance Organizations (HMOs), Pension Fund Administrators (PFAs), and track employee benefit tiers, integrating directly into the payroll deductions engine.

## 3. For Finance & Admin (Focus on Payroll Accuracy, Expenses & Assets)
* **Expense Claim & Receipt OCR Module:** An engine where employees upload receipts, the system extracts the amount/merchant via OCR, routes it for HOD approval, and automatically queues it for the next payroll run.
* **Automated Statutory Tax & Pension Reports:** Automatically calculates and generates the exact CSV formats required by local tax authorities (e.g., PAYE, NHF, and Pension schedules) for easy filing.
* **Procurement & Vendor Management Access:** Extending the HRMS to track temporary contractors or vendors, ensuring they go through a modified NDA gate and their system access is auto-revoked after their contract expires.

## 4. For Line Managers / HODs (Focus on Team Productivity)
* **1-on-1 Meeting & Coaching Logs:** A tool for managers to document weekly/bi-weekly check-ins. This creates a documented trail that feeds into the "Behaviour & Communication" KPI scores during appraisals.
* **Visual Team Capacity & Shift Planner:** A visual Gantt chart showing team availability, upcoming leaves, and holidays to help managers confidently assign project deadlines and prevent bottlenecks.

## 5. For Employees (Focus on Self-Service & Engagement)
* **Interactive Org Chart & Directory:** A dynamic, visual organizational chart that lets employees see reporting lines, find cross-functional peers, and view internal contact information.
* **Internal Knowledge Base / Helpdesk:** A centralized repository where employees can read the policies they signed and a ticketing system to raise IT support or HR inquiries directly within the portal.
* **Peer-to-Peer "Kudos" & Recognition Board:** A gamified module where employees can publicly recognize peers. These "Kudos" can be weighted and added as bonus points to the "Teamwork" metric in the Performance Scorecard.

# Functional Specification: ZenHR Automated HRMS & Payroll

## 1. Executive Summary

ZenHR is a state-of-the-art, automated Human Resource Management System (HRMS) and Payroll platform. It is designed to streamline HR operations, automate complex payroll calculations, and provide a premium user experience for employees, managers, and administrators. The system prioritizes visual excellence, real-time data insights, and seamless automation of the entire employee lifecycle.

## 2. System Architecture

The application is built using a modern web stack:

- **Frontend**: React 19 with Vite, utilizing TypeScript for type safety.
- **Styling**: Vanilla CSS with a focus on premium, dynamic design (glassmorphism, vibrant gradients).
- **Animations**: Framer Motion for smooth micro-animations and transitions.
- **Icons**: Lucide-React for a consistent and modern visual language.
- **Data Visualization**: Recharts for interactive and insightful analytics.
- **State Management**: React Context API for navigation and global application state.

## 3. User Roles & Permissions

The system identifies three primary user roles:

- **Administrator (HR/Finance)**: Full access to all modules, including workforce management, payroll configuration, recruitment settings, and system-wide reports.
- **Manager**: Access to team-specific data, leave approvals, performance reviews, and recruitment pipelines for their respective departments.
- **Employee**: Access to a personal portal for attendance (clocking in/out), leave applications, payroll history (payslips), and profile management.

## 4. Functional Modules

### 4.1 Core Dashboard

The central hub for all users, providing:

- **Company Wallet**: Real-time balance tracking, virtual NUBAN account for funding, and automated payroll budget indicators.
- **Quick Stats**: At-a-glance metrics for active employees, attendance rates, and pending tasks.
- **Action Center**: Intelligent notifications for leave requests, performance reviews, and compliance alerts.
- **Visual Analytics**: Dynamic "Spending Overview" and "Spending Distribution" charts.

### 4.2 Workforce Management

Comprehensive employee lifecycle management:

- **Smart Onboarding**: An 8-step wizard for capturing basic info, employment details, compensation, statutory data (TIN, PFA), bank details, and document uploads.
- **Employee Directory**: Grid, list, and organizational chart views of the workforce.
- **Employee Detail (360° View)**: Deep dive into individual profiles, including personal info, employment history, and documents.

### 4.3 Recruitment & Talent Acquisition

End-to-end recruitment funnel:

- **Hiring Velocity Funnel**: Visual analysis of candidate drop-off at various stages (Applied, Screening, Interview, Offer, Hired).
- **Job Requisitions**: Management of open positions with priority levels and department filtering.
- **Candidate Pipeline**: A Kanban-style board for dragging and dropping candidates through the recruitment stages.
- **Assessment & Evaluation**: Integrated tools for interview scheduling and candidate scoring.

### 4.4 Payroll Processing

A robust, automated payroll engine:

- **Payroll Run Wizard**: A 7-step guided process covering Attendance, Earnings (Basic, Bonuses), Deductions (PAYE, Pension, Loans), Net Pay calculation, Review, Payment, and Post-Payroll reporting.
- **Compliance Tracking**: Monitoring of statutory remittances (Tax, Pension) with automated deadline alerts.
- **Bank File Generation**: Exporting of formatted files for seamless bank transfers.
- **Exception Handling**: Intelligent detection of missing bank details or calculation variances.

### 4.5 Employee Self-Service (ESS)

Empowering employees with self-management tools:

- **Attendance & Time Tracking**: Geo-verified clock-in/out, timer functionality, and offline sync capability.
- **Leave Management**: Dashboard for leave balances, a 5-step application wizard (including handover selection), and team availability calendar.
- **My Payroll**: Secure access to payout history, salary breakdowns, and downloadable payslips.

## 5. Technical Requirements

- **Security**: Role-based access control (RBAC), sensitive data masking (toggling payroll visibility).
- **Scalability**: Modular architecture allowing for easy addition of new features and departments.
- **Performance**: Optimized rendering with React `useMemo` and `AnimatePresence`.
- **Integrations**: Support for external attendance synchronization and statutory data syncing.

---

**Version**: 1.0.0
**Last Updated**: 2026-03-02

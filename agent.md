# AGENT.md — ZenHR Automated HRMS & Payroll

Guidance for any AI coding agent (Claude Code, Codex, Cursor, etc.) working in this repository. Read this before making changes. **This file is the single source of truth for agents** — there is no separate spec doc to cross-reference; keep it up to date as the product changes instead of spinning up new doc files.

## 1. What this project is

ZenHR is a multi-tenant HRMS & Payroll platform covering the employee lifecycle: onboarding/offboarding, attendance, leave, recruitment, performance & reviews, benefits, asset management, payroll processing, and employee self-service. It prioritizes real-time data, role-scoped visibility, and automation of routine HR/payroll workflows.

It is two apps in one repo:

- **Frontend** (repo root `src/`) — React 19 + Vite + TypeScript SPA.
- **Backend** (`api/`) — Cloudflare Workers API on Hono, using Drizzle ORM against Cloudflare D1 (SQLite).

### User roles

- **Administrator (HR/Finance)** — full access: workforce, payroll configuration, recruitment settings, company-wide reports, control center/settings.
- **Manager** — team-scoped data: direct reports' attendance/leave approvals, performance reviews, team reports.
- **Employee** — self-service portal: attendance clock-in/out, leave requests, payslips, profile, benefits, goals/reviews.

Role/permission enforcement lives in [api/src/middlewares/role.middleware.ts](api/src/middlewares/role.middleware.ts) (`requireRole`, `requirePermission`); manager-scoped data is filtered by `managerId` inside the relevant service (not by a separate middleware), following the pattern in [api/src/services/leave.service.ts](api/src/services/leave.service.ts) and [api/src/services/attendance.service.ts](api/src/services/attendance.service.ts).

### Functional modules

| Module | Frontend | Backend |
| --- | --- | --- |
| Dashboard & analytics | `features/core/Dashboard.tsx` | `services/dashboard.service.ts` |
| Workforce mgmt (directory, employee 360, org) | `features/admin/Workforce.tsx`, `EmployeeDetail.tsx`, `core/Directory.tsx` | `controllers/admin/employee.controller.ts`, `models/employee.model.ts`, `models/org.model.ts` |
| Onboarding & offboarding | `features/admin/Onboarding.tsx`, `employee/EmployeeOnboarding.tsx` | `controllers/admin/transition.controller.ts`, `models/transition.model.ts` (generic HR/IT/Finance/Admin task checklist per transition) |
| Attendance & time tracking | `features/admin/AttendanceManagement.tsx`, `employee/Attendance.tsx` | `controllers/*/attendance.controller.ts`, `services/attendance.service.ts` |
| Leave management | `features/admin/AdminLeaveRequests.tsx`, `employee/Leave.tsx` | `controllers/*/leave.controller.ts`, `services/leave.service.ts` |
| Recruitment | `features/recruitment/Recruitment.tsx`, `RecruitmentAnalytics.tsx` | `controllers/admin/requisition.controller.ts`, `models/misc.model.ts` (`jobRequisitions`) |
| Payroll processing | `features/payroll/Payroll.tsx`, `employee/MyPayroll.tsx` | `controllers/admin/payroll.controller.ts`, `services/payroll.service.ts`, `models/payroll.model.ts` |
| Performance & reviews (cycles, goals, self/peer/360, feedback, recognition) | `features/admin/PerformanceManagement.tsx`, `employee/Performance.tsx`, `AssessmentWizard.tsx` | `controllers/admin/{performance,reviewCycle,training}.controller.ts`, `controllers/employee/{assessment,goal,feedback,peerReview,performanceSummary}.controller.ts` |
| Benefits & wellness | `features/admin/BenefitsAdmin.tsx`, `employee/Benefits.tsx` | `controllers/*/benefits.controller.ts`, `models/benefits.model.ts` |
| Asset management | `features/admin/AssetManagement.tsx` | `getAssets`/`addAsset`/`deleteAsset` in `controllers/admin/employee.controller.ts`, `employeeAssets` table in `models/employee.model.ts` |
| Support / helpdesk | `features/support/Support.tsx` | `controllers/support.controller.ts`, `models/support.model.ts` |
| Reports | `features/admin/Reports.tsx`, `manager/TeamReports.tsx` | `services/reports.service.ts` |
| Settings / Control Center | `features/core/Settings.tsx` | wired directly in `routes/admin.routes.ts` via `SettingsService`/`CompanyService`/`controlCenter.service.ts` (no dedicated controller file — see §6) |
| Manager tools | `features/manager/ManagerDashboard.tsx`, `TeamReports.tsx`, `components/ApprovalCenter.tsx` | manager-scoped methods inside the leave/attendance/goal services above |

**Known stub:** `controlCenter.service.ts`'s `integrations` and `workflows` tables are seeded on/off catalogs the Settings UI reads — there's no real OAuth handshake or webhook delivery behind them yet, with two exceptions: **Slack** (a real Incoming Webhook connection) and **Mailgun** (a real API-key-based email delivery connection, surfaced in Settings ▸ Integrations alongside Slack). Don't assume any other "integration shows as connected" means it's live.

## 2. Tech stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 19, Vite 6, TypeScript, React Context (`src/context`), TanStack Query, Framer Motion, Recharts, Lucide icons, vanilla CSS |
| Backend  | Cloudflare Workers, Hono 4, Drizzle ORM, Cloudflare D1 (SQLite), `hono/jwt` for auth |
| Storage  | Cloudflare R2 (binding configured in [api/wrangler.toml](api/wrangler.toml), `storage.service.ts` implements upload/stream; company logo upload still stores a base64 data URI instead of using it — see `Settings.tsx`) |
| Tooling  | Wrangler (local Worker + D1 emulation), Drizzle Kit (migrations), Vitest (backend tests) |

## 3. Repo layout

```text
src/                      Frontend SPA
  api/client.ts           Fetch wrapper + TanStack Query hooks calling the Worker API
  components/, layouts/   Shared UI
  features/<role>/        Feature screens grouped by role: admin/, employee/, manager/, core/, payroll/, recruitment/, support/
  context/                AuthContext, NavigationContext
  data/mocks.tsx          Legacy mock data — being phased out as API integration completes; don't add new features against mocks

api/src/                  Cloudflare Worker API
  index.ts                App entry: mounts route groups, CORS, /health
  routes/                 Hono route definitions (thin — just path -> controller wiring, except Settings/Control Center, see §1)
  controllers/            Request/response handling, split into admin/ and employee/ by role
  services/               Business logic — this is where DB access and rules live
  models/                 Drizzle table schemas, one file per domain (employee, leave, payroll, benefits, ...)
  db/schema.ts            Aggregates all models/*.ts into one schema for Drizzle (barrel re-export)
  middlewares/            auth.middleware.ts (JWT — required, no fallback), role.middleware.ts, rateLimit.middleware.ts
  types/index.ts          AppEnv (Hono bindings/vars) and shared types

api/drizzle/              Generated SQL migrations (drizzle-kit generate) — never hand-edit, never delete past migrations
api/wrangler.toml         Worker + D1 binding config
```

**Convention:** routes → controllers → services → db (via Drizzle models). Controllers stay thin; business logic and queries belong in services. Keep new code consistent with this layering — don't put Drizzle queries directly in controllers or routes.

## 4. Setup & everyday commands

Frontend (repo root):

```bash
npm install
npm run dev        # Vite dev server on :3001
npm run build
```

Backend (`api/`):

```bash
npm install
npm run dev              # wrangler dev, local Worker + local D1 on :8787
npm run db:generate      # drizzle-kit generate — creates a new migration from schema changes
npm run db:migrate       # apply migrations to the local D1 instance
npm run db:studio        # Drizzle Studio GUI against the local DB
npm run test             # vitest --watch
npm run test:run         # vitest run (CI mode, single pass)
```

All requests — local/dev included — authenticate via a `Bearer` JWT; `authMiddleware` ([api/src/middlewares/auth.middleware.ts](api/src/middlewares/auth.middleware.ts)) derives `companyId`/`employeeId`/`role` from the verified token and refuses to run without a real `JWT_SECRET`. There is no `x-company-id`-header fallback anymore — it was a real RBAC bypass (an authenticated caller could spoof another tenant's `companyId`) and has been removed. Log in via `/auth/login` to get a token for local testing.

## 5. Testing — MANDATORY, not optional

**Every change that touches backend logic (routes, controllers, services, models, middleware) must be accompanied by unit and, where the change crosses a boundary (route → controller → service → db, or a multi-step service flow), integration tests. Do not consider a task done until tests exist and pass.** This applies to bug fixes too — a fix without a regression test isn't finished.

- Run `cd api && npm run test:run` before calling any backend work complete. All tests must pass — currently 49 files / 213 tests green; keep it that way.
- **Service unit tests** (`*.service.test.ts`, e.g. [api/src/services/leave.service.test.ts](api/src/services/leave.service.test.ts)): mock the Drizzle db as a chainable object — `vi.fn().mockReturnThis()` for query builder methods, `vi.fn().mockResolvedValue(...)` for terminal calls (`.all()`, `.returning()`, `.query.<table>.findFirst`, etc.) — then inject it via `(service as any).db = mockDb`. Assert both the returned value and that the right db methods were called, especially authorization short-circuits (e.g. a manager acting on someone else's report must return `null`/error without calling `update`).
- **Controller unit tests** (`*.controller.test.ts`, e.g. [api/src/controllers/admin/attendance.controller.test.ts](api/src/controllers/admin/attendance.controller.test.ts)): `vi.mock` the service module, stub methods on `Service.prototype`, and call the controller function directly with a hand-built mock Hono `Context` (`req.query`/`req.param`/`req.json`, `env`, `get`, `json` as `vi.fn()`s). Assert the service was called with the right args and `c.json` was called with the right payload/status.
- **Middleware unit tests** (`*.middleware.test.ts`, e.g. [api/src/middlewares/auth.middleware.test.ts](api/src/middlewares/auth.middleware.test.ts)): same mock-`Context` approach, asserting `next()` is/isn't called and the right error response shape.
- **Integration tests**: exercise the real Hono app end-to-end via `app.request()` — see [api/src/index.test.ts](api/src/index.test.ts) for the pattern (mocks `hono/jwt`'s `verify`, then asserts on routing/auth status codes through the full middleware chain). Add to this style of test for new routes, non-trivial multi-table operations, or auth/tenant edge cases. Treat [test-api.js](test-api.js) as a scratch/manual-check script only, never a substitute for a real test under `api/src/**/*.test.ts`.
- New Drizzle models/queries: test against realistic data shapes, including empty results, not-found, and cross-tenant access attempts (a company must never see another company's rows — this is a multi-tenant system, so tenant-scoping bugs are security bugs).
- Frontend currently has **no test harness configured** (no Vitest/RTL wired into the root `package.json`). If you touch frontend logic that has meaningful branching (hooks, wizards, calculations), either add one (Vitest + React Testing Library is the natural fit given Vite) or, at minimum, flag the gap explicitly in your summary — don't silently skip verification. Prefer testing shared logic pulled out of components over testing JSX rendering.
- If a task genuinely cannot include tests (e.g. pure copy/style change), say so explicitly and why, rather than leaving it unstated.

## 6. Conventions & gotchas

- **Multi-tenancy**: nearly every query must be scoped by `companyId`. When adding a service method, check sibling methods in the same file for the tenant-scoping pattern and follow it — an unscoped query is a data-leak bug.
- **Auth is JWT-only**: `authMiddleware` requires a verified `Bearer` JWT on every route it guards — never add a header-based identity fallback (`x-company-id`, `x-employee-id`, etc.). One existed previously and was removed after audit because it let an authenticated caller spoof another tenant's `companyId`, or (via `x-employee-id` on `/auth/change-password`) hijack another account's password entirely unauthenticated. Every route mounted under `/admin` and `/employee` gets `companyId`/`employeeId`/`role` from `c.get(...)`, never from a request header.
- **Settings/Control Center is the one exception to routes → controllers → services**: those routes call `SettingsService`/`CompanyService`/`controlCenter.service.ts` directly from `admin.routes.ts` with no controller file in between. Match existing style if you extend it; don't silently "fix" it into a controller as a drive-by change.
- **Migrations**: schema changes go in `api/src/models/*.model.ts`, then `npm run db:generate` inside `api/` to produce the migration under `api/drizzle/`. Never edit a migration file that's already been generated/committed; generate a new one instead.
- **`api/src/db/schema.ts`** is just a barrel re-export of `models/*.ts` — add new models there when you create them (`export * from '../models/xyz.model'`), following the existing entries.
- **Mock data** (`src/data/mocks.tsx`) is legacy scaffolding from before the API existed. New frontend features should call the real API via `src/api/client.ts`, not extend the mocks.
- Local dev DB artifacts under `api/.wrangler/` are Miniflare's local D1 state — don't hand-edit the `.sqlite` files.
- TypeScript is strict in `api/` (`strict: true`) — keep it that way; don't introduce `any` where a real type is easy to express (existing test mocks casting `as any` for db/context stubs are an accepted exception, not a precedent for production code).

## 7. Definition of done checklist

Before reporting a backend task complete, confirm:

- [ ] Business logic lives in a service, not a controller/route (Settings/Control Center excepted, see §6).
- [ ] Queries are tenant-scoped where applicable.
- [ ] Unit tests added/updated for new/changed service, controller, or middleware logic.
- [ ] Integration test added for new/changed routes or multi-step flows, where practical.
- [ ] `cd api && npm run test:run` passes.
- [ ] New migrations generated via `db:generate` if the schema changed (and committed alongside the model change).

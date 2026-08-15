# AGENT.md — ZenHR Automated HRMS & Payroll

Guidance for any AI coding agent (Claude Code, Codex, Cursor, etc.) working in this repository. Read this before making changes.

## 1. What this project is

ZenHR is a multi-tenant HRMS & Payroll platform covering the employee lifecycle: onboarding/offboarding, attendance, leave, recruitment, performance & reviews, benefits, payroll processing, and employee self-service. See [functional_specification.md](functional_specification.md) and [docs/spcs.md](docs/spcs.md) for full product requirements, and [docs/proposed_features.md](docs/proposed_features.md) for the roadmap.

It is two apps in one repo:

- **Frontend** (repo root `src/`) — React 19 + Vite + TypeScript SPA.
- **Backend** (`api/`) — Cloudflare Workers API on Hono, using Drizzle ORM against Cloudflare D1 (SQLite).

## 2. Tech stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 19, Vite 6, TypeScript, React Context (`src/context`), TanStack Query, Framer Motion, Recharts, Lucide icons, vanilla CSS |
| Backend  | Cloudflare Workers, Hono 4, Drizzle ORM, Cloudflare D1 (SQLite), `hono/jwt` for auth |
| Storage  | Cloudflare R2 (planned — bucket binding currently commented out in [api/wrangler.toml](api/wrangler.toml)) |
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
  routes/                 Hono route definitions (thin — just path -> controller wiring)
  controllers/            Request/response handling, split into admin/ and employee/ by role
  services/                Business logic — this is where DB access and rules live
  models/                 Drizzle table schemas, one file per domain (employee, leave, payroll, benefits, ...)
  db/schema.ts            Aggregates all models/*.ts into one schema for Drizzle
  middlewares/            auth.middleware.ts (JWT), tenant.middleware.ts (x-company-id), role.middleware.ts
  types/index.ts           AppEnv (Hono bindings/vars) and shared types

api/drizzle/               Generated SQL migrations (drizzle-kit generate) — never hand-edit, never delete past migrations
api/wrangler.toml          Worker + D1 binding config
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
npm run test              # vitest --watch
npm run test:run          # vitest run (CI mode, single pass)
```

Multi-tenancy in local/dev calls is via the `x-company-id` header (see `tenantMiddleware`); authenticated requests use a `Bearer` JWT instead (see `authMiddleware` in [api/src/middlewares/auth.middleware.ts](api/src/middlewares/auth.middleware.ts)).

## 5. Testing — MANDATORY, not optional

**Every change that touches backend logic (routes, controllers, services, models, middleware) must be accompanied by unit and, where the change crosses a boundary (route → service → db, or a multi-step service flow), integration tests. Do not consider a task done until tests exist and pass.** This applies to bug fixes too — a fix without a regression test isn't finished.

- Run `cd api && npm run test:run` before calling any backend work complete. All tests must pass — currently 13 files / 82 tests green; keep it that way.
- **Unit tests**: co-locate as `*.service.test.ts` / `*.middleware.test.ts` next to the file under test (see [api/src/services/leave.service.test.ts](api/src/services/leave.service.test.ts) or [api/src/middlewares/tenant.middleware.test.ts](api/src/middlewares/tenant.middleware.test.ts) for the established pattern). Mock the Drizzle db as a chainable object with `vi.fn().mockReturnThis()` for query builder methods and `vi.fn().mockResolvedValue(...)` for terminal calls (`.all()`, `.returning()`, `.query.<table>.findFirst`, etc.), then inject it via `(service as any).db = mockDb`. Assert both the returned value and that the right db methods were called (especially authorization short-circuits — e.g. a manager acting on someone else's report must return `null`/error without calling `update`).
- **Integration tests**: for endpoints or flows that need to be verified end-to-end (new routes, non-trivial multi-table operations, auth/tenant edge cases), exercise the real Hono app via `app.request()` against an in-memory/local SQLite (the `better-sqlite3` devDependency + Drizzle's sqlite driver is available for this) rather than relying on ad hoc manual calls. Treat [test-api.js](test-api.js) as a scratch/manual-check script only, not a substitute for a real integration test in `api/src/**/*.test.ts`.
- New Drizzle models/queries: test against realistic data shapes, including empty results, not-found, and cross-tenant access attempts (a company must never see another company's rows — this is a multi-tenant system, so tenant-scoping bugs are security bugs).
- Frontend currently has **no test harness configured** (no Vitest/RTL wired into the root `package.json`). If you touch frontend logic that has meaningful branching (hooks, wizards, calculations), either add one (Vitest + React Testing Library is the natural fit given Vite) or, at minimum, flag the gap explicitly in your summary — don't silently skip verification. Prefer testing shared logic pulled out of components over testing JSX rendering.
- If a task genuinely cannot include tests (e.g. pure copy/style change), say so explicitly and why, rather than leaving it unstated.

## 6. Conventions & gotchas

- **Multi-tenancy**: nearly every query must be scoped by `companyId`. When adding a service method, check sibling methods in the same file for the tenant-scoping pattern and follow it — an unscoped query is a data-leak bug.
- **Auth fallback**: `authMiddleware` currently allows an `x-company-id` header as a fallback when no JWT is present (to support mock/admin flows mid-migration). Be deliberate about which routes should require a real JWT vs. still allow this fallback — don't widen the fallback without reason.
- **Migrations**: schema changes go in `api/src/models/*.model.ts`, then `npm run db:generate` inside `api/` to produce the migration under `api/drizzle/`. Never edit a migration file that's already been generated/committed; generate a new one instead.
- **`api/src/db/schema.ts`** is just a barrel re-export of `models/*.ts` — add new models there when you create them (`export * from '../models/xyz.model'`), following the existing entries.
- **Mock data** (`src/data/mocks.tsx`) is legacy scaffolding from before the API existed. New frontend features should call the real API via `src/api/client.ts`, not extend the mocks.
- Local dev DB artifacts under `api/.wrangler/` are Miniflare's local D1 state — don't hand-edit the `.sqlite` files.
- TypeScript is strict in `api/` (`strict: true`) — keep it that way; don't introduce `any` where a real type is easy to express (existing test mocks casting `as any` for db stubs are an accepted exception, not a precedent for production code).

## 7. Definition of done checklist

Before reporting a backend task complete, confirm:

- [ ] Business logic lives in a service, not a controller/route.
- [ ] Queries are tenant-scoped where applicable.
- [ ] Unit tests added/updated for new/changed service or middleware logic.
- [ ] Integration test added for new/changed routes or multi-step flows, where practical.
- [ ] `cd api && npm run test:run` passes.
- [ ] New migrations generated via `db:generate` if the schema changed (and committed alongside the model change).

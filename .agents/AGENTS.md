# Project Rules

## Backend Testing Location
All backend test files (e.g. `*.test.ts`) should be placed in the `api/tests/` directory, keeping the `api/src/` directory clean and focused on production code. The folder structure inside `api/tests/` should precisely mirror the structure inside `api/src/`.

## Deployment Targets
When deploying the frontend to Cloudflare Pages, ALWAYS deploy to the `automated-hrms-and-payroll` project (e.g. `npx wrangler pages deploy dist --project-name automated-hrms-and-payroll`). Do NOT deploy to or create a `zenhr-app` project.

# Cloudflare Serverless Backend Integration Plan

## Objective
Migrate the ZenHR application from a frontend-only mock-data prototype to a full-stack application using Cloudflare's serverless ecosystem.

## Tech Stack
- **Cloudflare Workers:** Serverless compute for the API backend (Hono or raw workers).
- **Cloudflare D1:** SQLite database at the edge for relational data (Employees, Payroll, etc.).
- **Cloudflare R2:** Object storage for file uploads (Employee avatars, resumes, documents).
- **Drizzle ORM:** Type-safe database interactions with D1.
- **Vitest:** Automated unit and integration testing.

## Plan Outline

1. **Backend Initialization**
   - Create an `api/` directory for the Cloudflare Worker.
   - Initialize `wrangler` for Cloudflare deployment.
   - Set up `Hono.js` (recommended) or standard Fetch API for routing.

2. **Database Schema (Drizzle ORM + D1)**
   - Define schemas in `api/src/db/schema.ts` for all entities found in `mocks.tsx`:
     - Employees
     - PayrollEntries
     - WalletTransactions
     - JobRequisitions & Candidates
     - Attendance & Leave
     - Assets
   - Setup Drizzle config and migration scripts.

3. **Storage (Cloudflare R2)**
   - Configure R2 bucket bindings in `wrangler.toml`.
   - Create API routes for uploading/downloading documents (e.g., Avatars, CVs).

4. **API Development & Vitest**
   - Implement CRUD endpoints for all entities.
   - Setup Vitest in the `api/` directory.
   - Write tests for the Drizzle queries and Worker endpoints.

5. **Frontend Integration**
   - Replace the mock data in the React frontend with API calls (`fetch` or a data-fetching library like React Query) pointing to the local/deployed Cloudflare Worker.

Let me know your thoughts on this approach, particularly if you want to use a micro-framework like Hono for the Cloudflare Worker, or just raw Worker syntax!

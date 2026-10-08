# Thesis artefacts: status and handoff

Project: *Design and Implementation of a Scalable Human Resource Management System Using Serverless Cloud Architecture* (UNILAG MIT899). The report is a Google Doc (Arial); the PDF export is in `project/`. This file records what has been produced for the report's figure and table placeholders, how it was made, and what is left, so that work can continue in another tool.

## 1. What is done

| Artefact | File | How it was made |
|---|---|---|
| Table 2.1 Cloud delivery models | `project/tables/table_2_1.html` | HTML table, paste into Docs |
| Table 2.2 Tenant isolation models | `project/tables/table_2_2.html` | HTML table |
| Table 2.3 Comparative review | `project/tables/table_2_3.html` | HTML table, marks justified from Sections 2.10–2.11 |
| Figure 2.1 Timeline | `project/figures/figure_2_1.png` | SVG/HTML source → PNG |
| Figure 2.2 Venn diagram | `figure_2_2.png` | SVG |
| Figure 3.1 Architecture | `figure_3_1.png` | SVG, from `api/wrangler.toml` bindings |
| Figure 3.2 Layered backend | `figure_3_2.png` | HTML/SVG, from `api/src/middlewares` |
| Figure 3.3 Conceptual framework | `figure_3_3.png` | HTML |
| Figure 3.4 Use case diagram | `figure_3_4.png` | SVG generated from a use-case list in the source |
| Figure 3.5 Context DFD | `figure_3_5.png` | SVG (8 entities incl. Super Administrator) |
| Figure 3.6 Level 1 payroll DFD | `figure_3_6.png` | SVG, from `payroll.service.ts` |
| Figure 3.7 ERD | `figure_3_7.png` | SVG, from the Drizzle models |
| Figure 3.8 Request pipeline | `figure_3_8.png` | HTML/SVG |
| Figure 3.9 Gross-to-net | `figure_3_9.png` | Drawn for the **Nigeria Tax Act 2025** and the salary-component split (target code; see TODO) |
| Figure 3.10 Role-scoped views | `figure_3_10.png` | Real screenshots |
| Figure 3.11 AI assistant sequence | `figure_3_11.png` | SVG, from `ai.service.ts` |
| Figure 4.1 Login / forced change | `figure_4_1.png` | Real screenshots |
| Figure 4.2 Directory and profile | `figure_4_2.png` | Real screenshots |
| Figure 4.3 Offboarding board | `figure_4_3.png` | Real screenshot + callouts |
| Figure 4.4 Attendance clock-in | `figure_4_4.png` | Real screenshots (genuine UI clock-in, classified LATE) |
| Figure 4.5 Leave balances / approval | `figure_4_5.png` | Real screenshots |
| Figure 4.6 Recruitment pipeline | `figure_4_6.png` | Real screenshots |
| Figure 4.7 Public careers page | `figure_4_7.png` | Real screenshot + rendered browser address bar |
| Figure 4.8 Payroll preview & exceptions | `figure_4_8.png` | Real screenshots (October 2026 preview with Chinedu Obi missing bank details exception) |
| Figure 4.9 Payslip & compliance calendar | `figure_4_9.png` | Real screenshots (Amaka Eze itemised payslip + statutory compliance remittance calendar) |
| Figure 4.10 Review cycle configuration | `figure_4_10.png` | Real screenshots (active Q3 2026 Review stage progression bar + stage window timeline editor) |
| Figure 4.11 AI assistant scoped & refusal | `figure_4_11.png` | Real screenshots using Workers AI ((a) HR Admin headcount query, (b) Manager payroll refusal) |
| Figure 4.14 Cost curve | `figure_4_14.png` | Matplotlib curve (`scripts/figures/figure_4_3_cost_curve.py`) |

Every figure's source is `project/figures/src/figure_X_Y.html`. Its header comment records the exact capture, crop and render commands. Captions go below figures; table titles above. Each figure on its own page.

Text revisions written (paste into the report once the matching TODO items are done):
- `project/chapter4-revisions.md` (pre-existing: Chapter 4 corrections, Table 4.3, cost section, shot list).
- `project/tenant-isolation-revisions.md`: rewrites of Sections 2.6, 3.5.4, 3.6.1, 3.8.3, 4.3.1, 4.4.3, Table 4.6 so the text matches the code (scoping by convention; NFR6 partially met).

## 2. What is left

| Artefact | Notes |
|---|---|
| Figure 4.12 Test-suite terminal | Do this **after** the code TODOs; counts change. |
| Section 3.6.7 / Table 3.8 text | Rewrite for the Nigeria Tax Act 2025 (no CRA; rent relief; new bands) to match Figure 3.9. |

`TODO.md` (repo root) lists every code and text mismatch found: cross-tenant gaps, role guards, NTA 2025 payroll, salary components, schema tables, assistant Table 3.9, and UI placeholders. Several figures assume those fixes.

## 3. How to reproduce or continue the screenshots

All screenshots come from the **local** stack with a fictional demo company, never production.

```bash
# terminal 1: local API (local D1 + R2; AI is remote)
cd api && npx wrangler dev src/index.ts --port 8788
# terminal 2: a separate Vite pointed at the local API
VITE_API_URL=http://127.0.0.1:8788 npx vite --port 5199 --strictPort
```

Demo data is already in the local D1 database. On a fresh database, run in order:
`node scripts/demo/seed-demo.mjs`, `node scripts/demo/seed-profile.mjs`, `node scripts/demo/seed-recruitment.mjs`.

Demo company **Ebony Crest Foods Ltd**. All demo users share the password `DemoPass#2026`; their emails are in `scripts/demo/demo-users.json` (keys: `superAdmin`, `folake` HR Admin, `emeka` Payroll Officer, `zainab` Recruiter, `tunde` Manager, `amaka` and `chinedu` Employees).

Capture tool (headless Chrome, no extra packages):
```bash
node scripts/demo/capture.mjs <userKey|anon> <out.png> \
  [--tab "<sidebar label>"] [--eval scripts/demo/shots/<script>.js] \
  [--width 1440 --height 900] [--scale 2] [--wait 4000] [--geo lat,lng]
```
`--eval` runs a small script in the page with helpers `type(selector, text)`, `click(buttonText)`, `sleep(ms)`; examples are in `scripts/demo/shots/`.

Crop with `sips -c <height> <width> --cropOffset <y> <x> in.png --out out.png` (2x pixels; sidebar is the first 512 px). Compose in `project/figures/src/figure_X_Y.html`, then render:
```bash
scripts/figures/render.sh figure_X_Y <width> <height>   # → project/figures/figure_X_Y.png at 3x
```

## 4. Conventions to keep

- Real screenshots only for Chapter 4; fictional Nigerian names; no real employee data (NDPA).
- Don't show hard-coded or broken UI as if it worked; crop it out and add it to `TODO.md`.
- Captions must describe only what is visible and true in the code.
- APA 7th for citations; cite primary sources (e.g., the Nigeria Tax Act 2025 itself).
- Diagram style: Arial, 1100 px canvas, black/grey with one blue accent (#0b3d91), red (#9b1c1c) for rejections and outstanding items.

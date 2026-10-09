# Chapter 4 revisions

Drop-in text for Chapter 4. Each block says where it goes. Bracketed notes `[like this]` are for you and should not be pasted.

---

## 0. Figure renumbering (do this first)

Figures are numbered in order of appearance. Adding figures to Section 4.3 pushes the existing three back, so every figure number and every in-text reference changes:

| Old | New | Content |
|---|---|---|
| — | 4.1 – 4.11 | Section 4.3 screenshots (shot list in section 7 below) |
| 4.1 | **4.12** | Terminal output of the test suites |
| 4.2 | **4.13** | Cold-start and warm-path response times |
| 4.3 | **4.14** | Cost against request volume |

Update the List of Figures and search the chapter for "Figure 4." to catch every cross-reference.

---

## 1. Factual corrections (the code has moved on since the draft)

**4.2.2, last paragraph:** "Forty-three migrations" → **"Forty-six migrations"**.

**4.2.5, first paragraph:** "across fifty-eight commits" → **"across eighty-seven commits at the time of writing"**. [Recount with `git rev-list --count HEAD` when you freeze the code.]

**4.3, second paragraph:** "approximately one hundred and eighty endpoints" → **"close to three hundred endpoints"**.

**4.3.1, replace the "Tenant provisioning (FR1)" paragraph with:**

> Tenant provisioning (FR1). A new company is registered through a route that inserts the company record and its first administrator account. Consistent with the pool isolation model adopted in Section 3.6.1, this is an insert operation. No database is created, no schema is migrated, and no deployment occurs, which is what satisfies NFR16's requirement that a tenant be onboardable without a code change. The company's payroll settings, salary component catalogue, statutory rates, and progressive tax bands are not written at registration. Each is created from defaults defined in the payroll service the first time it is read, so registration remains two inserts and a tenant that never runs payroll stores no payroll configuration.

**4.3.2, second paragraph:** "retrieval with filtering and pagination" → **"retrieval with search by name"**, and add at the end of that paragraph:

> The directory endpoint returns a company's full employee list in a single response rather than paginating on the server. At the headcounts evaluated in Section 4.5.1 this is inexpensive, but response size grows linearly with headcount, and server-side pagination is noted in Chapter Five as a refinement for larger tenants.

**Also update outside Chapter 4:** Section 1.4 and Chapter Five both state that the frontend has no automated tests. It now has 49 test files; see section 2 below.

---

## 1b. The documented security deviation no longer exists

The report treats the header-based tenant fallback (Section 3.8.7) as a defect that is still present. It was removed in commit `c3338b2` on 17 September 2026. On 8 October 2026 a production request carrying only an `x-company-id` header was rejected with HTTP 401. The signing-secret fallback described in the same section is also gone: the server now refuses to issue tokens without a configured secret. Unit tests cover both behaviours (`tests/middlewares/auth.middleware.test.ts`, `tests/controllers/auth.controller.test.ts`). This upgrades Objective 3 to fully achieved, and the change has to be carried through every place the deviation is mentioned.

**3.8.7: retitle to "Resolved deviation: header-based tenant fallback" and replace the whole section with:**

> An earlier build of the system deviated from the intended authentication model, and the deviation is recorded here, together with its resolution, because an accurate account of a system's security history is more useful than a flattering one.
>
> During an early development phase, before token-based authentication was complete, the authentication middleware accepted a company identifier supplied in a request header as a substitute for a verified token, so that the frontend could operate against seeded data without an authentication flow. A request presenting only that header was scoped to one company but carried no verified identity and no role claim, which meant the role-gating stage of the pipeline had nothing authoritative to evaluate and the guarantees described in Section 3.8.2 did not hold for it. Tenant isolation itself was not bypassed, since such a request remained confined to a single company, but the weakening of access control was real rather than theoretical.
>
> The fallback has since been removed. The authentication middleware now rejects any request that does not present a valid token, before tenant resolution or any module logic runs, and a unit test asserts that a request carrying only the company header is refused. A related weakness was removed at the same time: where the token signing secret had previously fallen back to a fixed development value when unconfigured, the server now refuses to issue or verify tokens at all, returning a server-misconfiguration error instead. This fail-closed behaviour was exercised in practice during the evaluation reported in Chapter Four, when a misconfigured production secret caused authentication to be refused outright rather than silently served with a predictable key.

**4.2.5, second paragraph:** replace "As recorded in Section 3.8.7, the token signing secret falls back to a fixed development value when the environment variable is absent, which must be explicitly configured in any production deployment." with:

> If the signing secret is absent, the server refuses to issue or verify tokens rather than falling back to a default value (Section 3.8.7), so a deployment cannot run with a predictable key by omission.

**4.3.11, "Mandatory verified authentication (FR65)" paragraph: replace with:**

> Mandatory verified authentication (FR65). The assistant endpoint requires a verified token carrying a role claim, because the tool-scoping logic keys off that claim. The shared authentication middleware already rejects unauthenticated requests, so the endpoint's own check is a second line of defence: a request that reached it without a role claim would be refused rather than served with reduced scoping.

**4.4.3, last paragraph:** delete ", and the header-based tenant fallback documented in Section 3.8.7 remains present in the tested build". Then add to the "Middleware short-circuiting" paragraph:

> These include a request that presents a company identifier in a header but no token, which is rejected at the authentication stage, confirming that the fallback described in Section 3.8.7 is no longer accepted.

**Table 4.6, Objective 3 row:** Status → **Achieved**. Evidence → **Sections 4.3.1 and 4.4.3; earlier deviation resolved (Section 3.8.7)**.

**4.5.4, first paragraph under Table 4.6:** delete "Objective 3 is met with the deviation documented in Section 3.8.7." and change "Seven of the eight objectives" to match the final Table 4.6. [Recount once the Objective 8 row is settled.]

**4.5.4, final paragraph:** "tenant isolation and role scoping are implemented and tested, subject to the documented fallback;" → **"tenant isolation and role scoping are implemented and tested;"**

**Chapter Five:** the fallback's removal is currently the first recommendation. Move it to "problems encountered", describing it as found and fixed. Also check Section 1.4 and the Chapter One objectives for any mention of the fallback.

---

## 2. Section 4.4: testing (Table 4.2 is out of date)

The suites were re-run on 7 October 2026. The backend now has **63 files / 404 tests** (the draft says 57 / 275), and the frontend, which the draft says has no test harness, has **49 files / 507 tests**. All pass.

**4.4.1: insert after the "Integration tests" paragraph:**

> Frontend component tests. The React application is tested with Vitest in a simulated browser environment (jsdom) using React Testing Library. Each test renders a feature view with the API client module mocked, interacts with it as a user would by locating elements through their accessible roles and visible text, and asserts both on what the view displays and on the API calls it issues. Animation and charting libraries whose behaviour depends on real layout are replaced with lightweight stubs, so the tests exercise the view's own logic (data shaping, conditional rendering, and form handling) rather than third-party rendering code.

**4.4.2: replace Table 4.2 with:**

Table 4.2: Automated test suite execution results

| Metric | Backend (API) | Frontend (UI) |
|---|---:|---:|
| Test files executed | 64 | 49 |
| Test files passed | 64 | 49 |
| Test files failed | 0 | 0 |
| Individual test cases executed | 427 | 507 |
| Individual test cases passed | 427 | 507 |
| Individual test cases failed | 0 | 0 |
| Pass rate | 100% | 100% |
| Total wall-clock duration | 6.87 s | 59.89 s |

[Take these numbers from the same run as your Figure 4.12 screenshot. Durations vary slightly between runs.]

**Replace the paragraph beginning "All 57 test files…" and the "execution time" paragraph after it with:**

> All 113 test files and all 934 individual test cases passed. The backend suite completed in 6.87 seconds of wall-clock time, of which the tests themselves accounted for 1.48 seconds. That figure is a property of the architecture rather than an incidental detail: because the service layer is testable in isolation from both the database and the HTTP layer, as NFR15 requires, no backend test provisions a database, starts a server, or waits on a network call, and running the full suite is a routine step during development rather than an occasional exercise. The frontend suite is slower, at 59.89 seconds, and the difference lies in set-up rather than in the tests: each test file constructs its own simulated browser environment, and Vitest attributes roughly 30% of the suite's tracked time to that construction alone.

**Replace the "Coverage boundary" paragraph with:**

> Coverage boundary. Each suite tests its own layer in isolation: the backend suite replaces the database with a mock, and the frontend suite replaces the API client with a mock. Neither exercises the deployed platform, and no end-to-end test drives the user interface against a running backend. The 100% pass rate should be read with that boundary in mind. Section 4.5.3 reports a defect that passed both suites and surfaced only against the real database, which is the clearest evidence of what the boundary leaves untested.

**Figure 4.12 (was 4.1): replace the placeholder with a screenshot and introduce it with:**

> Figure 4.12 shows the terminal output of both suites executed against the final implementation, from which the figures in Table 4.2 are taken.

Caption (below the figure): **Figure 4.12: Terminal output of the backend and frontend test suites**

[How to take it: from the project root, in a terminal window about 110 columns wide, run
`npm run test:run --prefix api && npm run test:run`
then screenshot the end of the output so both "Test Files … passed" summaries are visible. Use a light terminal theme so it prints well.]

---

## 3. Section 4.5.1: response-time method (replace the "Method" paragraph)

[Matches what `scripts/measure-response-times.mjs` does at its defaults. If you change IDLE_MINUTES or WARM_SAMPLES, or run it somewhere other than Lagos, change the numbers here to match.]

> Method. Response times were measured against the deployed production Worker rather than the local emulation environment, because cold-start behaviour and the network path are properties of the deployed edge runtime and are not reproduced locally. To keep benchmark traffic out of live tenant data, the measurement script registered a dedicated benchmark company and seeded it with fifty active, payroll-ready employees. The administrator acted as line manager for the other forty-nine, and ten pending leave requests populated the approvals queue. All requests were issued sequentially from a single client in Lagos over the public internet. The deployment ran on Cloudflare's Workers Free plan. The Free and Paid plans differ in their limits and billing rather than in the runtime that executes the code, so the latencies reported here apply to either plan, while the cost model in Section 4.5.2 uses Paid-plan rates because that is the plan a production deployment would require. The plan does matter for one limit, discussed in Section 4.5.3: the CPU time allowed per request.
>
> For each of the ten operations in Table 4.3, the script left the Worker idle for five minutes and then issued one request on a new connection. This is the cold-start sample. It then issued twenty further requests on a kept-alive connection (ten for the assistant query, to bound inference cost), from which the median (p50) and 95th-percentile (p95) response times are reported, with percentiles computed by linear interpolation between closest ranks. Write operations were reversed immediately after each timed request, by clocking out after each clock-in and rejecting each submitted payroll run, so that every sample began from the same state. The reversals were not timed.
>
> An idle period makes eviction of the Worker's isolate likely but does not guarantee it, so cold samples were verified rather than assumed. The Worker was instrumented to report, with every response, how many requests the isolate serving it had handled, and a sample is reported as a cold start only where that count was one. Where an attempt landed on an isolate that was still warm, or failed at the network level, the idle period was repeated, up to three attempts in total. Requests that received no response within 60 seconds were recorded as failures and excluded from the statistics. The same instrumentation reports the time each request spent inside the Worker, which allows platform-side latency to be separated from network and connection set-up time in the discussion that follows.

### Table 4.3 (measured 8 October 2026, Workers Free plan, client in Lagos)

Table 4.3: Response-time measurements for representative operations

| Operation | Category | Cold start (ms) | Warm p50 (ms) | Warm p95 (ms) | Sample size |
| :--- | :--- | ---: | ---: | ---: | :---: |
| Authenticate and issue token | Interactive (authentication) | 600 | 251 | 295 | 1 cold + 20 warm |
| Retrieve employee directory (50 records) | Interactive read | 885 | 245 | 311 | 1 cold + 20 warm |
| Retrieve single employee profile | Interactive read | 633 | 221 | 242 | 1 cold + 20 warm |
| Retrieve own leave balance | Interactive read | 664 | 237 | 250 | 1 cold + 20 warm |
| Submit leave request | Interactive write | 707 | 271 | 367 | 1 cold + 20 warm |
| Record attendance clock-in† | Interactive write | 750 | 249 | 389 | 1 cold + 20 warm |
| Retrieve manager pending-approvals queue | Interactive read | 616 | 198 | 236 | 1 cold + 20 warm |
| Preview payroll run (50 employees) | Batch computation | 871 | 303 | 319 | 1 cold + 20 warm |
| Submit payroll run (50 employees) | Batch computation | 1,013 | 415 | 486 | 1 cold + 20 warm |
| Assistant query (single tool call) | Interactive read (AI) | 3,221 | 1,909 | 2,447 | 1 cold + 10 warm |

Note beneath the table:
> All cold samples were confirmed as served by a newly created isolate. † Row re-measured in full under the same procedure, after the first cold sample was delayed by a transient client-side connection stall (see text).

### Interpretation (replaces the "Interpretation to be written…" placeholder)

> Warm-path interactive operations completed with medians between 198 and 271 milliseconds and 95th percentiles no higher than 389 milliseconds, and the slowest of the 140 warm samples taken for the seven interactive operations other than the assistant took 489 milliseconds. NFR2 deliberately left the acceptable bound to measurement rather than fixing it in advance, so a reference point is needed. The response-time limits long used in usability engineering treat one second as the threshold below which a delay, though noticeable, does not interrupt the user's flow of thought (Nielsen, 1993). Every warm interactive operation falls well inside that threshold, and NFR2 is satisfied. The composition of these figures matters as much as their size. The time spent inside the Worker accounted for only 21 to 81 milliseconds of each warm request; the remaining 70 to 92 per cent was network transit between the client and the platform. At this scale, response time is governed by the network path rather than by execution, which is precisely the condition Raith et al. (2023) identify as the motivation for moving serverless execution to the edge.
>
> That observation is qualified by where the requests were actually served. Although the platform identified the test client as located in Nigeria, every request was answered by Cloudflare's Amsterdam data centre rather than one in Lagos, as shown by the data-centre identifier the platform attaches to each response, and the network round trip to that data centre was approximately 140 milliseconds. The cause of this routing was not established. It may reflect the client's internet service provider's interconnection arrangements or the platform's own routing decisions, and neither could be verified within this project. The database, meanwhile, is hosted in Western Europe. The edge-proximity benefit argued for in Chapter Two was therefore not realised for a Nigerian client in this deployment. Serving the Worker from Lagos would not by itself remove the distance, however, because each database query would then make the journey to Europe instead, and a single request issues several queries. For a deployment serving Nigerian users, the location of the database relative to those users is a design variable in its own right, and Chapter Five returns to it.
>
> The cold-start samples show a larger penalty in aggregate than in substance. The first request after idleness took between 600 and 885 milliseconds for the interactive operations, roughly three times their warm medians, yet most of that difference did not come from the platform starting the Worker. Between 326 and 546 milliseconds of each cold sample was spent establishing a new encrypted connection before the request was sent, a cost any architecture incurs on a client's first request and one the warm samples, which reused a connection, did not pay. Once the connection was open, the cold requests took between 11 and 100 milliseconds longer than the corresponding warm medians, and the time inside the Worker exceeded its warm figure by between 23 and 35 milliseconds. The penalty attributable to isolate start-up is therefore in the order of tens of milliseconds, and even the complete cold figures remain below the one-second threshold, so on this evidence cold starts are not material for the interactive category. Two further observations are consistent with that conclusion. On three occasions, the first request after five minutes of idleness was still served by a warm isolate, which suggests that under light use a user may not meet a cold start at all. And the first cold sample for the attendance clock-in, at 6,888 milliseconds, was spent almost entirely (6,545 milliseconds) establishing the connection, with only 103 milliseconds inside the Worker. It was attributed to a transient delay on the client's network, and the operation was re-measured in full; the re-measured values, a cold start of 750 milliseconds of which 99 milliseconds was spent inside the Worker, appear in Table 4.3.
>
> The payroll operations completed comfortably at the tested size. Previewing a fifty-employee run took a median of 303 milliseconds and submitting one took 415 milliseconds, with the first submission after idleness at 1,013 milliseconds. Submission is the slowest operation other than the assistant because it persists the run header and fifty payslips, written as seventeen insert statements that each respect D1's per-statement parameter limit and are committed with the header as a single atomic batch. All forty-two payroll requests, twenty-one previews and twenty-one submissions, succeeded on the Free plan, and none was rejected for exceeding its CPU allowance of 10 milliseconds per request. [ADD: measured CPU time from Workers Logs.] Elapsed time is not the binding constraint. Because the Workers clock advances only while the code waits on input or output, the 173 milliseconds a warm submission spent inside the Worker is effectively time spent waiting on the database, which does not count towards the CPU allowance. The implications for larger companies are taken up in Section 4.5.3.
>
> The assistant query departs from these patterns and is reported separately for that reason. Its warm median was 1,909 milliseconds and its 95th percentile 2,447 milliseconds, with about 90 per cent of that time spent inside the Worker, overwhelmingly in model inference across the two model calls that a single tool invocation requires. This places it above the one-second threshold but well within the ten-second limit beyond which users' attention is lost (Nielsen, 1993). For a conversational feature, where a short wait is expected, this is acceptable, and the interface shows a "Thinking…" indicator for the duration of the request.

**Figure 4.13 (was 4.2):** image at `project/figures/figure_4_2_response_times.png`. Caption below: **Figure 4.13: Cold-start and warm-path response times by operation category**

**Reference to add:**
> Nielsen, J. (1993). *Usability engineering*. Academic Press.

[Nielsen (1993) is a foundational source rather than a current one. The department's guidance permits these sparingly, and this one sets a long-standing threshold rather than carrying the currency requirement. Check the edition and page against a copy before submission.]

**Chapter Five, future work:** add a point on database placement for Nigerian users. It should cover D1 read replication (currently disabled on this database) or Smart Placement, so that queries and execution sit closer to the users they serve.

### Table 4.6, Objective 8 row

| Objective | Status | Evidence |
|---|---|---|
| 8. Evaluation of performance and cost | Achieved | Sections 4.4.2, 4.5.1 and 4.5.2; single-platform, single-client measurement acknowledged in Section 4.5.1 |

Replace the sentence about Objective 8 under Table 4.6 with:
> Objective 8 is discharged empirically for response time, from measurements against the deployed system, and analytically for cost, with the single-platform and single-client limits of the measurement stated in Section 4.5.1.

---

## 4. Section 4.5.2: cost model

**"Rate card" paragraph: replace the second sentence with:**

> All figures were re-verified against Cloudflare's published pricing documentation on 7 October 2026.

**"Modelling assumptions" paragraph: insert after "…writes on 15% of requests at approximately 2 rows each,":**

> approximately 160 KB of relational data per employee in D1,

[Table 4.5's $2.25 D1 storage charge at the large scale implies 8 GB, or 160 KB per employee, but the draft never states it. An examiner recomputing the table would get stuck here.]

**Replace the "Comparison with a provisioned baseline" paragraph with:**

> Comparison with a provisioned baseline. A functionally equivalent provisioned deployment requires, at minimum, an application server, a managed relational database, and object storage, each running continuously. To give Figure 4.14 a concrete reference line, an indicative baseline is taken from DigitalOcean's published list prices: a 2 GB virtual machine at $12.00 per month, the smallest single-node managed PostgreSQL instance at $15.15, and object storage at $5.00, a combined $32.15 per month before any traffic is served (DigitalOcean, 2026a, 2026b, 2026c). The step to $44.15 at 20 million requests per month represents the addition of a second application instance. Where that step falls depends on the workload, and it is illustrative rather than measured. The comparison is not offered as a ranking of vendors, which would not generalise beyond one provider at one moment. It is offered to show the shape of the two cost functions: a provisioned deployment's cost depends on provisioned capacity and elapsed time, whereas this system's cost depends on the work actually performed. At the small scale the system performs so little work that its cost is the subscription alone, while the provisioned equivalent pays for a full month of continuously running capacity to serve fewer than half a million requests.

**Replace the Figure 4.3 placeholder with the image `project/figures/figure_4_3_cost_curve.png`, caption (below):**

**Figure 4.14: Monthly platform cost against request volume, usage-based versus provisioned**

Source line beneath the caption:
> Usage-based cost computed from the rates in Table 4.4 and the assumptions in Table 4.5. Provisioned baseline from DigitalOcean list prices (DigitalOcean, 2026a, 2026b, 2026c).

**Insert after the figure (it shows a crossover the draft text does not address):**

> Figure 4.14 also shows where the comparison stops favouring the usage-based model. Beyond approximately 82 million requests per month, or about 93,000 employees under the stated assumptions, the modelled usage-based cost exceeds the two-instance provisioned baseline, driven by per-request and CPU-time charges. Two qualifications limit what this crossover means. First, the provisioned line is optimistic at that volume, since a single small database and two application instances sized for the small scale would be unlikely to sustain that load without further capacity steps. Second, and more decisively, the dotted line marks the point, at about 55 million requests or 62,500 employees, beyond which the pool model's single database would exceed D1's 10 GB limit. The upper end of the curve therefore already assumes the per-tenant database architecture discussed in Section 4.5.3. Across the range this project targets, the usage-based model is the cheaper of the two by a wide margin.

**References to add (APA 7th):**

> DigitalOcean. (2026a). *Droplet pricing*. https://www.digitalocean.com/pricing/droplets
>
> DigitalOcean. (2026b). *Managed databases pricing*. https://www.digitalocean.com/pricing/managed-databases
>
> DigitalOcean. (2026c). *Spaces object storage pricing*. https://www.digitalocean.com/pricing/spaces-object-storage
>
> Cloudflare. (2026x). *Limits: Cloudflare Workers*. https://developers.cloudflare.com/workers/platform/limits/

[Change "2026x" to the next unused letter after your existing Cloudflare 2026 entries. DigitalOcean is an international provider. If your supervisor wants a Nigerian comparator, the structure of the paragraph stays the same and only the three prices change.]

---

## 5. Section 4.5.3: platform constraints

**Replace the paragraph beginning "A second constraint is worth recording" with:**

> A second constraint bounds the size of a payroll run that a single Worker invocation can process. The binding limit is CPU time rather than elapsed time, since time spent waiting on the database does not count towards it. The limit depends on the plan: an HTTP request on the Free plan, on which this evaluation ran, may consume 10 milliseconds of CPU, while on the Paid plan the default is 30 seconds, configurable to a maximum of five minutes (Cloudflare, 2026x). Each isolate is also limited to 128 MB of memory on both plans. [ADD ONCE MEASURED: the CPU time recorded for the fifty-employee payroll submission; whether it stayed within the Free plan's 10 ms; and the headcount each plan's limit implies if CPU time scales linearly with employees. If any samples failed with error 1102, report that here, since it would mean the Free plan cannot process a fifty-employee run.] Beyond that size the run would need to be divided across invocations, for example by queueing employees in batches. This was anticipated in Section 3.2.3 and is recorded as the second scaling boundary of the current implementation.

**Insert as a new final paragraph of 4.5.3:**

> A third constraint was found by the evaluation itself rather than anticipated. The first attempt to submit a fifty-employee payroll run against the real database failed. D1 limits a single SQL statement to 100 bound parameters (Cloudflare, 2026d), and the ORM binds a value for every column of the payslip table, twenty-seven in all, for each row it inserts. The implementation already divided the payslip insert into chunks, but the chunk size of four rows had been chosen from the number of fields the code supplied rather than the number of columns the ORM binds, so each chunk required 108 parameters. Because the run header was written before the payslips, the failure also left a header without payslips, which blocked any resubmission for that period. The defect was corrected by deriving the chunk size from the table's column count and by writing the header and every payslip chunk in a single atomic batch, after which the submissions reported in Table 4.3 succeeded. Both test suites had passed throughout. A mocked database accepts any statement, and the parameter limit exists only in the real platform, so this is a concrete instance of the coverage boundary noted in Section 4.4.2. It also supports the recommendation in Chapter Five for integration tests that run against a real D1 instance.

---

## 6. Still pending

- **Payroll CPU time (you):** Cloudflare dashboard → Workers & Pages → zenhr-api → Logs, filter `POST /admin/payroll/runs` for 8 October 2026 (07:30–09:00 UTC), and note the CPU time. Workers Logs keeps entries for 3 days on the Free plan. This completes the bracketed sentence in the payroll paragraph of 4.5.1 and the projection in 4.5.3.
- **Figure 4.12:** the test-suite screenshot (section 2).
- **Figures 4.1–4.11:** the Section 4.3 screenshots (section 7).

Done: Table 4.3, the 4.5.1 interpretation, Figure 4.13 (`project/figures/figure_4_2_response_times.png`), and the Objective 8 row. The raw data is in `scripts/results/response-times-final.json`, which merges the main run with the clock-in re-measure.

---

## 7. Section 4.3 shot list (Figures 4.1 – 4.11)

Use a benchmark or demo company with fictional Nigerian names. **Do not screenshot real employee data**; payslips and profiles contain salary, bank, and identity details covered by the NDPA. Use a browser window of about 1440 × 900 and crop out the browser chrome, except in Figure 4.7, where the address bar is the point. Each figure goes on its own page with its caption below it, and the paragraph named in the "Place after" column should introduce it ("Figure 4.x shows…").

| Fig. | Section | Place after | What the screen must show | Caption |
|---|---|---|---|---|
| 4.1 | 4.3.1 | Authentication (FR2, FR3) | Login screen; ideally a second panel showing the forced password-change screen after a temporary-password login | Login and forced password change on first sign-in |
| 4.2 | 4.3.2 | Profile paragraph | Employee directory list, or the consolidated profile showing assets, leave balance, attendance, goals, and audit history together | Employee directory and consolidated employee profile |
| 4.3 | 4.3.3 | Clearance board paragraph | Offboarding clearance board with some functions signed off and some outstanding, so the derived stage visibly lags | Offboarding clearance board showing per-function sign-off |
| 4.4 | 4.3.4 | Classification paragraph (FR19) | Attendance view after clock-in, with the punctuality classification and the captured location visible | Attendance clock-in with punctuality classification |
| 4.5 | 4.3.5 | Leave requests paragraph | Leave balances by type plus a request in progress, or the admin approvals queue | Leave balances and request approval |
| 4.6 | 4.3.6 | Applicant tracking paragraph | Pipeline with candidates across stages and one per-interviewer scorecard open | Recruitment pipeline and interviewer scorecard |
| 4.7 | 4.3.6 | Public careers page paragraph | Careers page **with the URL bar visible**, since it is the only real URL in the app | Public careers page for an open requisition |
| 4.8 | 4.3.7 | Pre-run exceptions (FR42) | Payroll preview with totals and the exceptions list showing at least one flagged employee | Payroll run preview with pre-run exceptions |
| 4.9 | 4.3.7 | Remittance obligations paragraph | A payslip (decomposed deductions) and the compliance calendar with dated remittance tasks; two panels (a) and (b) are fine | Generated payslip and statutory compliance calendar |
| 4.10 | 4.3.8 | First paragraph | An active review cycle with its named stages and windows | Performance review cycle configuration |
| 4.11 | 4.3.11 | Authorisation re-derivation (FR63) | Two panels: (a) a normal answer to a headcount or leave question; (b) a manager asking about an employee outside their direct reports, with the assistant relaying the refusal | AI assistant: (a) scoped answer and (b) authorisation refusal |

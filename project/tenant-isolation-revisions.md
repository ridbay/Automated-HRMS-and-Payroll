# Tenant isolation revisions

The report says tenant scoping is enforced by a **shared data-access wrapper** and verified by **cross-tenant tests**. Neither exists in the code. Scoping is applied by hand in each service, and five operations had no company check at all. These revisions make the report describe the code as it really is, **on the assumption that the items in `TODO.md` (fix the five operations, add the cross-tenant tests, finish the audit) have been done.** Do not submit this text until they have.

How the story changes: the system meets **NFR5** (no cross-tenant retrieval) through a mandatory scoping convention, backed by review and tests. It only **partially meets NFR6**, because the convention is applied by each developer rather than enforced structurally. A structural wrapper becomes future work. The review that found and fixed the five gaps is reported as a finding in its own right; it is the concrete evidence for why NFR6 matters.

NFR6 itself (Section 3.4.2) is **not** changed. Rewriting a requirement after the fact to match what was built would be harder to defend than reporting honestly that it was only partly met.

Edits are listed in document order. Quoted "Find" text is what is in the current PDF.

---

## 1. Section 2.6, paragraph beginning "Where the pool model is adopted"

Two wrong cross-references and the wrapper claim.

**Find:** "as it is in this project for the reasons set out in Section 3.5,"
**Replace with:** "as it is in this project for the reasons set out in Section 3.6.1,"

**Find:** "These requirements shape the request pipeline and the shared query wrapper described in Sections 3.4 and 4.2."
**Replace with:**

> These requirements shape the request pipeline and the service-level scoping convention described in Sections 3.5.4 and 4.3.1, and Section 3.6.1 states where the implementation falls short of the third of them.

---

## 2. Section 3.5.4 Request Pipeline Design

### 2a. After the paragraph beginning "The pipeline runs in five ordered stages" (ending "…hands the request to its controller."), add:

> In the implementation, authentication and tenant resolution are carried out by a single middleware, since the company identifier is read from the same verified token that establishes the caller's identity. They are listed here as separate stages because they answer different questions, who the caller is and which company's data the request may touch, and because a failure at either has a different meaning.

### 2b. Replace the paragraph beginning "A rejection at any of the first four stages"

**Find:**
> A rejection at any of the first four stages short-circuits the pipeline before module code executes. This is what makes NFR5's cross-tenant guarantee enforceable in one place rather than separately in every module, and it is the reason no module handler contains its own tenant or role check.

**Replace with:**

> A rejection at authentication, role gating, or permission narrowing short-circuits the pipeline before module code executes. Company resolution has no separate failure of its own, because the company identifier is read from the token that authentication has just verified. Identity, company membership, and role entitlement are therefore decided once, in one place, and no module handler repeats those checks. The pipeline does not, however, confine each database query to the caller's company. It establishes the company scope from the verified token; applying that scope to every query is the responsibility of the service layer, under the convention set out in Section 3.6.1.

---

## 3. Section 3.6.1, paragraph beginning "The trade-off this accepts is stated plainly"

Replace the **whole paragraph** (it ends "…cross-tenant access tests written specifically to verify it.", just before Table 3.2) with the three paragraphs below.

> The trade-off this accepts is stated plainly. Isolation is logical rather than physical. A query that omits the company filter would return rows belonging to other companies, so the guarantee in NFR5 rests on correct query construction rather than on physical separation. This is the pool model's known weakness, and NFR6 responds to it by requiring that scoping be enforced at the data-access layer, so that the guarantee does not depend on each developer remembering the filter.
>
> The implementation meets NFR5 through a mandatory scoping convention rather than a structural mechanism. The convention has three rules. First, on every authenticated route the company identifier is taken only from the verified token, never from the request path, body, or headers, so a caller cannot nominate the company being queried. Second, every service method that touches tenant-owned data receives that identifier as an explicit parameter. Third, every read of a tenant-owned table carries the company condition, and every update or deletion of a record identified by a client-supplied key is preceded by a lookup confirming that the record belongs to the caller's company. Child records that carry no company column of their own, such as course enrolments and support ticket messages, are reached only through a parent whose ownership has been confirmed in the same way.
>
> This convention falls short of NFR6. It is applied by each service author rather than enforced by the data-access layer, and nothing in the toolchain prevents a new query from omitting it. Two measures compensate. The project's engineering conventions treat an unscoped query as a security defect rather than a logic error, and cross-tenant access tests verify the convention on the routes where a failure would matter most (Section 4.4.3). A shared data-access wrapper that injects the company constraint into every query automatically, which would satisfy NFR6 as written, is recorded as future work in Chapter Five. Section 4.3.1 reports how the convention is applied and what a review of it found.

Table 3.2 needs no change; its Pool "Principal risk" cell ("An unscoped query leaks data") is still accurate.

---

## 4. Section 3.8.3 Tenant isolation

Replace the **whole section body** with:

> As set out in Section 3.6.1, tenant isolation under the pool model is logical and therefore depends on every query carrying the company constraint. The company scope is established once per request from the verified token, and the services apply it through the scoping convention described in that section: a company condition on every read of a tenant-owned table, and an ownership check before any update or deletion of a record named by the client. Because this is a convention rather than a structural guarantee, it is verified by explicit cross-tenant access tests rather than assumed, and these are reported in Section 4.4.3. The residual risk, that a query added in future omits the condition and no mechanism catches it, is the reason NFR6 is recorded as only partially met.

(This also fixes the old cross-reference "reported in Section 4.3", which should have been 4.4.3.)

---

## 5. Section 3.8.8, "No third-party security assessment"

No change needed. "including the cross-tenant access tests noted in Section 3.8.3" is accurate once the tests exist.

---

## 6. Section 4.3.1, paragraph beginning "Tenant scoping (FR6, NFR6)"

Replace the **whole paragraph** with these two:

> Tenant scoping (FR6, NFR5, NFR6). This is the implementation detail that carries the most security weight in the system, because the pool model makes correct scoping the sole barrier to cross-tenant disclosure. The authentication middleware places the company identifier from the verified token onto the request context, and controllers read it from there and pass it to the service; no authenticated route accepts a company identifier from the client. Each service then applies it. List and lookup queries on tenant-owned tables include the company condition directly. Where a route names a record by identifier in order to change or remove it, the service first retrieves that record under the company condition, returns a not-found result if it belongs to another company, and only then performs the write against the primary key. Child records without a company column of their own are reached through a parent whose ownership has been confirmed in the same way.
>
> Scoping is therefore applied by convention in each service rather than injected by a shared wrapper. Before the evaluation, every query in the service and controller layers was reviewed against this convention. The review found five operations, in the support-ticket and learning modules, that acted on a record identified only by a client-supplied key without confirming its company: reading and posting messages on a support ticket, listing a course's enrolments, removing an enrolment, and assigning employees to a course without confirming that the employees belonged to the same company. Each was corrected to follow the ownership-check pattern, and a cross-tenant test was added for each (Section 4.4.3). The finding illustrates the weakness acknowledged in Section 3.6.1. The convention held across almost the whole codebase, yet only review had caught the exceptions, which is the argument for the structural wrapper recommended in Chapter Five.

If the audit in `TODO.md` §3 finds more than five, change "five operations" here and in §7 below, and extend the list.

---

## 7. Section 4.4.3, paragraph beginning "Cross-tenant access."

Replace the **whole paragraph** with:

> Cross-tenant access. Tests authenticate a request against one company and attempt to read, modify, or delete a record belonging to another, asserting that the record is neither returned nor changed and that the response is a not-found error. This is the test category that matters most under the pool isolation model, because the scoping convention described in Section 4.3.1 is enforced by review rather than by mechanism, and these tests are the only direct evidence that it holds. Eleven such tests were written. They cover the five operations corrected during the pre-evaluation review, together with the employee record, leave request, payslip, and employee document routes, chosen as the routes exposing the most sensitive data. They do not cover every route, and a query added in future without the company condition would not be caught unless a test were written for it.

This only replaces the "Cross-tenant access" paragraph. The edits to the "Middleware short-circuiting" paragraph and the closing paragraph in `chapter4-revisions.md` §1b still apply.

---

## 8. Section 4.4.1, paragraph beginning "New queries are expected to be tested"

No change needed; it is accurate as a stated convention.

---

## 9. Section 4.5.4 Evaluation against the objectives

### 9a. Table 4.6, Objective 2 row

| Column | New text |
|---|---|
| Status | **Achieved, with NFR6 partially met** |
| Evidence | Sections 3.6.1–3.6.7; implemented per Section 4.3.1; scoping enforced by convention rather than structurally (Section 3.6.1); constraint reported in Section 4.5.3 |

### 9b. Table 4.6, Objective 3 row, Evidence column

**Replace with:** "Sections 4.3.1 and 4.4.3, including cross-tenant access tests; earlier deviation resolved (Section 3.8.7)"

Status stays **Achieved**.

### 9c. Paragraph after Table 4.6

**Find:** "Objective 6's integration catalogue is partially implemented, as stated, and the deviation that previously qualified Objective 3 has been resolved (Section 3.8.7)."

**Replace with:**

> Objective 6's integration catalogue is partially implemented, as stated, and the deviation that previously qualified Objective 3 has been resolved (Section 3.8.7). Objective 2 is achieved with one qualification: tenant scoping is applied by a convention verified through review and testing, rather than enforced structurally at the data-access layer as NFR6 specifies (Section 3.6.1).

### 9d. Final paragraph of 4.5.4

**Find:** "tenant isolation and role scoping are implemented and tested;"
**Replace with:** "tenant isolation and role scoping are implemented and tested, although tenant scoping rests on a verified convention rather than a structural guarantee;"

---

## 10. Chapter Five (not yet written): points to include

- **Problems encountered / observations:** the pre-evaluation review found five operations that bypassed the scoping convention; all were fixed and tested. Under the pool model, review was the only thing that caught them.
- **Limitation:** NFR6 is partially met. Tenant scoping depends on every service author applying the convention, and cross-tenant tests cover the sensitive routes rather than all of them.
- **Recommendation / future work:** a scoped data-access helper that takes the company identifier once per request and adds the company condition to every query on a tenant-owned table, so that omitting it requires deliberately bypassing the helper. A complementary option is a static check in the build that flags queries on tenant-owned tables without a company condition.

---

## 11. Figures affected

- **Figure 3.2** already matches the code: it shows `authMiddleware` performing tenant resolution, with no separate `tenantMiddleware`.
- **Figure 3.8** (still to be drawn) can keep "Resolve company" as its own box; the text added in §2a explains that it is a logical stage carried out inside the authentication middleware.

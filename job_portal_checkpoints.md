# Mini Candidate Job Portal — Checkpoint Plan + Agentic IDE Prompts

**Goal:** Candidate registration/login/profile, job listings with search + filters, job applications with status tracking. Deployed demo + a clear write-up of AI-assisted development.

## Stack (aligned to Jobs Territory's listed skills)

| Layer | Choice | Skill it demonstrates |
|---|---|---|
| Frontend | React (Vite), HTML, CSS (Tailwind or plain CSS), JavaScript | React, HTML, CSS, JavaScript |
| Backend | Node.js + Express, JWT auth, Zod validation, Multer uploads | Node.js, JavaScript |
| Database | MySQL (Prisma ORM + migrations) | MySQL |
| Tests | Jest + Supertest (API), optional Vitest/Playwright (UI) | — |
| AI tools | **Claude** (builder), **ChatGPT/Codex** (cross-reviewer), **Gemini** (security + UX second opinion) | Claude, ChatGPT, Gemini |
| Deploy | Render or Railway (API), managed MySQL (Railway / Aiven free tier), Vercel (frontend) | — |

**Why MySQL, not MongoDB:** the data is relational (user → profile, job → applications), you need a unique (user, job) constraint to block duplicate applications, and a status-history table. SQL handles all three cleanly.

**Why a multi-tool workflow:** they list ChatGPT, Claude and Gemini by name. Rather than using one tool, use a deliberate loop: **one tool writes, a different tool audits.** This gives you a much stronger answer to "which tool and why" and to "how did you review AI code."

| Role | Tool | Used for |
|---|---|---|
| Builder | Claude (Claude Code, or Cursor/Antigravity with Claude) | Planning, multi-file implementation, tests |
| Cross-reviewer | ChatGPT / Codex | Review of each checkpoint's `git diff` for bugs and logic errors |
| Second opinion | Gemini | Security audit, UX/accessibility review, README/doc polish |

---

## How to use this document

1. Do the checkpoints **in order**. Each ends with a **Definition of Done** you verify yourself.
2. After each checkpoint: run the app, run tests, **commit** (`git commit -m "checkpoint N: ..."`). A tidy commit trail is evidence of AI-assisted workflow.
3. Keep an **AI log** (template at the bottom). The submission needs 2–3 prompts with outcomes.
4. Never accept blindly. Read the diff, run it, then have a *different* tool review it (prompts in Checkpoint 7 and the per-checkpoint review step).

**Per-checkpoint review step (30–60 seconds, every time):**
````text
(Paste into ChatGPT or Gemini together with `git diff main...HEAD`)
Review this diff from a Node/Express + MySQL + React job portal. List only real problems: bugs, missing validation, authorization gaps, N+1 queries, race conditions, error-handling holes, and anything that contradicts the stated requirements. Rank by severity. Do not rewrite the code, and do not praise it.
````

---

## Checkpoint 0 — Repo, rules file, and spec (45 min)

**Deliverables**
- Monorepo: `/server`, `/client`, `/docs`
- `AGENTS.md` / `CLAUDE.md` (and `.cursor/rules` if using Cursor) with project conventions
- `docs/SPEC.md` with requirements, entities, API list, status flow

**Definition of Done:** repo on GitHub, rules file committed, spec read and corrected by you.

**Prompt 0.1 — Rules file (persistent context)**
````text
You are helping me build a "Mini Candidate Job Portal" for a technical assignment from Jobs Territory (a company with an existing CRM and ATS, building a candidate-facing job platform).

Create an AGENTS.md at the repo root with project conventions:
- Stack: Node.js (ES modules) + Express, MySQL with Prisma (migrations), Zod validation, JWT auth (jsonwebtoken) with bcrypt, Multer for uploads, Jest + Supertest for tests. Frontend: React + Vite + JavaScript, React Router, TanStack Query, Tailwind CSS.
- Layout: server/src/{routes,controllers,services,middleware,validators,utils,config}, server/prisma, server/tests; client/src/{pages,components,api,hooks,context}.
- Rules: routes thin -> controllers parse/validate -> services hold business logic and DB access; every input validated with Zod; centralized error handler returning {error: {code, message, details}}; no secrets in code (use .env + .env.example); every endpoint gets at least one test; async errors always handled; small commits; never touch files outside the task scope; explain any new dependency before adding it.
- Security: bcrypt (cost >= 10), JWT with expiry, helmet, CORS locked to env origin, rate limit on auth routes, candidates can only access their own data (return 404 for others' resources), validate upload type + size, never trust client-supplied filenames, parameterized queries only.
- Workflow: for every task output a short plan first and wait for my "go", then implement, then list changed files and exactly how to test.

Do not write application code yet. Only create AGENTS.md (and a CLAUDE.md that says "see AGENTS.md").
````

**Prompt 0.2 — Spec first, code later**
````text
Read AGENTS.md. Write docs/SPEC.md for this assignment:

1. Candidate registration, login, and profile management.
2. Job listings with search and filters.
3. Job application and application status tracking.

Include: user stories, entities with fields and relationships, REST API table (method, path, auth, request/response summary), the application status state machine, non-functional notes (security, pagination, validation, error format), and an explicit "out of scope" list (recruiter portal, email sending, payments). Keep it under 2 pages. If anything is ambiguous, list it as a question instead of guessing.
````

**Prompt 0.3 — Scaffold**
````text
Scaffold the monorepo per AGENTS.md: server (Express app with app.js separated from server.js so Supertest can import the app, config loader that validates env with Zod, helmet, cors, JSON body limit, request logging, centralized error handler, GET /api/health) and client (Vite + React + Tailwind + React Router + TanStack Query). Add root README stub, .gitignore, .env.example for both, and npm scripts (dev, test, lint). Verify both start. Plan first.
````

---

## Checkpoint 1 — Data model and migrations (45 min)

**Entities**
- `User` (id, email unique, passwordHash, role = CANDIDATE, createdAt)
- `CandidateProfile` (userId unique FK, fullName, phone, location, headline, summary, skills (JSON), experienceYears, currentTitle, resumePath, linkedinUrl, githubUrl)
- `Job` (id, title, company, location, jobType [FULL_TIME/PART_TIME/CONTRACT/INTERNSHIP], workMode [ONSITE/REMOTE/HYBRID], experienceLevel, salaryMin, salaryMax, skills (JSON), description, status [OPEN/CLOSED], postedAt)
- `Application` (id, userId, jobId, coverNote, resumePath, status, appliedAt, updatedAt) with **unique (userId, jobId)**
- `ApplicationStatusHistory` (applicationId, fromStatus, toStatus, note, changedAt) — powers the tracking timeline

**Status flow:** `SUBMITTED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → OFFERED → HIRED`, with `REJECTED` and `WITHDRAWN` as terminal exits.

**Prompt 1.1**
````text
Read AGENTS.md and docs/SPEC.md. Plan, then implement the database layer only:

- Prisma schema (MySQL) for User, CandidateProfile, Job, Application, ApplicationStatusHistory with enums for role, jobType, workMode, jobStatus and applicationStatus.
- Constraints: unique email; @@unique([userId, jobId]) on Application; indexes on Job (title, location, jobType, workMode, status, postedAt); FKs with sensible onDelete behaviour. Use FULLTEXT index on Job (title, company, description) if Prisma/MySQL setup allows; otherwise explain the fallback.
- Initial migration.
- prisma/seed.js: idempotent seed of 40 realistic jobs (varied titles, companies, Indian cities + Remote, job types, work modes, salary ranges in INR, skills arrays) plus one demo candidate.

Show the plan first. After implementing, give the commands to migrate + seed and a SQL query to verify the data.
````

**Definition of Done:** `prisma migrate deploy` works on a fresh DB; seed creates 40 jobs; re-running seed doesn't duplicate.

---

## Checkpoint 2 — Auth: register, login, me (1 hr)

**Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

**Prompt 2.1**
````text
Implement authentication following AGENTS.md.

- POST /api/auth/register {email, password, fullName}: Zod-validate (valid email; password >= 8 chars with at least one letter and one digit). Create User and an empty CandidateProfile in one transaction. Return 201 with the user (never the hash). Duplicate email -> 409.
- POST /api/auth/login: return {accessToken, tokenType}. Use one generic error for wrong email OR wrong password (no user enumeration).
- GET /api/auth/me: current user + profile summary.
- Middleware: authenticate (verify JWT, load user, 401 on missing/invalid/expired). JWT secret and expiry from env.
- Add rate limiting (express-rate-limit) on register/login.
- Update .env.example.

Jest + Supertest tests using a separate test database: register success, duplicate email (409), weak password (422), login success, wrong password (401), unknown email returns the same error as wrong password, /me without token (401), /me with valid token (200), expired token (401).

Plan first.
````

**Definition of Done:** auth tests green; register + login manually via the UI or an API client.

---

## Checkpoint 3 — Profile management (1–1.5 hr)

**Endpoints:** `GET /api/profile`, `PATCH /api/profile`, `POST /api/profile/resume`, `GET /api/profile/resume`

**Prompt 3.1**
````text
Implement profile management for the authenticated candidate.

- GET /api/profile and PATCH /api/profile with Zod schemas: fullName (required, 2-100), phone (Indian 10-digit or E.164), location, headline, summary (max 2000), skills (array of strings, trimmed, deduplicated, max 30), experienceYears (0-50), currentTitle, linkedinUrl/githubUrl (validated URLs on the right domains). PATCH must whitelist fields (no mass assignment).
- Resume upload with Multer: POST /api/profile/resume accepts only pdf/doc/docx, max 5 MB, check mimetype AND extension, store under a random UUID filename in a configurable upload dir, never use the client filename. GET /api/profile/resume streams the file after checking ownership.
- Computed profileCompleteness (0-100) in the response, based on filled fields.
- A candidate can only read/modify their own profile.

Tests: update success, invalid phone (422), skills dedupe, oversize file (413), wrong file type (400/415), unauthenticated (401), resume download ownership.

Plan first and mention any security tradeoffs you make.
````

**Definition of Done:** profile round-trips; bad uploads rejected; tests green.

---

## Checkpoint 4 — Job listings, search, filters (1–1.5 hr)

**Endpoints:** `GET /api/jobs` (public, optional auth), `GET /api/jobs/:id`

**Query params:** `q`, `location`, `jobType` (multi), `workMode` (multi), `experienceLevel`, `salaryMin`, `skills` (comma list), `postedWithin` (days), `sort` (`newest` | `salary_desc`), `page`, `pageSize` (max 50).

**Prompt 4.1**
````text
Implement the jobs API.

- GET /api/jobs (public; if a valid token is sent, include hasApplied per job) with query params: q, location, jobType (multi), workMode (multi), experienceLevel, salaryMin, skills (comma-separated, match any), postedWithin (days), sort (newest | salary_desc), page, pageSize (default 10, max 50). Validate all params with Zod (422 on invalid).
- q matches title, company, description and skills case-insensitively. Use Prisma query building or parameterized raw SQL only; no string-built SQL.
- Response: {items, total, page, pageSize, totalPages}.
- GET /api/jobs/:id returns full detail (404 if missing or closed).
- Put filter-building in a service function (buildJobWhere) so it is unit-testable.
- Avoid N+1 queries (compute hasApplied with one extra query for the page's job ids). Tell me which indexes the queries rely on.

Tests: each filter alone, combined filters, pagination boundaries, sort order, empty results, invalid pageSize (422), SQL-injection-looking q is harmless.

Plan first.
````

**Definition of Done:** `/api/jobs?q=react&workMode=REMOTE&page=2` behaves correctly; filter tests pass.

---

## Checkpoint 5 — Applications and status tracking (1–1.5 hr)

**Endpoints**
- `POST /api/jobs/:jobId/apply`
- `GET /api/applications` (mine, status filter, paginated)
- `GET /api/applications/:id` (detail + timeline)
- `POST /api/applications/:id/withdraw`
- **Demo-only:** `PATCH /api/admin/applications/:id/status` guarded by an `X-Admin-Key` header, so you can demonstrate status progression without a recruiter portal. In the write-up, note that in production this would be driven by Jobs Territory's existing ATS.

**Rules:** one application per job (409), no applying to closed jobs, profile must have name + phone + resume, transitions validated by a state machine, every transition writes a history row.

**Prompt 5.1**
````text
Implement job applications and status tracking.

Endpoints: POST /api/jobs/:jobId/apply, GET /api/applications, GET /api/applications/:id, POST /api/applications/:id/withdraw, PATCH /api/admin/applications/:id/status (protected by X-Admin-Key from env, to simulate recruiter/ATS updates).

Rules:
- One application per (candidate, job): 409 on duplicate. Rely on the DB unique constraint and catch the Prisma unique-violation error (P2002) rather than check-then-insert, so concurrent requests are safe.
- Cannot apply to a closed job (409) or a non-existent one (404).
- Candidate must have fullName, phone and a resume; otherwise 422 listing exactly what is missing.
- Statuses: SUBMITTED, UNDER_REVIEW, SHORTLISTED, INTERVIEW, OFFERED, HIRED, REJECTED, WITHDRAWN. Put allowed transitions in a single TRANSITIONS map in a service module; invalid transitions -> 409 with a helpful message. Candidates may only withdraw, and not from terminal states.
- Every status change inserts an ApplicationStatusHistory row in the same transaction (prisma.$transaction).
- GET /api/applications supports status filter + pagination and includes job title/company.
- GET /api/applications/:id returns the application with an ordered timeline.
- Candidates only see their own applications; another user's id returns 404.

Tests: apply success, duplicate, concurrent duplicate (Promise.all of two requests -> exactly one 201), closed job, incomplete profile, list filtering, timeline order, valid/invalid transitions, withdraw, cross-user access.

Plan first, and show the state machine as a small table before coding.
````

**Definition of Done:** full lifecycle works: apply → admin changes status → candidate sees the timeline.

---

## Checkpoint 6 — Frontend (2–3 hr)

**Pages**
1. `/register`, `/login`
2. `/jobs` — search bar, filters, results, pagination, URL-synced params
3. `/jobs/:id` — detail + Apply modal, "Applied" state
4. `/profile` — form, resume upload, completeness bar
5. `/applications` and `/applications/:id` — status badges, filters, timeline, withdraw

**Cross-cutting:** AuthContext + protected routes, API client with token + 401 handling, loading/empty/error states, responsive layout, toasts.

**Prompt 6.1 — Client foundation + auth**
````text
In /client build the foundation: API client (base URL from VITE_API_URL, attaches Bearer token, on 401 clears the session and redirects to /login), AuthContext, ProtectedRoute, Register and Login pages with client-side validation matching the server rules, and a navbar that reacts to auth state. Create small reusable components (Button, Input, Card, Badge, Spinner, EmptyState, Toast). Plan first; do not build other pages yet.
````

**Prompt 6.2 — Jobs search UI**
````text
Build /jobs against GET /api/jobs.

- Debounced (400ms) search input + filters: location, job type, work mode, experience level, min salary, skills, posted within, sort.
- All filter state lives in URL query params so results are shareable and survive refresh.
- Job cards: title, company, location, type/mode badges, salary range, skill chips, posted date, "Applied" badge if hasApplied.
- Pagination, loading skeletons, empty state with "Clear filters", error state with retry.
- Mobile: filters collapse into a drawer.

Then build /jobs/:id with full description and an Apply modal (cover note). On success show a toast and flip the button to "Applied". Handle 409 and 422 with readable messages (incomplete profile -> link to /profile).
````

**Prompt 6.3 — Profile + tracking UI**
````text
Build /profile and /applications.

/profile: form for all fields with inline validation errors, skills tag input, resume upload with progress and client-side type/size checks, completeness progress bar, unsaved-changes warning.

/applications: list with distinct status badge colours, status filter, pagination. /applications/:id shows a vertical timeline from the status history (icons, timestamps, notes) and a Withdraw button with a confirm dialog (disabled in terminal states).

Use TanStack Query with correct cache invalidation after mutations.
````

**Definition of Done:** a new user can register → complete profile → search/filter → apply → see status change, entirely through the UI.

---

## Checkpoint 7 — Cross-tool review, debugging, and testing (1.5 hr)

This is what the assessors explicitly want to see. **Do real review and record real findings.**

**Prompt 7.1 — Security audit (run in Gemini, paste the server code or repo diff)**
````text
Act as a senior application security reviewer. Review this Express + MySQL (Prisma) API against the OWASP API Security Top 10. Specifically check: broken object-level authorization (profile, resume, applications), JWT handling and expiry, password hashing, user enumeration, file upload validation and path traversal, SQL injection via search params and raw queries, mass assignment in PATCH endpoints, CORS, rate limiting, helmet, error messages leaking internals, and secrets in code.

Output a table: finding | severity | file:line | suggested fix. Do not rewrite code.
````

**Prompt 7.2 — Logic/edge-case review (run in ChatGPT/Codex)**
````text
Review the application and job-filter logic for bugs and missing edge cases: race conditions on duplicate applications, pagination off-by-one, state-machine gaps, timezone handling for postedAt, N+1 queries, inconsistent error shapes, unhandled promise rejections. For each issue, give a failing Jest test first, then the minimal fix.
````

**Prompt 7.3 — Apply the fixes (back in Claude, builder role)**
````text
Below are findings from two independent reviewers (a security audit and a logic review). For each finding: decide whether it is valid, and tell me if you disagree and why. For valid ones, write the failing test first, show it failing, then fix, then show it passing. Do not change anything outside these findings.

<paste findings>
````

**Prompt 7.4 — Debug loop template (reuse whenever something breaks)**
````text
Bug: <what I did> -> <what I expected> -> <what happened>.
Error/log: <full stack trace or console error>.
Relevant files: <paths>.

Do not guess. First list 3 likely root causes ranked by probability and tell me how to confirm each (log line, query, or test). Wait for me to report which is confirmed before proposing a fix. The fix must include a regression test.
````

**Prompt 7.5 — Coverage gaps**
````text
Run Jest with coverage. List files under 80% coverage and the specific untested branches that matter (auth failures, permission checks, validation errors, state transitions). Write the missing tests. Do not modify application code unless a test reveals a real bug; if so, stop and tell me first.
````

**Prompt 7.6 — UX/accessibility pass (Gemini, with screenshots or the component code)**
````text
Review these React pages for usability and accessibility: keyboard navigation, focus management in modals, label/aria usage, colour contrast of status badges, mobile layout, empty/error/loading states, and form error clarity. Give a prioritized list of concrete fixes.
````

**Your own manual abuse checks (mention in the write-up)**
- [ ] Log in as user A, request user B's application id → 404
- [ ] Tampered or expired JWT → 401
- [ ] Upload an `.exe` renamed to `.pdf` → rejected
- [ ] Two simultaneous applies to the same job → one 201, one 409
- [ ] `q=' OR 1=1 --` → harmless
- [ ] `HIRED → SUBMITTED` → 409
- [ ] Mobile viewport walk-through

---

## Checkpoint 8 — Deployment and demo (1 hr)

**Deliverables**
- Live frontend + API, managed MySQL, migrations run, seed loaded
- Demo account in the README with a pre-populated profile and 2–3 applications in different statuses
- `GET /api/health`; CORS locked to the frontend origin

**Prompt 8.1**
````text
Prepare the project for deployment.

- Server: production start script, env-based config (DATABASE_URL for MySQL, JWT_SECRET, ADMIN_API_KEY, CORS_ORIGIN, UPLOAD_DIR), `prisma migrate deploy` on release, /api/health, trust proxy settings if needed, Dockerfile (multi-stage, non-root user).
- Provide a render.yaml (or Railway steps) for the API plus managed MySQL, and exact steps to deploy the client to Vercel with VITE_API_URL and SPA rewrites.
- Uploaded files: explain the ephemeral-disk limitation and implement a storage abstraction with a local-disk driver now; describe how S3/Cloudinary would plug in.
- A `seed:demo` script creating the demo user + 3 applications in different statuses.
- docker-compose.yml for local dev (api + mysql).

List every env var and where to set it. Plan first.
````

**Definition of Done:** an incognito browser completes the full flow on the live URL.

---

## Checkpoint 9 — README and AI-development write-up (45 min)

**Prompt 9.1 — README**
````text
Generate README.md by reading the actual repo: overview, features, architecture diagram (Mermaid), ER diagram (Mermaid), tech stack, local setup (with and without Docker), env vars, running tests, API summary table, demo credentials, live links, known limitations, and next steps (recruiter portal, email notifications via the existing ATS/CRM integration, saved jobs, job alerts, resume parsing, OAuth). Keep it accurate to the code.
````

**Write-up structure (`docs/AI_DEVELOPMENT.md`, about 1 page)**
1. **Tools used and why**: Claude as builder (plan-then-execute, multi-file edits, tests); ChatGPT/Codex as an independent logic reviewer; Gemini as security/UX second opinion. Explain that using *different* models to audit prevents a single model's blind spots from passing its own code.
2. **Prompt structure**: Context (rules file) → Spec → one small scoped task → "plan first" → constraints + acceptance tests → independent review.
3. **Development process**: spec-first, checkpoint commits, one feature per prompt, tests alongside.
4. **Debugging with AI**: hypothesis-first template, full stack traces, regression test per bug.
5. **Reviewing/testing AI code**: read every diff, cross-tool review, abuse-case checklist, coverage check. List real issues the reviewers caught.
6. **Where I overrode the AI**: 2–3 concrete examples (e.g. a reviewer finding you rejected, a design choice you changed). This is the strongest signal.

---

## AI Log (fill in as you go)

| # | Checkpoint | Tool | Prompt (short) | What it got right | What I fixed/overrode and why |
|---|---|---|---|---|---|
| 1 | 5 | Cursor (builder) | Applications + state machine + concurrent duplicate test | Unique (user, job), P2002, history in a transaction, 404 for other users | Left admin status behind `X-Admin-Key` (no fake recruiter UI) |
| 2 | 1 / debug | Cursor | Seed + tests against MySQL | 40-job seed, migrations | Seed wrote to the test DB when `DATABASE_URL` was leftover in the shell; fixed by loading `.env` in `prisma/seed.js` |
| 3 | 6 | Cursor | Jobs UI with URL-synced filters | Debounce, shareable query string, apply modal | Pagination `setField` always reset `page=1`; Next did nothing — skip reset when the key *is* `page`. Resume download uses fetch + JWT, not a bare `<a href>` |

**Best 3 to submit:**
- **5.1** (business rules + state machine + concurrency): shows constraints and precise requirements
- **7.1 → 7.3** (security audit in Gemini → fixes in Claude): shows cross-tool review discipline
- **7.4** with a real bug you hit: shows debugging method

---

## Time budget (approx. 10–13 hrs)

| Checkpoint | Time |
|---|---|
| 0 Setup + spec | 0.75 h |
| 1 Data model | 0.75 h |
| 2 Auth | 1 h |
| 3 Profile | 1.5 h |
| 4 Jobs search/filters | 1.5 h |
| 5 Applications + tracking | 1.5 h |
| 6 Frontend | 3 h |
| 7 Review/testing | 1.5 h |
| 8 Deployment | 1 h |
| 9 Docs/write-up | 0.75 h |

**If short on time, cut in this order:** FULLTEXT search (use LIKE) → profile completeness bar → Docker → UI tests. **Never cut:** auth, profile, search + filters, apply, status timeline, authorization tests, live demo link, the AI write-up.

---

## Final submission checklist

- [ ] Live demo URL (frontend) + API health URL
- [ ] Demo credentials in README
- [ ] GitHub repo with checkpoint-wise commit history
- [ ] `docs/AI_DEVELOPMENT.md` (tools and why, prompt structure, debugging, review/testing)
- [ ] 2–3 prompt examples with outcomes in the submission message
- [ ] `.env.example` committed, no secrets in the repo
- [ ] Tests passing, with the command in README

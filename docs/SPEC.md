# Mini Candidate Job Portal — Spec

Candidate-facing portal for Jobs Territory: register/login/profile, searchable job listings, applications with a status timeline. Recruiter tooling is simulated via an admin key (production would use the existing ATS).

## User stories

- As a candidate I can register, log in, and see `/me`.
- As a candidate I can complete my profile and upload a resume (pdf/doc/docx).
- As anyone I can search and filter open jobs; as a logged-in candidate I see whether I already applied.
- As a candidate I can apply once per job (cover note optional) if my profile has name, phone, and resume.
- As a candidate I can list my applications, view a status timeline, and withdraw when allowed.

## Entities

- **User:** id, email (unique), passwordHash, role=`CANDIDATE`, createdAt
- **CandidateProfile:** userId (unique FK), fullName, phone, location, headline, summary, skills (JSON), experienceYears, currentTitle, resumePath, linkedinUrl, githubUrl
- **Job:** id, title, company, location, jobType, workMode, experienceLevel, salaryMin/Max, skills (JSON), description, status OPEN|CLOSED, postedAt
- **Application:** id, userId, jobId, coverNote, resumePath, status, appliedAt, updatedAt; **unique (userId, jobId)**
- **ApplicationStatusHistory:** applicationId, fromStatus, toStatus, note, changedAt

Relationships: User 1–1 Profile; User 1–N Applications; Job 1–N Applications; Application 1–N History.

## Application status machine

Happy path: `SUBMITTED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → OFFERED → HIRED`.  
Terminal exits: `REJECTED`, `WITHDRAWN` from any non-terminal state. Candidates may only withdraw. Invalid transitions → 409.

## REST API

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/health` | public | `{ status }` |
| POST | `/api/auth/register` | public, rate-limited | `{ email, password, fullName }` → 201 user |
| POST | `/api/auth/login` | public, rate-limited | `{ accessToken, tokenType }` |
| GET | `/api/auth/me` | JWT | user + profile summary |
| GET/PATCH | `/api/profile` | JWT | get/update own profile + completeness |
| POST/GET | `/api/profile/resume` | JWT | upload / stream own resume |
| GET | `/api/jobs` | optional JWT | paginated search; `hasApplied` if authed |
| GET | `/api/jobs/:id` | public | detail; 404 if missing/closed |
| POST | `/api/jobs/:jobId/apply` | JWT | create application |
| GET | `/api/applications` | JWT | mine, status filter, paginated |
| GET | `/api/applications/:id` | JWT | detail + timeline (404 if not owner) |
| POST | `/api/applications/:id/withdraw` | JWT | withdraw |
| PATCH | `/api/admin/applications/:id/status` | `X-Admin-Key` | demo ATS status change |

Job query params: `q`, `location`, `jobType` (multi), `workMode` (multi), `experienceLevel`, `salaryMin`, `skills` (comma, match any), `postedWithin` (days), `sort` (`newest` \| `salary_desc`), `page`, `pageSize` (default 10, max 50).

## Non-functional

- Errors: `{ error: { code, message, details } }`. Validation 422; duplicate email/application 409; auth 401.
- Pagination on lists. JWT expiry from env. bcrypt cost ≥ 10. helmet, CORS from env, auth rate limits.
- Uploads: pdf/doc/docx, max 5 MB, UUID filenames, ownership check on download.
- Search uses Prisma filters (parameterized). FULLTEXT is a later optimisation; LIKE/`contains` is the fallback.

## Out of scope

Recruiter/employer portal, real email, payments, OAuth, saved jobs, alerts, resume parsing, production ATS sync.

## Open questions (not guessed)

- Exact INR salary display format and whether `salaryMax` can be null (open-ended).
- Whether closed jobs should appear in search at all (this spec: no; detail 404).

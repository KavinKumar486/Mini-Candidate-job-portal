# Mini Candidate Job Portal

**Start here:** [docs/START.md](docs/START.md) — local run (`.\scripts\dev.ps1`), easy deploy (Railway + Vercel), how to record the AI workflow.

Candidate-facing job portal for a Jobs Territory assignment: register/login/profile, searchable listings, applications, and a status timeline. Recruiter updates are simulated with an admin API key (in production that would be the existing ATS).

## Features

- Email/password auth (JWT, bcrypt, rate-limited register/login)
- Profile + resume upload (pdf/doc/docx, 5 MB, UUID filenames)
- Public job search with filters, pagination, URL-synced UI
- One application per job, state machine, history timeline, withdraw
- Demo admin endpoint to move status without a recruiter portal

## Architecture

```mermaid
flowchart LR
  Browser[React Vite client] -->|JWT REST| API[Express API]
  API --> Prisma[Prisma]
  Prisma --> MySQL[(MySQL)]
  API --> Disk[Local upload driver]
```

```mermaid
erDiagram
  User ||--|| CandidateProfile : has
  User ||--o{ Application : submits
  Job ||--o{ Application : receives
  Application ||--o{ ApplicationStatusHistory : timeline
```

## Tech stack

| Layer | Choice |
|---|---|
| Client | React, Vite, Tailwind, React Router, TanStack Query |
| API | Node.js (ESM), Express, Zod, JWT, Multer, Helmet |
| Data | MySQL + Prisma migrations |
| Tests | Jest + Supertest |

## Local setup (Docker MySQL)

**Windows (one command):** `.\scripts\dev.ps1`

```bash
docker compose up mysql -d
# MySQL is published on localhost:3307 so it does not clash with a local MySQL 8 service on 3306.
cp server/.env.example server/.env
cp client/.env.example client/.env
npm install
cd server && npx prisma migrate deploy && npm run prisma:seed && npm run seed:demo && cd ..
npm run dev
```

- API: http://localhost:4000/api/health  
- Client: http://localhost:5173  

Without Docker, create a MySQL database `jobs_portal` (and `jobs_portal_test` for Jest) and set `DATABASE_URL` / `DATABASE_URL_TEST` in `server/.env`. If you already have MySQL on port 3306, keep using Docker on **3307** as in `.env.example`.

## Environment variables

**Server:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `UPLOAD_DIR`, `ADMIN_API_KEY`, `PORT`, `NODE_ENV`, `BCRYPT_COST`  
**Client:** `VITE_API_URL` (e.g. `http://localhost:4000`)

On Render/Railway the container disk is ephemeral — uploaded resumes will disappear on restart. `server/src/storage` is the plug-in point for S3/Cloudinary.

## Tests

Requires a MySQL database (create `jobs_portal_test` or point `DATABASE_URL_TEST` at a disposable DB).

```bash
# from repo root, with MySQL running
cd server
# optional: DATABASE_URL_TEST=mysql://root:root@localhost:3307/jobs_portal_test
npx prisma migrate deploy
npm test
```

## API summary

| Method | Path | Auth |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | JWT |
| GET/PATCH | `/api/profile` | JWT |
| POST/GET | `/api/profile/resume` | JWT |
| GET | `/api/jobs` | optional JWT |
| GET | `/api/jobs/:id` | public |
| POST | `/api/jobs/:jobId/apply` | JWT |
| GET | `/api/applications` | JWT |
| GET | `/api/applications/:id` | JWT |
| POST | `/api/applications/:id/withdraw` | JWT |
| PATCH | `/api/admin/applications/:id/status` | `X-Admin-Key` |

Status flow: `SUBMITTED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → OFFERED → HIRED`, plus `REJECTED` / `WITHDRAWN`.

## Demo credentials

- Email: `candidate@demo.com`  
- Password: `Demo1234`  
- After `npm run seed:demo`, the account has a complete profile and three applications in different statuses.

Admin (local): `X-Admin-Key: change-me-admin-key` from `server/.env.example` (override in `.env`).

## Deploy

Click-by-click: [docs/START.md](docs/START.md#2-easy-deploy-about-20-minutes).

- **API + MySQL:** Railway (GitHub repo, root `server`, Dockerfile, then seed in the shell).
- **Client:** Vercel, root directory `client`, `VITE_API_URL` = public API URL. Then set API `CORS_ORIGIN` to the Vercel origin.
- Live URLs: add here once deployed.

## Known limitations

- Resume files are local-disk only.
- No recruiter UI, email, OAuth, saved jobs, or alerts.
- Search uses parameterized `contains` (not MySQL FULLTEXT).

## Next steps

Recruiter portal, ATS/CRM status webhooks, saved jobs, job alerts, resume parsing, OAuth.

See `docs/SPEC.md` and `docs/AI_DEVELOPMENT.md`.

# Mini Candidate Job Portal — Agent Conventions

Jobs Territory assignment: candidate-facing job portal (register/login/profile, search + filters, applications + status tracking).

## Stack

- **Server:** Node.js (ES modules) + Express, MySQL with Prisma (migrations), Zod, JWT (`jsonwebtoken`) + bcrypt, Multer, Jest + Supertest
- **Client:** React + Vite + JavaScript, React Router, TanStack Query, Tailwind CSS

## Layout

```
server/src/{routes,controllers,services,middleware,validators,utils,config,storage}
server/prisma
server/tests
client/src/{pages,components,api,hooks,context}
docs/
```

## Rules

- Routes stay thin. Controllers parse/validate. Services hold business logic and DB access.
- Every input is validated with Zod.
- Centralized error handler returns `{ error: { code, message, details } }`.
- No secrets in code. Use `.env` + `.env.example`.
- Every endpoint gets at least one test.
- Async errors are always handled (`asyncHandler` or equivalent).
- Small, scoped changes. Do not touch files outside the task.
- Explain any new dependency before adding it.

## Security

- bcrypt cost >= 10
- JWT with expiry from env
- helmet; CORS locked to `CORS_ORIGIN`
- Rate limit auth routes
- Candidates may only access their own data (404 for others' resources)
- Validate upload type + size; never trust client filenames
- Parameterized queries only (Prisma / bound SQL)

## Workflow

For every task: short plan → implement → list changed files and how to test.

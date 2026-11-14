# AI-assisted development

This portal was built from `job_portal_checkpoints.md` in a spec-first loop: conventions (`AGENTS.md`) → `docs/SPEC.md` → one checkpoint at a time (schema, auth, profile, jobs, applications, UI, deploy docs).

## Tools and why

- **Builder (Cursor / Claude):** multi-file implementation, Prisma schema, Express layering, Jest tests, React pages. Plan-then-execute fits a monorepo with a strict layout.
- **Cross-reviewer (ChatGPT / Codex):** intended for `git diff` logic review after each checkpoint (duplicate-apply races, pagination, state machine).
- **Second opinion (Gemini):** intended for OWASP-oriented API review and a11y/UX of status badges, modals, and forms.

Using a *different* model to audit the builder avoids the builder rubber-stamping its own bugs. That is the point of the assignment’s “which tool and why” question.

## Prompt structure that worked

1. Persistent context (`AGENTS.md`: stack, folder layout, error shape, security).
2. Spec before code (`docs/SPEC.md`: entities, API table, status machine, out of scope).
3. One scoped checkpoint with acceptance tests listed up front.
4. Constraints: Zod on every input, 404 for other users’ resources, P2002 for duplicate applications.

## Process

Checkpoints 0–6 were implemented as a single build because the repo started empty. Tests sit beside the API. Search uses parameterized Prisma filters (not string-built SQL); JSON `skills` matching is applied in the service so `q` can hit skill chips without raw SQL.

## Debugging template used

When something breaks: state what I did / expected / saw, paste the error, list three likely causes, confirm with a log or failing test, then fix with a regression test. Example: pagination `setField` always reset `page=1`, which would make “Next” a no-op — fixed by not resetting page when the changed key *is* `page`.

## Reviewing AI code (what to watch)

Real issues worth keeping in the submission:

1. **Duplicate apply races** — do not check-then-insert; catch Prisma `P2002` (covered by a concurrent `Promise.all` test).
2. **IDOR** — another candidate’s application id returns **404**, not 403 (does not confirm the id exists).
3. **Resume download** — must send the JWT; a raw `<a href>` would 401.
4. **Ephemeral uploads** on Render/Railway — local disk is a driver behind `src/storage`; production should swap in S3/Cloudinary.
5. **FULLTEXT** — not modelled in Prisma; utf8mb4 `contains` is the documented fallback.

## Where the spec was overridden

- Job text search uses Prisma `contains` plus in-memory skill matching instead of MySQL FULLTEXT so the same code path stays parameterized and testable without extra indexes.
- Completeness is 11 equally weighted fields (including resume and links), not a product-defined rubric — none was specified.
- Demo ATS updates use `X-Admin-Key` rather than a recruiter UI (explicitly out of scope).

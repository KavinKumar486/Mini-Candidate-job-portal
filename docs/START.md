# Start, deploy, record

One page for the assignment: how to run it, how to put it online, how to record the AI workflow.

---

## 1. Path to start (local)

You need: **Node 20+**, **Docker Desktop** (for MySQL), Git.

In PowerShell from the repo root:

```powershell
.\scripts\dev.ps1
```

That script will:

1. Start MySQL in Docker on port **3307**
2. Copy `.env.example` → `.env` if those files are missing
3. `npm install`
4. Run migrations + seed 40 jobs + demo user
5. Start API + Vite together

Then open:

| What | URL |
|---|---|
| App | http://localhost:5173 |
| API health | http://localhost:4000/api/health |

**Demo login:** `candidate@demo.com` / `Demo1234`

### Manual equivalent (if you do not want the script)

```powershell
docker compose up mysql -d
copy server\.env.example server\.env
copy client\.env.example client\.env
npm install
cd server
npx prisma migrate deploy
npm run prisma:seed
npm run seed:demo
cd ..
npm run dev
```

Walk this once for the demo video: register (or demo login) → Profile (phone + resume) → Jobs (search `react`, filter Remote) → Apply → Applications timeline.

---

## 2. Easy deploy (about 20 minutes)

Do **not** deploy `.env`. Hosted env vars are set in the dashboards.

### A. API + MySQL on Railway (easiest MySQL)

1. Sign in at [railway.app](https://railway.app) with GitHub.
2. **New project → Deploy from GitHub repo** → `KavinKumar486/Mini-Candidate-job-portal`.
3. Add a plugin: **MySQL**.
4. Add a service from the same repo:
   - **Root directory:** `server`
   - **Dockerfile:** `Dockerfile` (already in `server/`)
5. Variables on the API service:

| Name | Value |
|---|---|
| `DATABASE_URL` | Railway MySQL variable (use the **mysql://** URL, not the private one if health checks fail) |
| `JWT_SECRET` | a long random string (16+ chars) |
| `JWT_EXPIRES_IN` | `1d` |
| `ADMIN_API_KEY` | a long random string |
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://something.vercel.app` (set this after step B, then redeploy API) |
| `UPLOAD_DIR` | `/data/uploads` |
| `NODE_ENV` | `production` |
| `PORT` | leave unset — Railway injects it |

6. Generate a public URL for the API service.
7. Open `https://<api-host>/api/health` — expect `{"status":"ok"}`.
8. In Railway **shell** on the API service:

```bash
npx prisma migrate deploy
npm run prisma:seed
npm run seed:demo
```

### B. Frontend on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project** → same repo.
3. **Root Directory:** `client` (Edit, not the repo root).
4. Framework: Vite. Build `npm run build`, output `dist`.
5. Env var: `VITE_API_URL` = `https://<your-railway-api-host>` (no trailing slash).
6. Deploy. Copy the `*.vercel.app` URL.
7. Go back to Railway and set `CORS_ORIGIN` to that exact origin (no path, no trailing slash). Redeploy the API.

### C. Confirm

Incognito: open the Vercel URL → register or demo login → search → apply.  
Put both URLs into `README.md` under **Deploy**.

**Resume files** on Railway/Render vanish on restart (ephemeral disk). Fine for the assignment demo.

---

## 3. How to record the workflow

Assessors want **evidence you used AI on purpose**, not a silent dump of generated code.

### Screen recording (demo)

Windows: `Win + G` (Xbox Game Bar) → Capture → record, **or** OBS.

Record ~3–5 minutes:

1. GitHub repo: show checkpoint commits (`checkpoint 0` … `checkpoint 9`).
2. Local or live app: register / demo login → profile + resume → search/filter → apply → applications timeline.
3. (Optional) One Cursor prompt: paste a short task, show the plan, show the diff.

Save as `demo.mp4`. Do not record `.env` secrets or JWT tokens in the clear.

### AI log (written evidence)

Keep filling the table in `job_portal_checkpoints.md` (section **AI Log**). Three rows is enough. Use this shape:

| Column | What to write |
|---|---|
| Checkpoint | e.g. 5, 7, 2 |
| Tool | Cursor/Claude, ChatGPT, Gemini |
| Prompt (short) | One line: what you asked |
| What it got right | Concrete (endpoints, tests, constraint) |
| What I fixed/overrode | A real change you made, and why |

**Best three for the submission message** (from the assignment):

1. **Applications state machine** (checkpoint 5) — unique apply, P2002, timeline.
2. **Security review → fix** — Gemini or ChatGPT on a diff, then you apply a real fix.
3. **A real bug** — e.g. seed wrote to the wrong DB because `DATABASE_URL` was left in the shell; fix: load `.env` in `seed.js`.

Copy those three into the **email/form** as “prompt + outcome”. Full write-up: `docs/AI_DEVELOPMENT.md`.

### Still do this once (checkpoint 7)

Paste `git diff` (or the GitHub compare) into **ChatGPT** with the review prompt in `job_portal_checkpoints.md` (checkpoint 7). Paste the same into **Gemini** for the security prompt. Drop 3–5 findings into the AI log. You do not need to rewrite the app.

### Git is part of the recording

Checkpoint commits already on GitHub are the timeline. After you deploy, add one more commit that only updates README live URLs + this status — do not squash history.

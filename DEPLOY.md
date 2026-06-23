# Vercel deployment

## Why the first deploy failed

Vercel built commit **`e965f41`**, which uses **SQLite** and local file storage. That cannot work on Vercel serverless.

Use commit **`48730e4`** or newer (includes Postgres schema, Blob storage, and `vercel.json`).

---

## Step 1 — Push latest code

```bash
cd ~/Projects/pvpa-flipbook
git push origin main
```

---

## Step 2 — Add storage in Vercel (required before redeploy)

In [vercel.com/dashboard](https://vercel.com/dashboard) → **pvpa-flipbook** → **Storage**:

### A. Postgres (database)
1. **Create Database** → **Postgres** (Neon)
2. Name: `pvpa-flipbook-db`
3. **Connect** to project `pvpa-flipbook`
4. This sets `DATABASE_URL` automatically

### B. Blob (PDF uploads)
1. **Create Database** → **Blob**
2. Name: `pvpa-flipbook-blob`
3. **Connect** to project
4. This sets `BLOB_READ_WRITE_TOKEN` automatically

---

## Step 3 — Environment variables

**Settings** → **Environment Variables**:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` (your production URL) |

Apply to **Production**, **Preview**, **Development**.

> Do **not** set `DATABASE_URL` to SQLite. Remove any manual `file:./data/...` value.

---

## Step 4 — Redeploy

**Deployments** → latest failed deploy → **⋯** → **Redeploy**

Or push a new commit to trigger a build.

---

## Step 5 — Verify

- `https://YOUR-APP.vercel.app/` → 200
- `https://YOUR-APP.vercel.app/admin` → upload form
- Upload a PDF → should persist (Blob + Postgres)

---

## Build settings (auto from `vercel.json`)

- **Build command:** `bash scripts/vercel-build.sh`
- **Node.js:** 20.x (recommended in Project Settings)

---

## Local development (unchanged)

```bash
npm install
npm run db:push   # SQLite
npm run dev
```

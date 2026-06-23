# Vercel deployment — PVPA Digital Flipbook

**App:** PVPA Digital Flipbook  
**URL:** `https://pvpa-digital-flipbook.vercel.app`  
**Env var:** `NEXT_PUBLIC_BASE_URL=https://pvpa-digital-flipbook.vercel.app`

---

## Fix: `DATABASE_URL is not set` (build error)

Vercel Postgres uses **`POSTGRES_PRISMA_URL`**, not `DATABASE_URL`.  
Latest code maps these automatically — **push + redeploy** after connecting storage.

### 1. Connect Postgres (required for uploads)

1. [vercel.com/dashboard](https://vercel.com/dashboard) → **pvpa-digital-flipbook**
2. **Storage** tab → **Create Database** → **Postgres** (Neon)
3. Name: `pvpa-digital-flipbook-db`
4. **Connect** → select project **pvpa-digital-flipbook**

This auto-adds:
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL`

### 2. Connect Blob (required for PDF files)

1. **Storage** → **Create Database** → **Blob**
2. Name: `pvpa-digital-flipbook-blob`
3. **Connect** to project

This auto-adds `BLOB_READ_WRITE_TOKEN`.

### 3. Environment variable

**Settings** → **Environment Variables**:

```
NEXT_PUBLIC_BASE_URL = https://pvpa-digital-flipbook.vercel.app
```

### 4. Push latest code & redeploy

```bash
cd ~/Projects/pvpa-flipbook
git push origin main
```

Then **Deployments** → **Redeploy**.

---

## Verify after deploy

| Check | URL |
|-------|-----|
| Health | `/api/health` → `"status":"ready"` |
| Home | `/` |
| Admin | `/admin` |

---

## Build behavior (latest)

- **Postgres connected** → runs `prisma db push` + full build
- **Postgres missing** → skips db push, site still builds (setup page works; uploads need redeploy after Postgres)

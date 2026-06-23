# Vercel deployment — PVPA Digital Flipbook

**App:** PVPA Digital Flipbook  
**Live URL:** https://pvpa-flipbook.vercel.app  
**Env var:** `NEXT_PUBLIC_BASE_URL=https://pvpa-flipbook.vercel.app`

> Do **not** use `pvpa-digital-flipbook.vercel.app` — that domain is not assigned to this project.

---

## Fix: `404 DEPLOYMENT_NOT_FOUND`

You opened a URL that has **no deployment**. Use the correct live URL:

### https://pvpa-flipbook.vercel.app

| Page | URL |
|------|-----|
| Home | https://pvpa-flipbook.vercel.app |
| Admin | https://pvpa-flipbook.vercel.app/admin |
| Health | https://pvpa-flipbook.vercel.app/api/health |

---

## Connect Postgres + Blob (for uploads)

1. Vercel → **pvpa-flipbook** → **Storage** → **Postgres** → Connect  
2. **Storage** → **Blob** → Connect  
3. Push latest code → **Redeploy**

---

## Push latest URL fix

```bash
cd ~/Projects/pvpa-flipbook
git push origin main
```

Vercel auto-redeploys from GitHub.

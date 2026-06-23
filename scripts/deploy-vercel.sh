#!/usr/bin/env bash
# One-command Vercel production deploy for pvpa-flipbook
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="${HOME}/.nvm/versions/node/v20.19.0/bin:${HOME}/.nvm/versions/node/v18.20.8/bin:${PATH}"

echo "==> Vercel login (skip if already logged in)"
npx vercel@latest whoami || npx vercel@latest login

echo "==> Link project"
npx vercel@latest link --yes --project pvpa-flipbook

echo "==> Add Neon Postgres (if not already linked)"
echo "    If prompted, connect Neon and link DATABASE_URL to this project."
npx vercel@latest integration add neon || true

echo "==> Add Blob storage (if not already linked)"
echo "    In Vercel dashboard: Storage → Create → Blob → Connect to project"
echo "    Or run: npx vercel@latest blob store add pvpa-flipbook-blob"

echo "==> Deploy to production"
DEPLOY_URL=$(npx vercel@latest deploy --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1)

if [ -n "${DEPLOY_URL:-}" ]; then
  echo "==> Setting NEXT_PUBLIC_BASE_URL=$DEPLOY_URL"
  printf '%s' "$DEPLOY_URL" | npx vercel@latest env add NEXT_PUBLIC_BASE_URL production --force 2>/dev/null || true
  npx vercel@latest deploy --prod --yes
  echo ""
  echo "✓ Live at: $DEPLOY_URL"
  curl -sS -o /dev/null -w "Homepage HTTP %{http_code}\n" "$DEPLOY_URL/"
else
  echo "Deploy finished — check Vercel dashboard for URL."
fi

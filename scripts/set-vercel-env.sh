#!/usr/bin/env bash
# Sync NEXT_PUBLIC_BASE_URL to Vercel (optional — already set in vercel.json + .env.production)
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${HOME}/.nvm/versions/node/v20.19.0/bin:${HOME}/.nvm/versions/node/v18.20.8/bin:${PATH}"

URL="https://pvpa-flipbook.vercel.app"

npx vercel@latest whoami || npx vercel@latest login
npx vercel@latest link --yes --project pvpa-digital-flipbook 2>/dev/null || true

for env in production preview development; do
  printf '%s' "$URL" | npx vercel@latest env add NEXT_PUBLIC_BASE_URL "$env" --force
  echo "Set NEXT_PUBLIC_BASE_URL=$URL ($env)"
done

echo "Done. Redeploy: npx vercel deploy --prod --yes"

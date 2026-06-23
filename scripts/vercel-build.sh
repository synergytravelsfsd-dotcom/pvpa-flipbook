#!/usr/bin/env bash
# Vercel production build — PostgreSQL + Next.js
set -euo pipefail

echo "==> Using PostgreSQL Prisma schema"
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# Map Vercel Postgres (Neon) integration env vars
# https://vercel.com/docs/storage/vercel-postgres/using-an-orm#prisma
if [[ -z "${POSTGRES_PRISMA_URL:-}" ]] && [[ -n "${DATABASE_URL:-}" ]]; then
  export POSTGRES_PRISMA_URL="$DATABASE_URL"
fi
if [[ -z "${POSTGRES_URL_NON_POOLING:-}" ]]; then
  if [[ -n "${POSTGRES_URL:-}" ]]; then
    export POSTGRES_URL_NON_POOLING="$POSTGRES_URL"
  elif [[ -n "${DATABASE_URL:-}" ]]; then
    export POSTGRES_URL_NON_POOLING="$DATABASE_URL"
  fi
fi

echo "==> Prisma generate"
npx prisma generate

if [[ -z "${POSTGRES_PRISMA_URL:-}" ]] || [[ -z "${POSTGRES_URL_NON_POOLING:-}" ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Postgres not connected — skipping database setup for now."
  echo "  The site will build, but uploads need Postgres + Blob:"
  echo ""
  echo "  1. Vercel → Storage → Create → Postgres → Connect to project"
  echo "  2. Vercel → Storage → Create → Blob → Connect to project"
  echo "  3. Redeploy"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "==> Next.js build (without db push)"
  npx next build
  echo "==> Build complete (add Postgres + Blob, then redeploy for full features)"
  exit 0
fi

echo "==> Prisma db push"
npx prisma db push --skip-generate --accept-data-loss

echo "==> Next.js build"
npx next build

echo "==> Build complete"

#!/usr/bin/env bash
# Vercel production build — PostgreSQL + Next.js
set -euo pipefail

echo "==> Using PostgreSQL Prisma schema"
cp prisma/schema.postgresql.prisma prisma/schema.prisma

echo "==> Prisma generate"
npx prisma generate

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set."
  echo "Add Vercel Postgres: Project → Storage → Create → Postgres (Neon) → Connect"
  exit 1
fi

if [[ "${DATABASE_URL}" != postgres://* ]] && [[ "${DATABASE_URL}" != postgresql://* ]]; then
  echo ""
  echo "ERROR: DATABASE_URL must be PostgreSQL on Vercel (got: ${DATABASE_URL:0:20}...)"
  echo "Remove any SQLite DATABASE_URL and connect Vercel Postgres instead."
  exit 1
fi

echo "==> Prisma db push"
npx prisma db push --skip-generate --accept-data-loss

echo "==> Next.js build"
npx next build

echo "==> Build complete"

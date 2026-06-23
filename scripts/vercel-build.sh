#!/usr/bin/env bash
# Vercel production build — uses PostgreSQL schema
set -euo pipefail
cp prisma/schema.postgresql.prisma prisma/schema.prisma
prisma generate
prisma db push --skip-generate
next build

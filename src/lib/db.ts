import { PrismaClient } from '@prisma/client';

/** Map Vercel Postgres env vars for Prisma at runtime (production bundle uses PostgreSQL schema). */
function applyVercelPostgresEnv(): void {
  if (!process.env.POSTGRES_PRISMA_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_PRISMA_URL = process.env.DATABASE_URL;
  }
  if (!process.env.POSTGRES_URL_NON_POOLING) {
    process.env.POSTGRES_URL_NON_POOLING =
      process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;
  }
}

applyVercelPostgresEnv();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

/** Map Vercel Postgres env vars for Prisma (production uses PostgreSQL schema). */
export function applyVercelPostgresEnv(): void {
  if (!process.env.POSTGRES_PRISMA_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_PRISMA_URL = process.env.DATABASE_URL;
  }
  if (!process.env.POSTGRES_URL_NON_POOLING) {
    process.env.POSTGRES_URL_NON_POOLING =
      process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;
  }
}

applyVercelPostgresEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  dbReady: Promise<void> | null;
};

function isPostgresProduction(): boolean {
  return Boolean(
    process.env.VERCEL &&
      (process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL?.startsWith('postgres'))
  );
}

/** Create tables on Vercel if the first deploy skipped db push. */
async function ensureProductionSchema(): Promise<void> {
  if (!isPostgresProduction()) return;

  try {
    await db.$queryRaw`SELECT 1 FROM "Publication" LIMIT 1`;
  } catch {
    const root = process.cwd();
    const pgSchema = path.join(root, 'prisma', 'schema.postgresql.prisma');
    execSync(`cp "${pgSchema}" "${path.join(root, 'prisma', 'schema.prisma')}"`, { stdio: 'pipe' });
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'pipe',
      env: process.env,
      cwd: root,
    });
    execSync('npx prisma generate', { stdio: 'pipe', env: process.env, cwd: root });
  }
}

export function ensureDbReady(): Promise<void> {
  if (!globalForPrisma.dbReady) {
    globalForPrisma.dbReady = ensureProductionSchema();
  }
  return globalForPrisma.dbReady;
}

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

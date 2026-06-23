import { NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasPostgres = Boolean(
    process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL?.startsWith('postgres')
  );
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  let publicationCount = 0;
  let dbOk = false;
  let dbError: string | null = null;

  try {
    await ensureDbReady();
    publicationCount = await db.publication.count();
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Database error';
  }

  return NextResponse.json({
    app: 'PVPA Digital Flipbook',
    status: dbOk && hasPostgres && hasBlob ? 'ready' : 'setup_required',
    postgres: hasPostgres,
    blob: hasBlob,
    databaseConnected: dbOk,
    publicationCount,
    dbError,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? null,
    message:
      dbOk && hasPostgres && hasBlob
        ? publicationCount > 0
          ? `${publicationCount} publication(s) in database.`
          : 'Connected — upload a PDF at /admin'
        : 'Connect Vercel Postgres and Blob, then redeploy.',
  });
}

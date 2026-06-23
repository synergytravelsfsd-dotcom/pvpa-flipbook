import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasPostgres = Boolean(
    process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL
  );
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return NextResponse.json({
    app: 'PVPA Digital Flipbook',
    status: hasPostgres && hasBlob ? 'ready' : 'setup_required',
    postgres: hasPostgres,
    blob: hasBlob,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? null,
    message:
      hasPostgres && hasBlob
        ? 'All services connected.'
        : 'Connect Vercel Postgres and Blob storage, then redeploy.',
  });
}

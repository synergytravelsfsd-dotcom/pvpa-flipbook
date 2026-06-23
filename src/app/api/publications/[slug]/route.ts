import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await ensureDbReady();
    const publication = await db.publication.findUnique({
      where: { slug: params.slug },
    });
    if (!publication) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(publication);
  } catch (err) {
    console.error('GET /api/publications/[slug]:', err);
    return NextResponse.json({ error: 'Failed to fetch publication' }, { status: 500 });
  }
}

/** Update page count (called from viewer after PDF is fully loaded) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { pages } = body as { pages?: number };
    if (typeof pages !== 'number') {
      return NextResponse.json({ error: 'pages must be a number' }, { status: 400 });
    }
    const updated = await db.publication.update({
      where: { slug: params.slug },
      data: { pages },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/publications/[slug]:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

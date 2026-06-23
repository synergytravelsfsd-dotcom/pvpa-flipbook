import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';
import { deleteStoredFile } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await ensureDbReady();
    const publication = await db.publication.findUnique({
      where: { slug: params.slug },
      select: { id: true, pdfPath: true, coverPath: true },
    });

    if (!publication) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete from DB
    await db.publication.delete({ where: { slug: params.slug } });

    // Delete files (best effort)
    await deleteStoredFile(publication.pdfPath);
    if (publication.coverPath) {
      await deleteStoredFile(publication.coverPath);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/publications/[slug]/delete:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

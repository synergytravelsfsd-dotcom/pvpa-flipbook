import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
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
    await deleteFile(publication.pdfPath);
    if (publication.coverPath) {
      await deleteFile(publication.coverPath);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/publications/[slug]/delete:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

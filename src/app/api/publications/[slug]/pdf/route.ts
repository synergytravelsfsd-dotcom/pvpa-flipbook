import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAbsolutePath } from '@/lib/storage';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const publication = await db.publication.findUnique({
      where: { slug: params.slug },
      select: { pdfPath: true, title: true },
    });

    if (!publication) {
      return new NextResponse('Not found', { status: 404 });
    }

    const filePath = getAbsolutePath(publication.pdfPath);
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = await readFile(filePath);
    const filename = `${publication.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('GET /api/publications/[slug]/pdf:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}

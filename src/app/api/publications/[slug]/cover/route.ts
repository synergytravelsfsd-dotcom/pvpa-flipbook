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
      select: { coverPath: true },
    });

    if (!publication?.coverPath) {
      return new NextResponse('Not found', { status: 404 });
    }

    const filePath = getAbsolutePath(publication.coverPath);
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('GET /api/publications/[slug]/cover:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}

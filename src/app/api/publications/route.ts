import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savePdf, saveCover, ensureDirectories, estimatePdfPages } from '@/lib/storage';
import { generateCover } from '@/lib/generateCover';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const publications = await db.publication.findMany({
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        pages: true,
        fileSize: true,
        featured: true,
        createdAt: true,
      },
    });
    return NextResponse.json(publications);
  } catch (err) {
    console.error('GET /api/publications:', err);
    return NextResponse.json({ error: 'Failed to fetch publications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File | null;
    const title = (formData.get('title') as string | null)?.trim();
    const description = (formData.get('description') as string | null)?.trim() || null;
    const publishedAtStr = formData.get('publishedAt') as string | null;

    if (!pdfFile) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();

    // Unique slug
    const baseSlug = slugify(title, { lower: true, strict: true, trim: true }) || 'publication';
    let slug = baseSlug;
    const existing = await db.publication.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    // Save PDF
    const uid = crypto.randomUUID().replace(/-/g, '');
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const pdfPath = await savePdf(pdfBuffer, `${uid}.pdf`);

    // Generate branded cover image
    const coverBuffer = await generateCover({ title, description: description ?? undefined, publishedAt });
    const coverPath = await saveCover(coverBuffer, `${uid}.jpg`);

    // Estimate page count
    const pages = estimatePdfPages(pdfBuffer);

    const publication = await db.publication.create({
      data: {
        id: uid,
        slug,
        title,
        description,
        publishedAt,
        pages,
        fileSize: pdfBuffer.length,
        pdfPath,
        coverPath,
      },
    });

    return NextResponse.json(publication, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('POST /api/publications:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

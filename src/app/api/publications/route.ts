import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbReady } from '@/lib/db';
import { savePdf, saveCover, ensureDirectories, estimatePdfPages } from '@/lib/storage';
import { generateCover } from '@/lib/generateCover';
import slugify from 'slugify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    await ensureDbReady();
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

interface JsonUploadBody {
  title: string;
  description?: string | null;
  publishedAt?: string;
  pdfUrl: string;
  fileSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      return handleJsonUpload(await request.json() as JsonUploadBody);
    }

    return handleMultipartUpload(request);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('POST /api/publications:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleJsonUpload(body: JsonUploadBody) {
  const title = body.title?.trim();
  const description = body.description?.trim() || null;
  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
  const pdfUrl = body.pdfUrl?.trim();

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  if (!pdfUrl) return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });

  const slug = await uniqueSlug(title);
  const uid = crypto.randomUUID().replace(/-/g, '');

  const coverBuffer = await generateCover({ title, description: description ?? undefined, publishedAt });
  const coverPath = await saveCover(coverBuffer, `${uid}.jpg`);

  let pages = 0;
  let fileSize = body.fileSize ?? 0;
  try {
    const res = await fetch(pdfUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fileSize = buf.length;
      pages = estimatePdfPages(buf);
    }
  } catch {
    /* page count optional */
  }

  const publication = await db.publication.create({
    data: {
      id: uid,
      slug,
      title,
      description,
      publishedAt,
      pages,
      fileSize,
      pdfPath: `blob:${pdfUrl}`,
      coverPath,
    },
  });

  return NextResponse.json(publication, { status: 201 });
}

async function handleMultipartUpload(request: NextRequest) {
  await ensureDirectories();

  const formData = await request.formData();
  const pdfFile = formData.get('pdf') as File | null;
  const title = (formData.get('title') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const publishedAtStr = formData.get('publishedAt') as string | null;

  if (!pdfFile) return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  if (pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
  }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();
  const slug = await uniqueSlug(title);
  const uid = crypto.randomUUID().replace(/-/g, '');
  const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
  const pdfPath = await savePdf(pdfBuffer, `${uid}.pdf`);
  const coverBuffer = await generateCover({ title, description: description ?? undefined, publishedAt });
  const coverPath = await saveCover(coverBuffer, `${uid}.jpg`);
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
}

async function uniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true }) || 'publication';
  const existing = await db.publication.findUnique({ where: { slug: baseSlug } });
  return existing ? `${baseSlug}-${Date.now()}` : baseSlug;
}

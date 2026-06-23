import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, ensureDbReady } from '@/lib/db';
import { APP_NAME, getMetadataBaseUrl } from '@/lib/config';
import { getPublicationPath } from '@/lib/utils';
import FlipbookViewer from '@/components/FlipbookViewer';

interface Props {
  params: { slug: string };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getPublication(slug: string) {
  await ensureDbReady();
  try {
    return await db.publication.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        pages: true,
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pub = await getPublication(params.slug);
  if (!pub) return { title: 'Not Found' };

  const base = getMetadataBaseUrl();
  const publicationPath = getPublicationPath(pub.slug);
  const coverUrl = `${base}/api/publications/${pub.slug}/cover`;
  const publishedTime = new Date(pub.publishedAt).toISOString();

  return {
    title: pub.title,
    description: pub.description ?? `Read ${pub.title} — ${APP_NAME}`,
    openGraph: {
      title: pub.title,
      description: pub.description ?? `Read ${pub.title} on ${APP_NAME}`,
      url: `${base}${publicationPath}`,
      siteName: APP_NAME,
      images: [
        {
          url: coverUrl,
          width: 595,
          height: 842,
          alt: pub.title,
        },
      ],
      type: 'article',
      publishedTime,
      authors: ['PVPA'],
    },
    twitter: {
      card: 'summary_large_image',
      title: pub.title,
      description: pub.description ?? `Read ${pub.title}`,
      images: [coverUrl],
      site: '@pvpa',
    },
  };
}

export default async function ReaderPage({ params }: Props) {
  const pub = await getPublication(params.slug);
  if (!pub) notFound();

  const pdfUrl = `/api/publications/${pub.slug}/pdf`;

  return (
    <FlipbookViewer
      pdfUrl={pdfUrl}
      title={pub.title}
      slug={pub.slug}
      description={pub.description ?? undefined}
      publishedAt={new Date(pub.publishedAt).toISOString()}
    />
  );
}

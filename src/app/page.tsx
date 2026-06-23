import Link from "next/link";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import PublicationCard from "@/components/PublicationCard";

export const dynamic = "force-dynamic";

async function getRecentPublications() {
  try {
    return await db.publication.findMany({
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        pages: true,
        fileSize: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const publications = await getRecentPublications();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-pvpa-navy via-pvpa-blue to-pvpa-teal text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-300">
              Pakistan Veterinary Pharmaceutical Association
            </p>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Digital Flipbook Publishing
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-blue-100">
              Transform PDF magazines, newsletters, annual reports, and industry
              publications into interactive online flipbooks. Share instantly on
              social media and reach your audience anywhere.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/admin"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-pvpa-navy shadow-lg transition hover:bg-gray-50"
              >
                Upload Publication
              </Link>
              {publications.length > 0 && (
                <Link
                  href={`/flipbook/${publications[0].slug}`}
                  className="rounded-lg border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Read Latest
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h3 className="text-center text-3xl font-bold text-gray-900">
          Professional Digital Publishing
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
          Everything you need to publish and distribute veterinary industry publications online.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "📖", title: "Interactive Flipbooks", desc: "Realistic page-turning with zoom, fullscreen, and mobile support." },
            { icon: "🔍", title: "Searchable Text", desc: "Full-text search across all pages for quick content discovery." },
            { icon: "📱", title: "Social Sharing", desc: "One-click sharing to Facebook, LinkedIn, WhatsApp, X, Telegram, Instagram, and Email." },
            { icon: "🖼️", title: "Rich Previews", desc: "Open Graph cards with cover image, title, and description." },
            { icon: "📑", title: "Table of Contents", desc: "Automatic TOC from PDF bookmarks with thumbnail navigation." },
            { icon: "🔖", title: "Bookmarks & Print", desc: "Save favorite pages, download PDF, or print from the viewer." },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="text-3xl">{feature.icon}</span>
              <h4 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h4>
              <p className="mt-2 text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {publications.length > 0 && (
        <section className="bg-white py-20 border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-gray-900">Recent Publications</h3>
            <p className="mt-2 text-gray-600">Browse our latest digital publications</p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publications.map((pub) => (
                <PublicationCard
                  key={pub.id}
                  publication={{
                    ...pub,
                    publishedAt: pub.publishedAt.toISOString(),
                    createdAt: pub.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-gray-200 bg-pvpa-navy py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} PVPA Digital Flipbook Publishing System
      </footer>
    </div>
  );
}

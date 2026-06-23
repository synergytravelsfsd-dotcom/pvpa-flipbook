'use client';

import Link from 'next/link';
import { Calendar, FileText, Eye, Trash2, Share2, ExternalLink } from 'lucide-react';
import { formatDateShort, buildShareUrl } from '@/lib/utils';
import { useState } from 'react';
import type { PublicationListItem } from '@/types';

interface PublicationCardProps {
  publication: PublicationListItem;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function PublicationCard({ publication, onDelete, isAdmin }: PublicationCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  const shareUrl = buildShareUrl(publication.slug);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Cover */}
      <Link href={`/flipbook/${publication.slug}`} className="block relative bg-pvpa-navy overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {!imgError ? (
          <img
            src={`/api/publications/${publication.slug}/cover`}
            alt={publication.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pvpa-navy to-pvpa-blue">
            <FileText size={32} className="text-teal-400 mb-2" />
            <span className="text-xs text-white/60 text-center line-clamp-3">{publication.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <span className="inline-flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">
            <Eye size={13} /> View Flipbook
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 leading-snug">
          {publication.title}
        </h3>
        {publication.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{publication.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDateShort(publication.publishedAt)}
          </span>
          {publication.pages > 0 && (
            <span className="flex items-center gap-1">
              <FileText size={11} />
              {publication.pages}p
            </span>
          )}
        </div>

        <div className="flex gap-1.5 mt-3">
          <Link
            href={`/flipbook/${publication.slug}`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-white bg-pvpa-navy rounded-lg hover:bg-pvpa-blue transition-colors"
          >
            <ExternalLink size={12} />
            Read
          </Link>
          {isAdmin && (
            <>
              <button
                onClick={copyLink}
                className={`p-1.5 rounded-lg transition-colors ${copiedLink ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'}`}
                title={copiedLink ? 'Copied!' : 'Copy share link'}
              >
                <Share2 size={14} />
              </button>
              <button
                onClick={() => onDelete?.(publication.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete publication"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

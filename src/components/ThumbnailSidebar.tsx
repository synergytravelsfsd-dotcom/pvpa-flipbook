'use client';

import { useEffect, useRef, useState } from 'react';
import { Bookmark, ListTree, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocEntry } from '@/types';

interface ThumbnailSidebarProps {
  pages: string[];
  toc?: TocEntry[];
  currentPage: number;
  bookmarks: Set<number>;
  searchResults: number[];
  onPageSelect: (page: number) => void;
}

export default function ThumbnailSidebar({
  pages,
  toc = [],
  currentPage,
  bookmarks,
  searchResults,
  onPageSelect,
}: ThumbnailSidebarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<'pages' | 'toc'>(toc.length > 0 ? 'toc' : 'pages');

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentPage, tab]);

  const showTocTab = toc.length > 0;

  return (
    <aside className="w-36 bg-gray-900 border-r border-gray-700/50 flex flex-col shrink-0 overflow-hidden">
      {showTocTab ? (
        <div className="flex border-b border-gray-700/50 shrink-0">
          <button
            type="button"
            onClick={() => setTab('toc')}
            className={cn(
              'flex-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              tab === 'toc' ? 'text-teal-300 bg-white/5' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <ListTree size={10} className="inline mr-1 -mt-px" />
            TOC
          </button>
          <button
            type="button"
            onClick={() => setTab('pages')}
            className={cn(
              'flex-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              tab === 'pages' ? 'text-teal-300 bg-white/5' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            Pages
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-700/50 shrink-0">
          Pages
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 flex flex-col gap-1.5">
        {tab === 'toc' && showTocTab ? (
          toc.map((entry, i) => {
            const isActive = entry.pageIndex === currentPage;
            return (
              <button
                key={`${entry.title}-${i}`}
                type="button"
                onClick={() => onPageSelect(entry.pageIndex)}
                className={cn(
                  'w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors border',
                  isActive
                    ? 'border-teal-400 bg-teal-500/10 text-teal-200'
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
                )}
                style={{ paddingLeft: `${8 + entry.level * 10}px` }}
                title={`Go to page ${entry.pageIndex + 1}`}
              >
                <span className="line-clamp-2 leading-snug">{entry.title}</span>
                <span className="text-[10px] text-gray-600 block mt-0.5">p.{entry.pageIndex + 1}</span>
              </button>
            );
          })
        ) : (
          pages.map((src, i) => {
            const isActive = i === currentPage;
            const isBookmarked = bookmarks.has(i);
            const isSearchResult = searchResults.includes(i);

            return (
              <button
                key={i}
                ref={isActive ? activeRef : undefined}
                type="button"
                onClick={() => onPageSelect(i)}
                className={cn(
                  'relative w-full rounded-md overflow-hidden border-2 transition-all group text-left',
                  isActive
                    ? 'border-teal-400 shadow-md shadow-teal-500/20 scale-[1.02]'
                    : 'border-gray-700 hover:border-gray-500'
                )}
                title={`Go to page ${i + 1}`}
              >
                <div className="aspect-[3/4] bg-gray-800 overflow-hidden">
                  {src ? (
                    <img
                      src={src}
                      alt={`Page ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs">{i + 1}</span>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 text-center text-[10px] py-0.5 font-medium',
                    isActive ? 'bg-teal-500 text-white' : 'bg-black/60 text-gray-300'
                  )}
                >
                  {i + 1}
                </div>

                {isBookmarked && (
                  <div className="absolute top-1 right-1">
                    <Bookmark size={10} className="text-amber-400 fill-amber-400 drop-shadow" />
                  </div>
                )}

                {isSearchResult && (
                  <div className="absolute top-1 left-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shadow" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-700/50 space-y-1 shrink-0">
        {bookmarks.size > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Bookmark size={9} className="text-amber-400 fill-amber-400" />
            {bookmarks.size} bookmark{bookmarks.size !== 1 ? 's' : ''}
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <SearchIcon size={9} className="text-yellow-400" />
            {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''}
          </div>
        )}
      </div>
    </aside>
  );
}

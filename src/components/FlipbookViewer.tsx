'use client';

import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import ThumbnailSidebar from './ThumbnailSidebar';
import ShareBar from './ShareBar';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Printer,
  Bookmark, BookmarkCheck, Search, X, Share2, LayoutList, BookOpen,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocEntry } from '@/types';

// ── PDF.js worker (local file from postinstall, CDN fallback) ────────────────
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  fetch('/pdf.worker.min.mjs', { method: 'HEAD' })
    .then(res => {
      if (!res.ok) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
    })
    .catch(() => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    });
}

async function extractToc(doc: pdfjsLib.PDFDocumentProxy): Promise<TocEntry[]> {
  const outline = await doc.getOutline();
  if (!outline?.length) return [];

  async function walk(items: NonNullable<Awaited<ReturnType<typeof doc.getOutline>>>, level = 0): Promise<TocEntry[]> {
    const entries: TocEntry[] = [];
    for (const item of items) {
      let pageIndex = 0;
      try {
        if (item.dest) {
          const dest = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest;
          if (dest?.[0]) pageIndex = await doc.getPageIndex(dest[0]);
        }
      } catch {
        pageIndex = 0;
      }
      entries.push({ title: item.title, pageIndex, level });
      if (item.items?.length) entries.push(...(await walk(item.items, level + 1)));
    }
    return entries;
  }

  return walk(outline);
}

// ── Page component (must support forwardRef for react-pageflip) ───────────────
interface FlipPageProps {
  src: string;
  pageNum: number;
  bookmarked: boolean;
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(({ src, pageNum, bookmarked }, ref) => (
  <div
    ref={ref}
    className="relative w-full h-full bg-white overflow-hidden select-none"
    style={{ boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.15)' }}
  >
    {src ? (
      <img
        src={src}
        alt={`Page ${pageNum}`}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <span className="text-gray-300 text-2xl">{pageNum}</span>
      </div>
    )}
    {bookmarked && (
      <div
        className="absolute top-0 right-5 w-5 h-7 bg-amber-400"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)' }}
      />
    )}
    <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none">
      <span className="text-[10px] text-gray-400/80">{pageNum}</span>
    </div>
  </div>
));
FlipPage.displayName = 'FlipPage';

// ── Props ─────────────────────────────────────────────────────────────────────
export interface FlipbookViewerProps {
  pdfUrl: string;
  title: string;
  slug: string;
  description?: string;
  publishedAt?: string;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FlipbookViewer({ pdfUrl, title, slug, description, publishedAt }: FlipbookViewerProps) {
  // Dynamic library
  const [FlipBook, setFlipBook] = useState<React.ComponentType<any> | null>(null);

  // Pages
  const [pages, setPages] = useState<string[]>([]);
  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Viewer state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Panels
  const [showSidebar, setShowSidebar] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  const flipRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load react-pageflip dynamically ──────────────────────────────────────
  useEffect(() => {
    import('react-pageflip')
      .then(mod => setFlipBook(() => mod.default ?? mod))
      .catch(() => setLoadError('Failed to load flipbook library'));
  }, []);

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (m) setShowSidebar(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Bookmarks from localStorage ───────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pvpa-bm-${slug}`);
      if (raw) setBookmarks(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, [slug]);

  // ── Load & render PDF ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setProgress(0);
      setLoadError(null);

      try {
        const doc = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        if (cancelled) return;

        const count = doc.numPages;
        setTotalPages(count);
        setToc(await extractToc(doc));

        const imgs: string[] = [];
        const texts: string[] = [];

        for (let i = 1; i <= count; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport: vp }).promise;
            imgs.push(canvas.toDataURL('image/jpeg', 0.85));
          }
          const tc = await page.getTextContent();
          texts.push(tc.items.map((it: unknown) => (it as { str?: string }).str ?? '').join(' '));
          setProgress(Math.round((i / count) * 100));
        }

        if (!cancelled) {
          setPages(imgs);
          setPageTexts(texts);
          setIsLoading(false);
          // Report actual page count to server
          fetch(`/api/publications/${slug}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: count }),
          }).catch(() => {});
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError((err instanceof Error ? err.message : null) ?? 'Failed to load PDF');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [pdfUrl, slug]);

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      pageTexts.map((t, i) => t.toLowerCase().includes(q) ? i : -1).filter(i => i !== -1)
    );
  }, [searchQuery, pageTexts]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') flipRef.current?.flipNext();
      else if (e.key === 'ArrowLeft') flipRef.current?.flipPrev();
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 80);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const goToPage = useCallback((idx: number) => {
    if (flipRef.current) {
      flipRef.current.flip(idx);
      setCurrentPage(idx);
    }
  }, []);

  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(currentPage)) next.delete(currentPage);
      else next.add(currentPage);
      localStorage.setItem(`pvpa-bm-${slug}`, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [currentPage, slug]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // browser may deny
    }
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfUrl, title]);

  const handlePrint = useCallback(() => {
    const w = window.open(pdfUrl, '_blank');
    if (w) w.onload = () => w.print();
  }, [pdfUrl]);

  // ── Render: error ─────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-red-400">{loadError}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-pvpa-teal rounded-xl text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  // ── Render: loading ───────────────────────────────────────────────────────
  if (isLoading || !FlipBook) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-5">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-pvpa-teal animate-pulse" />
          <span className="text-lg font-light">
            {isLoading ? 'Rendering pages…' : 'Initialising viewer…'}
          </span>
        </div>
        {isLoading && (
          <div className="w-72">
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pvpa-teal to-blue-400 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">{progress}%</p>
          </div>
        )}
      </div>
    );
  }

  // ── Render: viewer ────────────────────────────────────────────────────────
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isBookmarked = bookmarks.has(currentPage);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col text-white overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'h-screen bg-gray-900'
      )}
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-pvpa-navy border-b border-blue-900/50 shrink-0">
        {/* Sidebar toggle */}
        <button
          onClick={() => setShowSidebar(v => !v)}
          className={cn('p-1.5 rounded-lg transition-colors', showSidebar ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/10')}
          title="Toggle pages panel"
        >
          <LayoutList size={18} />
        </button>

        <BookOpen size={16} className="text-pvpa-teal shrink-0" />
        <h1 className="text-sm font-medium truncate flex-1 text-gray-100">{title}</h1>

        {/* Search */}
        <div className={cn('flex items-center gap-1 transition-all', searchOpen ? 'w-52' : '')}>
          {searchOpen ? (
            <div className="flex items-center gap-1 w-full">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pages…"
                className="flex-1 px-2.5 py-1 text-xs bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pvpa-teal"
              />
              {searchResults.length > 0 && (
                <span className="text-xs text-pvpa-teal font-medium shrink-0">
                  {searchResults.length}p
                </span>
              )}
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 80); }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
              title="Search (Ctrl+F)"
            >
              <Search size={18} />
            </button>
          )}
        </div>

        <button onClick={handleDownload} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors hidden sm:block" title="Download PDF">
          <Download size={18} />
        </button>
        <button onClick={handlePrint} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors hidden sm:block" title="Print">
          <Printer size={18} />
        </button>
        <button
          onClick={() => setShowShare(v => !v)}
          className={cn('p-1.5 rounded-lg transition-colors', showShare ? 'bg-pvpa-teal text-white' : 'text-gray-400 hover:bg-white/10')}
          title="Share"
        >
          <Share2 size={18} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* ── Share bar ────────────────────────────────────────────────────── */}
      {showShare && (
        <ShareBar
          url={shareUrl}
          title={title}
          description={description}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail sidebar */}
        {showSidebar && pages.length > 0 && (
          <ThumbnailSidebar
            pages={pages}
            toc={toc}
            currentPage={currentPage}
            bookmarks={bookmarks}
            searchResults={searchResults}
            onPageSelect={goToPage}
          />
        )}

        {/* Book + nav arrows */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-800 relative">
          {/* Nav arrow: prev */}
          <button
            onClick={() => flipRef.current?.flipPrev()}
            disabled={currentPage === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-20 transition-all"
            title="Previous page (←)"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Book */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
            }}
          >
            <FlipBook
              width={550}
              height={733}
              size="stretch"
              minWidth={280}
              maxWidth={900}
              minHeight={373}
              maxHeight={1200}
              drawShadow
              flippingTime={700}
              usePortrait={isMobile}
              startZIndex={0}
              autoSize
              clickEventForward={false}
              useMouseEvents
              swipeDistance={30}
              showPageCorners
              disableFlipByClick={false}
              ref={flipRef}
              onFlip={(e: { data: number }) => setCurrentPage(e.data)}
              className="shadow-2xl"
            >
              {pages.map((src, i) => (
                <FlipPage
                  key={i}
                  src={src}
                  pageNum={i + 1}
                  bookmarked={bookmarks.has(i)}
                />
              ))}
            </FlipBook>
          </div>

          {/* Nav arrow: next */}
          <button
            onClick={() => flipRef.current?.flipNext()}
            disabled={currentPage >= totalPages - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-20 transition-all"
            title="Next page (→)"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* ── Bottom toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-t border-gray-700/50 shrink-0 gap-2">
        {/* Page navigation */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => goToPage(0)} className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30" disabled={currentPage === 0} title="First">
            <ChevronsLeft size={15} />
          </button>
          <button onClick={() => flipRef.current?.flipPrev()} className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30" disabled={currentPage === 0} title="Prev">
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-gray-400 px-2 tabular-nums">
            {currentPage + 1} / {totalPages}
          </span>
          <button onClick={() => flipRef.current?.flipNext()} className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30" disabled={currentPage >= totalPages - 1} title="Next">
            <ChevronRight size={15} />
          </button>
          <button onClick={() => goToPage(totalPages - 1)} className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30" disabled={currentPage >= totalPages - 1} title="Last">
            <ChevronsRight size={15} />
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={toggleBookmark}
          className={cn('p-1.5 rounded transition-colors', isBookmarked ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400 hover:bg-white/10')}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        >
          {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} disabled={zoom <= 0.5} className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30" title="Zoom out">
            <ZoomOut size={15} />
          </button>
          <span className="text-xs text-gray-400 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, +(z + 0.25).toFixed(2)))} disabled={zoom >= 2} className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30" title="Zoom in">
            <ZoomIn size={15} />
          </button>
          {zoom !== 1 && (
            <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-white" title="Reset zoom">
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

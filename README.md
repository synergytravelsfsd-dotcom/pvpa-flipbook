# PVPA Digital Flipbook Publishing System

A standalone, self-hosted platform that converts PDF publications into interactive online flipbooks — shareable on Facebook, LinkedIn, WhatsApp, X (Twitter), Telegram, Instagram, Email, and the PVPA website.

**Repository:** https://github.com/synergytravelsfsd-dotcom/pvpa-flipbook

---

## Quick Start

```bash
# 1. Install dependencies (also generates Prisma client & copies PDF.js worker)
npm install

# 2. Initialise the database
npm run db:push

# 3. Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/pvpa.db` | SQLite database path |
| `NEXT_PUBLIC_BASE_URL` | `https://pvpa-digital-flipbook.vercel.app` | Public URL for OG/share links |

For production, update `NEXT_PUBLIC_BASE_URL` to your actual domain, e.g.
`https://library.pvpa.org`.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Production build (generates Prisma + pushes schema + Next.js build) |
| `npm run start` | Start production server |
| `npm run db:push` | Apply Prisma schema to the SQLite database |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Public landing page — browse all publications |
| `/admin` | Upload and manage publications |
| `/flipbook/[slug]` | Public flipbook viewer (canonical URL) |
| `/read/[slug]` | Redirects to `/flipbook/[slug]` |
| `/api/publications` | `GET` list / `POST` upload |
| `/api/publications/[slug]` | `GET` metadata / `PATCH` update page count |
| `/api/publications/[slug]/pdf` | Serve the original PDF |
| `/api/publications/[slug]/cover` | Serve the cover image (used in OG tags) |
| `/api/publications/[slug]/delete` | `DELETE` publication |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS (PVPA navy/teal brand palette) |
| Database | SQLite via Prisma ORM |
| PDF rendering | PDF.js (pdfjs-dist v4, client-side) |
| Page flip | react-pageflip (3D CSS animation) |
| Cover generation | Sharp (SVG → JPEG, server-side) |
| Icons | Lucide React |
| Storage | Local filesystem (`data/uploads/`) |

---

## Feature Checklist

### Admin Panel (`/admin`)
- [x] Drag-and-drop or click-to-browse PDF upload
- [x] Metadata form: title, description, publication date
- [x] Automatic branded cover image generation (Sharp)
- [x] Publication list with cover thumbnail, date, page count
- [x] Copy share link per publication
- [x] Delete publication (removes DB record + files)

### Public Flipbook Viewer (`/flipbook/[slug]`)
- [x] Realistic 3D page-turn flipbook (react-pageflip)
- [x] Mobile responsive (single-page mode on mobile)
- [x] Fullscreen toggle (keyboard shortcut: **F**)
- [x] Zoom in/out (50% – 200%, 25% steps)
- [x] Text search across all pages (keyboard shortcut: **Ctrl/⌘+F**)
- [x] Thumbnail navigation and PDF bookmark table of contents
- [x] Page bookmarking (persisted in `localStorage`)
- [x] Keyboard navigation (← / → arrow keys)
- [x] Download original PDF
- [x] Print PDF
- [x] Loading progress bar during PDF rendering

### Social Sharing
- [x] OG / Twitter Card meta tags (cover, title, date, description)
- [x] Share bar: Facebook, LinkedIn, X (Twitter), WhatsApp, Telegram, Instagram (copy link)
- [x] Share via Email (mailto)
- [x] Copy link with clipboard feedback

### API
- [x] `POST /api/publications` — multipart upload
- [x] `GET /api/publications` — list all
- [x] `GET /api/publications/[slug]` — single publication metadata
- [x] `PATCH /api/publications/[slug]` — update page count
- [x] `GET /api/publications/[slug]/pdf` — serve PDF
- [x] `GET /api/publications/[slug]/cover` — serve cover image
- [x] `DELETE /api/publications/[slug]/delete` — remove publication

---

## Data Storage

All files are stored locally in the project:

```
data/
├── pvpa.db              ← SQLite database
└── uploads/
    ├── pdfs/            ← Uploaded PDF files
    └── covers/          ← Generated cover JPEG images
```

This folder is excluded from git (see `.gitignore`). Back it up separately in production.

---

## Production Deployment

1. Update `.env` with your production `NEXT_PUBLIC_BASE_URL`
2. Run `npm run build`
3. Run `npm run start` (or use a process manager like PM2)
4. Ensure the `data/` directory is writable by the Node.js process
5. Configure a reverse proxy (nginx/Caddy) to forward to port 3000

---

## Known Limitations

- **Cover generation**: Covers are SVG-based branded placeholders, not a render of the PDF's first page. This avoids heavy native dependencies.
- **Large PDFs**: All pages are rendered client-side at startup. PDFs with 100+ pages may take 15–30 s to load in the viewer.
- **No authentication**: The `/admin` route is open. Add middleware-based auth before deploying publicly.
- **Single-node only**: Uses local filesystem; not suitable for multi-instance deployments without shared storage.

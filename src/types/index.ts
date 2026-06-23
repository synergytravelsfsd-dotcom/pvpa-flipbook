export interface Publication {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  publishedAt: string;
  pages: number;
  fileSize: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  pdfPath?: string;
  coverPath?: string | null;
}

export interface PublicationListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  publishedAt: string;
  pages: number;
  fileSize: number;
  createdAt: string;
}

export interface UploadFormData {
  title: string;
  description: string;
  publishedAt: string;
}

export interface SharePlatform {
  name: string;
  color: string;
  getUrl: (url: string, title: string, description?: string) => string;
}

export interface TocEntry {
  title: string;
  pageIndex: number;
  level: number;
}

import { mkdir, writeFile, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const BLOB_PREFIX = 'blob:';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const PDFS_DIR = path.join(UPLOADS_DIR, 'pdfs');
export const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');

export function usesBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobPath(storedPath: string): boolean {
  return storedPath.startsWith(BLOB_PREFIX);
}

export function getBlobUrl(storedPath: string): string | null {
  return isBlobPath(storedPath) ? storedPath.slice(BLOB_PREFIX.length) : null;
}

export async function ensureDirectories(): Promise<void> {
  if (usesBlobStorage()) return;
  for (const dir of [DATA_DIR, UPLOADS_DIR, PDFS_DIR, COVERS_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

export async function savePdf(buffer: Buffer, filename: string): Promise<string> {
  if (usesBlobStorage()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`pdfs/${filename}`, buffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });
    return `${BLOB_PREFIX}${blob.url}`;
  }
  await ensureDirectories();
  const filePath = path.join(PDFS_DIR, filename);
  await writeFile(filePath, buffer);
  return path.relative(process.cwd(), filePath);
}

export async function saveCover(buffer: Buffer, filename: string): Promise<string> {
  if (usesBlobStorage()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`covers/${filename}`, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
    });
    return `${BLOB_PREFIX}${blob.url}`;
  }
  await ensureDirectories();
  const filePath = path.join(COVERS_DIR, filename);
  await writeFile(filePath, buffer);
  return path.relative(process.cwd(), filePath);
}

export async function readStoredFile(storedPath: string): Promise<Buffer> {
  const blobUrl = getBlobUrl(storedPath);
  if (blobUrl) {
    const res = await fetch(blobUrl);
    if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const filePath = getAbsolutePath(storedPath);
  return readFile(filePath);
}

export async function deleteStoredFile(storedPath: string): Promise<void> {
  try {
    const blobUrl = getBlobUrl(storedPath);
    if (blobUrl) {
      const { del } = await import('@vercel/blob');
      await del(blobUrl);
      return;
    }
    const filePath = getAbsolutePath(storedPath);
    await unlink(filePath);
  } catch {
    // best effort
  }
}

/** @deprecated use deleteStoredFile */
export async function deleteFile(relativePath: string): Promise<void> {
  return deleteStoredFile(relativePath);
}

export function getAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

export function estimatePdfPages(buffer: Buffer): number {
  const sample = buffer.slice(0, Math.min(buffer.length, 100_000)).toString('latin1');
  const counts = Array.from(sample.matchAll(/\/Count\s+(\d+)/g)).map((m) =>
    parseInt(m[1], 10)
  );
  return counts.length > 0 ? Math.max(...counts) : 0;
}

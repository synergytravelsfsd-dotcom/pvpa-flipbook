import { mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const PDFS_DIR = path.join(UPLOADS_DIR, 'pdfs');
export const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');

export async function ensureDirectories(): Promise<void> {
  for (const dir of [DATA_DIR, UPLOADS_DIR, PDFS_DIR, COVERS_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

export async function savePdf(buffer: Buffer, filename: string): Promise<string> {
  await ensureDirectories();
  const filePath = path.join(PDFS_DIR, filename);
  await writeFile(filePath, buffer);
  return path.relative(process.cwd(), filePath);
}

export async function saveCover(buffer: Buffer, filename: string): Promise<string> {
  await ensureDirectories();
  const filePath = path.join(COVERS_DIR, filename);
  await writeFile(filePath, buffer);
  return path.relative(process.cwd(), filePath);
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), relativePath);
    await unlink(filePath);
  } catch {
    // Silently ignore missing files
  }
}

export function getAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

/** Rough page count estimation from PDF binary without parsing */
export function estimatePdfPages(buffer: Buffer): number {
  const sample = buffer.slice(0, Math.min(buffer.length, 100_000)).toString('latin1');
  const counts = Array.from(sample.matchAll(/\/Count\s+(\d+)/g)).map((m) =>
    parseInt(m[1], 10)
  );
  return counts.length > 0 ? Math.max(...counts) : 0;
}

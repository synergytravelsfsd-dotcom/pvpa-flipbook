/** App branding and production defaults */
export const APP_NAME = 'PVPA Digital Flipbook';
export const APP_TAGLINE = 'Interactive digital publishing for PVPA publications';
export const PRODUCTION_URL = 'https://pvpa-flipbook.vercel.app';

export function getMetadataBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000')
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME, APP_TAGLINE, getMetadataBaseUrl } from '@/lib/config';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  metadataBase: new URL(getMetadataBaseUrl()),
  applicationName: APP_NAME,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

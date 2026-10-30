import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaInit from '@/components/PwaInit';

export const metadata: Metadata = {
  title: 'VidGrab – Video Downloader',
  description: 'Download videos from YouTube, Instagram, X/Twitter, TikTok, Facebook, HLS and direct URLs.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VidGrab',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans bg-neutral-100 dark:bg-neutral-950 min-h-screen antialiased">
        <PwaInit />
        {children}
      </body>
    </html>
  );
}

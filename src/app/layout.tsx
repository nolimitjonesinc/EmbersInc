import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, EB_Garamond } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// EB Garamond for emotional/story content - serif warmth
const ebGaramond = EB_Garamond({
  variable: '--font-eb-garamond',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Embers - Share Your Family Stories',
  description:
    'Preserve your memories for generations. Embers helps you share your life stories through natural, AI-guided conversations.',
  keywords: [
    'family stories',
    'memory preservation',
    'life stories',
    'legacy',
    'storytelling',
    'family history',
    'memoir',
  ],
  authors: [{ name: 'Embers Inc.' }],
  openGraph: {
    title: 'Embers - Share Your Family Stories',
    description:
      'Preserve your memories for generations. Share your life stories through natural conversations.',
    url: 'https://embersinc.org',
    siteName: 'Embers',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Embers - Share Your Family Stories',
    description: 'Preserve your memories for generations.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#E86D48',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} antialiased min-h-screen`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

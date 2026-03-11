import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CookieBanner } from '@/components/legal/cookie-banner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';
const SITE_NAME = 'Placeat';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Gestione Tavoli e Recensioni per Ristoranti`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'SaaS B2B per ristoranti: gestione piantine interattive, prenotazioni e raccolta automatica recensioni Google. Piattaforma zero-touch per la ristorazione moderna.',
  keywords: [
    'ristoranti',
    'prenotazioni',
    'gestione tavoli',
    'SaaS',
    'ristorazione',
    'piantina interattiva',
    'recensioni Google',
    'gestionale ristorante',
    'software ristorazione',
    'prenotazione tavoli',
    'table management',
    'restaurant management',
    'booking system',
  ],
  authors: [{ name: 'Placeat Team', url: SITE_URL }],
  creator: 'Placeat Team',
  publisher: 'Placeat',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    alternateLocale: ['en_US'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Gestione Tavoli e Recensioni per Ristoranti`,
    description:
      'SaaS B2B per ristoranti: gestione piantine interattive, prenotazioni e raccolta automatica recensioni Google.',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Placeat - Gestione Tavoli e Recensioni per Ristoranti',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@placeat',
    creator: '@placeat',
    title: `${SITE_NAME} - Gestione Tavoli e Recensioni per Ristoranti`,
    description:
      'SaaS B2B per ristoranti: gestione piantine interattive, prenotazioni e raccolta automatica recensioni Google.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'it-IT': SITE_URL,
    },
  },
  verification: {
    google: 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE',
    // yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
    // bing: 'YOUR_BING_VERIFICATION_CODE',
  },
  category: 'business',
  classification: 'Software SaaS per Ristoranti',
  referrer: 'origin-when-cross-origin',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#0f172a',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
    startupImage: [
      {
        url: '/apple-touch-startup-image-2048x2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px)',
      },
    ],
  },
  applicationName: SITE_NAME,
  other: {
    'msapplication-TileColor': '#0f172a',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          inter.variable
        )}
      >
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
        <CookieBanner />
      </body>
    </html>
  );
}

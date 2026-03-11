import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/marketing/pricing',
          '/privacy',
          '/terms',
          '/login',
          '/signup',
          '/ristorante/',
        ],
        disallow: [
          '/admin/*',
          '/dashboard/*',
          '/api/*',
          '/onboarding',
          '/_next/*',
          '/*.json$',
          '/*.xml$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/marketing/pricing',
          '/privacy',
          '/terms',
          '/login',
          '/signup',
          '/ristorante/',
        ],
        disallow: [
          '/admin/*',
          '/dashboard/*',
          '/api/*',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

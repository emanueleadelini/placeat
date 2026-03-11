import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

// Static pages configuration
const staticPages = [
  {
    url: `${SITE_URL}/`,
    priority: 1.0,
    changeFrequency: 'weekly' as const,
    lastModified: new Date(),
  },
  {
    url: `${SITE_URL}/marketing/pricing`,
    priority: 0.9,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(),
  },
  {
    url: `${SITE_URL}/signup`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(),
  },
  {
    url: `${SITE_URL}/login`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(),
  },
  {
    url: `${SITE_URL}/privacy`,
    priority: 0.5,
    changeFrequency: 'yearly' as const,
    lastModified: new Date(),
  },
  {
    url: `${SITE_URL}/terms`,
    priority: 0.5,
    changeFrequency: 'yearly' as const,
    lastModified: new Date(),
  },
];

// Example featured restaurants for sitemap
// In production, you would fetch these from Firestore
const featuredRestaurants = [
  {
    id: 'ristorante-da-mario',
    nome: 'Ristorante Da Mario',
  },
  {
    id: 'pizzeria-napoli',
    nome: 'Pizzeria Napoli',
  },
  {
    id: 'trattoria-roma',
    nome: 'Trattoria Roma',
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = staticPages.map((page) => ({
    url: page.url,
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Dynamic restaurant pages
  const restaurantRoutes = featuredRestaurants.map((ristorante) => ({
    url: `${SITE_URL}/ristorante/${ristorante.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...restaurantRoutes];
}

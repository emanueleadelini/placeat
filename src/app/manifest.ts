import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Placeat - Gestione Tavoli e Prenotazioni per Ristoranti',
    short_name: 'Placeat',
    description:
      'Piattaforma zero-touch per ristoranti: gestione piantine interattive, prenotazioni e raccolta automatica recensioni Google.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait',
    scope: '/',
    lang: 'it',
    dir: 'ltr',
    categories: ['business', 'productivity', 'food'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Accedi alla dashboard del tuo ristorante',
        url: '/dashboard',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Prenotazioni',
        short_name: 'Prenotazioni',
        description: 'Gestisci le prenotazioni',
        url: '/dashboard/reservations',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}

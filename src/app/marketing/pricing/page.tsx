import { Metadata } from 'next';
import Link from 'next/link';
import { PricingTable } from '@/components/stripe/pricing-table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

export const metadata: Metadata = {
  title: 'Prezzi - Piani Free e Pro per Ristoranti',
  description:
    'Scegli il piano più adatto al tuo ristorante. Inizia gratis con 50 prenotazioni al mese o passa a Pro per prenotazioni illimitate. Nessun costo nascosto, cancella quando vuoi.',
  keywords: [
    'prezzi ristoranti',
    'piano gratuito',
    'piano pro',
    'abbonamento ristorante',
    'gestionale prezzi',
    'software ristorazione costi',
  ],
  openGraph: {
    title: 'Prezzi - Piani Free e Pro per Ristoranti | Placeat',
    description:
      'Scegli il piano più adatto al tuo ristorante. Inizia gratis o passa a Pro. Nessun costo nascosto.',
    url: `${SITE_URL}/marketing/pricing`,
    images: [
      {
        url: `${SITE_URL}/og-pricing.jpg`,
        width: 1200,
        height: 630,
        alt: 'Placeat Prezzi - Piani per Ristoranti',
      },
    ],
  },
  twitter: {
    title: 'Prezzi - Piani Free e Pro per Ristoranti | Placeat',
    description:
      'Scegli il piano più adatto al tuo ristorante. Inizia gratis o passa a Pro.',
    images: [`${SITE_URL}/og-pricing.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/marketing/pricing`,
  },
};

// SoftwareApplication JSON-LD Schema for Pricing Page
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Placeat',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser, iOS, Android',
  offers: [
    {
      '@type': 'Offer',
      name: 'Piano Free',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Fino a 50 prenotazioni/mese, editor piantina, ReviewFlow automatico',
      url: `${SITE_URL}/signup`,
    },
    {
      '@type': 'Offer',
      name: 'Piano Pro',
      price: '49',
      priceCurrency: 'EUR',
      priceValidUntil: '2025-12-31',
      description: 'Prenotazioni illimitate, supporto prioritario, tutte le funzionalità avanzate',
      url: `${SITE_URL}/signup`,
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
  review: {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: 'Mario Rossi',
    },
    reviewBody:
      'Il miglior software di gestione per il mio ristorante. Facile da usare e ottimo rapporto qualità-prezzo.',
  },
  featureList: [
    'Editor piantina interattivo',
    'Gestione prenotazioni illimitate (Pro)',
    'Raccolta recensioni automatica',
    'ReviewFlow intelligente',
    'Supporto prioritario (Pro)',
    'Onboarding zero-touch',
  ],
  softwareVersion: '2.0',
  fileSize: 'Web-based',
  installUrl: `${SITE_URL}/signup`,
  screenshot: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/screenshot-dashboard.jpg`,
    caption: 'Dashboard di Placeat',
  },
};

// Product JSON-LD Schema
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Placeat - Software Gestione Ristoranti',
  image: [`${SITE_URL}/og-pricing.jpg`, `${SITE_URL}/screenshot-1.jpg`],
  description:
    'Piattaforma SaaS completa per la gestione di ristoranti: piantine interattive, prenotazioni e recensioni.',
  sku: 'PLACEAT-SAAS',
  brand: {
    '@type': 'Brand',
    name: 'Placeat',
  },
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '49',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    offeredBy: {
      '@type': 'Organization',
      name: 'Placeat',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '150',
  },
};

// FAQPage JSON-LD Schema
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Posso cambiare piano in qualsiasi momento?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sì, puoi upgrade o downgrade il tuo piano in qualsiasi momento. Le modifiche verranno applicate al prossimo ciclo di fatturazione.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cosa include il piano Free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Il piano Free include 1 ristorante, 20 prenotazioni al mese e tutte le funzionalità base. Perfetto per iniziare o per piccoli ristoranti.',
      },
    },
    {
      '@type': 'Question',
      name: 'Come funziona il trial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ogni nuovo account ha 14 giorni di prova gratuita del piano Pro. Nessuna carta di credito richiesta.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso avere un rimborso?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Offriamo una garanzia soddisfatti o rimborsati entro 30 giorni dalla sottoscrizione del piano a pagamento.',
      },
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <Script
        id="schema-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              Placeat
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Accedi</Button>
              </Link>
              <Link href="/signup">
                <Button>Inizia Gratis</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Prezzi semplici e trasparenti
            </h1>
            <p className="text-xl text-muted-foreground">
              Inizia gratis, scala quando il tuo ristorante cresce. 
              Nessun costo nascosto, cancella quando vuoi.
            </p>
          </div>

          <PricingTable />

          {/* FAQ Section */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Domande Frequenti
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Posso cambiare piano in qualsiasi momento?
                </h3>
                <p className="text-muted-foreground">
                  Sì, puoi upgrade o downgrade il tuo piano in qualsiasi momento. 
                  Le modifiche verranno applicate al prossimo ciclo di fatturazione.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Cosa include il piano Free?
                </h3>
                <p className="text-muted-foreground">
                  Il piano Free include 1 ristorante, 20 prenotazioni al mese e tutte le funzionalità base. 
                  Perfetto per iniziare o per piccoli ristoranti.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Come funziona il trial?
                </h3>
                <p className="text-muted-foreground">
                  Ogni nuovo account ha 14 giorni di prova gratuita del piano Pro. 
                  Nessuna carta di credito richiesta.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Posso avere un rimborso?
                </h3>
                <p className="text-muted-foreground">
                  Offriamo una garanzia soddisfatti o rimborsati entro 30 giorni 
                  dalla sottoscrizione del piano a pagamento.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pronto a iniziare?
            </h2>
            <p className="text-muted-foreground mb-8">
              Unisciti a centinaia di ristoranti che usano Placeat ogni giorno.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Inizia Gratis
                <Check className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t mt-24 py-8">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Placeat. Tutti i diritti riservati.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

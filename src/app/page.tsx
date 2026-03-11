'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Check, DraftingCompass, Sparkles, Star, Search, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

// Organization JSON-LD Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Placeat',
  alternateName: 'PLACEAT',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    'https://www.facebook.com/placeat',
    'https://www.instagram.com/placeat',
    'https://www.linkedin.com/company/placeat',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+39-XXX-XXXXXXX',
    contactType: 'customer service',
    email: 'support@placeat.app',
    availableLanguage: ['Italian', 'English'],
  },
  description:
    'Piattaforma SaaS per ristoranti: gestione piantine interattive, prenotazioni e raccolta automatica recensioni Google.',
  foundingDate: '2024',
  areaServed: 'IT',
};

// WebSite JSON-LD Schema
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Placeat',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'it-IT',
  description:
    'Trova e prenota il tuo tavolo nei migliori ristoranti. Gestisci il tuo ristorante con la nostra piattaforma zero-touch.',
};

// SoftwareApplication JSON-LD Schema
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Placeat',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Piano Free disponibile',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Editor piantina interattivo',
    'Gestione prenotazioni',
    'Raccolta recensioni automatica',
    'ReviewFlow intelligente',
    'Onboarding zero-touch',
  ],
};

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <DraftingCompass className="h-6 w-6 text-primary" />
            <span className="font-bold">PLACEAT</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="#features">Funzionalità</Link>
          <Link href="#restaurants">Ristoranti</Link>
          <Link href="#pricing">Prezzi</Link>
        </nav>
        <div className="flex items-center justify-end space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Accedi</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Prova Gratis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image');
  return (
    <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
      <div className="grid gap-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter">
          Gestisci tavoli e recensioni, automaticamente.
        </h1>
        <p className="text-lg text-muted-foreground">
          PLACEAT è la piattaforma zero-touch per ristoranti. Crea la tua
          piantina interattiva, gestisci le prenotazioni e raccogli recensioni su
          Google senza muovere un dito.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Inizia la Prova Gratuita di 14 Giorni</Link>
          </Button>
        </div>
      </div>
      <div className="relative">
        {heroImage && (
            <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            width={1200}
            height={800}
            className="rounded-xl shadow-lg"
            data-ai-hint={heroImage.imageHint}
            />
        )}
        <div className="absolute -bottom-4 -right-4 bg-card p-4 rounded-lg shadow-xl flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-md">
            <Star className="text-primary" />
          </div>
          <div>
            <p className="font-semibold">Nuova Recensione a 5 Stelle!</p>
            <p className="text-sm text-muted-foreground">da un cliente felice</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const floorPlanImage = PlaceHolderImages.find(p => p.id === 'floor-plan-demo');
  const features = [
    {
      icon: <DraftingCompass className="w-8 h-8 text-primary" />,
      title: 'Editor Piantina Interattivo',
      description:
        'Crea una replica digitale del tuo locale con tavoli, muri e zone. Aggiorna la disposizione in qualsiasi momento con un semplice drag-and-drop.',
    },
    {
      icon: <Star className="w-8 h-8 text-primary" />,
      title: 'Raccolta Recensioni Automatica',
      description:
        "Invia richieste di recensione personalizzate e intelligenti. I clienti soddisfatti vengono indirizzati a Google, quelli insoddisfatti a un form privato.",
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: 'Onboarding Zero-Touch',
      description:
        'Registrati e configura il tuo ristorante in 10 minuti. Nessuna chiamata, nessuna email, nessuna agente. Inizia subito, in autonomia.',
    },
  ];

  return (
    <section id="features" className="container py-20 md:py-28">
      <div className="mx-auto grid max-w-5xl items-start gap-12">
        <div className="grid gap-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Tutto ciò di cui hai bisogno. Niente di più.
          </h2>
          <p className="text-muted-foreground">
            Funzionalità potenti pensate per semplificare la vita del
            ristoratore moderno.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="grid gap-4">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        {floorPlanImage && (
             <div className="mt-8">
                <Image
                    src={floorPlanImage.imageUrl}
                    alt={floorPlanImage.description}
                    width={1024}
                    height={768}
                    className="rounded-xl shadow-2xl mx-auto"
                    data-ai-hint={floorPlanImage.imageHint}
                />
            </div>
        )}
      </div>
    </section>
  );
}

function RegisteredRestaurants() {
    const [ristoranti, setRistoranti] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRistoranti, setFilteredRistoranti] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        const fetchRistoranti = async () => {
            setLoading(true);
            try {
                const ristorantiCol = collection(firestore, 'ristoranti');
                const ristorantiSnap = await getDocs(ristorantiCol);
                const ristorantiList = ristorantiSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRistoranti(ristorantiList);
                setFilteredRistoranti(ristorantiList);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRistoranti();
    }, [firestore]);

    useEffect(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = ristoranti.filter(r =>
            (r.nome && r.nome.toLowerCase().includes(lowercasedQuery)) ||
            (r.indirizzo && r.indirizzo.toLowerCase().includes(lowercasedQuery)) ||
            (r.tipo && r.tipo.toLowerCase().includes(lowercasedQuery))
        );
        setFilteredRistoranti(filtered);
    }, [searchQuery, ristoranti]);

    const restaurantImage = PlaceHolderImages.find(p => p.id === 'hero-image');

    return (
        <section id="restaurants" className="container py-20 md:py-28 bg-muted/20">
            <div className="grid gap-4 text-center">
                <h2 className="text-3xl font-bold md:text-4xl">Trova il tuo Ristorante</h2>
                <p className="text-muted-foreground">Esplora i locali iscritti a PLACEAT e prenota il tuo tavolo.</p>
            </div>
            
            <div className="max-w-2xl mx-auto my-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Cerca per nome, indirizzo o tipo di cucina..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                filteredRistoranti.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                        {filteredRistoranti.map(ristorante => (
                            <Link key={ristorante.id} href={`/ristorante/${ristorante.id}`} className="group block h-full">
                                <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden">
                                    {restaurantImage && (
                                        <div className="overflow-hidden">
                                            <Image 
                                                src={restaurantImage.imageUrl} 
                                                alt={ristorante.nome} 
                                                width={600} 
                                                height={400} 
                                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle>{ristorante.nome}</CardTitle>
                                        <CardDescription className="capitalize">{ristorante.tipo}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-muted-foreground">{ristorante.indirizzo}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground mt-12 bg-background p-8 rounded-lg border border-dashed">
                        <p className="font-semibold">Nessun ristorante trovato</p>
                        <p className="text-sm">Prova a modificare la ricerca o esplora tutti i locali.</p>
                    </div>
                )
            )}
        </section>
    );
}

function Pricing() {
  return (
    <section id="pricing" className="container py-20 md:py-28">
      <div className="grid gap-4 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Un prezzo semplice e onesto</h2>
        <p className="text-muted-foreground">
          Inizia gratis. Passa a Pro quando sei pronto. Nessun contratto,
          cancella quando vuoi.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <p className="text-4xl font-extrabold">€0</p>
            <p className="text-muted-foreground">per sempre</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Fino a 50
                prenotazioni/mese
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Editor piantina
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> ReviewFlow automatico
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/signup">Inizia Gratis</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="border-primary shadow-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pro</CardTitle>
              <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                Consigliato
              </div>
            </div>
            <p className="text-4xl font-extrabold">€49</p>
            <p className="text-muted-foreground">/mese</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-2 text-muted-foreground">
              <li className="flex items-center gap-2 font-medium text-foreground">
                <Check className="w-4 h-4 text-primary" /> Prenotazioni
                illimitate
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Editor piantina
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> ReviewFlow automatico
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Supporto prioritario
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/signup">Prova Pro Gratis per 14 Giorni</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-8 flex justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PLACEAT. Tutti i diritti riservati.</p>
        <div className="flex gap-4">
          <Link href="/terms">Termini</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="schema-org-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-org-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="schema-org-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Hero />
          <Features />
          <RegisteredRestaurants />
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  );
}

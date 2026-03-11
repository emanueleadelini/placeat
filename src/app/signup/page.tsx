import { Metadata } from 'next';
import SignupForm from './signup-form';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

export const metadata: Metadata = {
  title: 'Registrati - Prova Gratis 14 Giorni',
  description:
    'Registra il tuo ristorante su Placeat. Inizia la prova gratuita di 14 giorni. Nessuna carta di credito richiesta. Gestione tavoli, prenotazioni e recensioni.',
  keywords: [
    'registrazione',
    'signup',
    'prova gratuita',
    'trial',
    'crea account',
    'registra ristorante',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Registrati - Prova Gratis 14 Giorni | Placeat',
    description:
      'Registra il tuo ristorante su Placeat. Inizia la prova gratuita di 14 giorni. Nessuna carta di credito richiesta.',
    url: `${SITE_URL}/signup`,
  },
  twitter: {
    title: 'Registrati - Prova Gratis 14 Giorni | Placeat',
    description:
      'Registra il tuo ristorante su Placeat. Prova gratuita di 14 giorni.',
  },
  alternates: {
    canonical: `${SITE_URL}/signup`,
  },
};

export default function SignupPage() {
  return <SignupForm />;
}

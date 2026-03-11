import { Metadata } from 'next';
import LoginForm from './login-form';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

export const metadata: Metadata = {
  title: 'Accedi - Gestisci il tuo Ristorante',
  description:
    'Accedi al tuo account Placeat per gestire prenotazioni, piantine tavoli e recensioni del tuo ristorante.',
  keywords: [
    'login',
    'accesso',
    'area riservata',
    'gestionale ristorante',
    'dashboard ristorante',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Accedi - Gestisci il tuo Ristorante | Placeat',
    description: 'Accedi al tuo account Placeat per gestire il tuo ristorante.',
    url: `${SITE_URL}/login`,
  },
  twitter: {
    title: 'Accedi - Gestisci il tuo Ristorante | Placeat',
    description: 'Accedi al tuo account Placeat per gestire il tuo ristorante.',
  },
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
};

export default function LoginPage() {
  return <LoginForm />;
}

import type { Timestamp, GeoPoint } from 'firebase/firestore';

export type Ristorante = {
  id: string;
  nome: string;
  tipo: 'pizzeria' | 'ristorante' | 'trattoria' | 'sushi' | 'bar';
  indirizzo: string;
  geo?: GeoPoint;
  telefono: string;
  email: string;
  proprietarioUid: string;
  stato: 'trial' | 'active' | 'past_due' | 'cancelled';
  piano: 'free' | 'pro' | 'multi';
  trialEndsAt?: Timestamp;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  durataTurnoDefault: number;
  fusoOrario: string;
  reviewflow: {
    attivo: boolean;
    googleLink: string;
    timingInvio: number;
    qrCodeUrl: string;
  };
  onboardingCompletato: boolean;
  onboardingStep: number;
  createdAt: Timestamp;
};

export type DailyOpeningHours = {
    id: string; // lunedi, martedi, etc.
    aperto: boolean;
    dalle: string;
    alle: string;
}

export type Tavolo = {
  id: string;
  numero: number;
  tipo: 'rotondo' | 'rettangolare';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  raggio?: number;
  capienza: number;
  zona?: string;
  attivo: boolean;
};

export type Prenotazione = {
  id: string;
  ristoranteId: string;
  customerId: string;
  cliente: {
    nome: string;
    telefono: string;
    email?: string;
  };
  data: Timestamp | Date; // Allow Date for client-side manipulation
  ora: string;
  tavoloId: string;
  numeroPersone: number;
  stato: 'confermata' | 'completata' | 'cancellata' | 'no-show';
  note?: string;
  recensioneInviata: boolean;
  createdAt: Timestamp;
};

export type Muro = {
    id: string;
    points: { x: number; y: number }[];
    spessore: number;
}

export type Zona = {
    id: string;
    nome: string;
    colore: string;
    path: { x: number; y: number }[];
}

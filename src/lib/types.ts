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
  reviewflow?: {
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
  id: string;
  dayOfWeek: string;
  aperto: boolean;
  dalle: string;
  alle: string;
  slotIndex: number;
};

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

export type AdminUser = {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: 'superadmin' | 'admin' | 'support';
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  attivo: boolean;
}

export type PlatformStats = {
  totalRestaurants: number;
  totalReservations: number;
  totalRevenue: number;
  activeUsers: number;
  trialUsers: number;
  payingUsers: number;
  churnRate: number;
  mrr: number; // Monthly Recurring Revenue
  updatedAt: Timestamp;
}

export type SubscriptionPlan = 'free' | 'pro' | 'multi';

export type Subscription = {
  id: string;
  ristoranteId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'unpaid';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type StripeCheckoutSession = {
  id: string;
  url: string;
  ristoranteId: string;
  plan: SubscriptionPlan;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface ReviewFlowConfig {
  id: string;
  ristoranteId: string;
  enabled: boolean;
  delayHours: number; // 0, 24, 72, 168
  customMessage?: string;
  googleReviewLink?: string;
  tripadvisorLink?: string;
  theforkLink?: string;
  sendEmail: boolean;
  showQRCode: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReviewRequest {
  id: string;
  ristoranteId: string;
  prenotazioneId: string;
  clienteEmail: string;
  clienteNome: string;
  status: 'pending' | 'sent' | 'clicked' | 'completed' | 'failed';
  sentAt?: Timestamp;
  clickedAt?: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReviewStats {
  totalSent: number;
  totalClicked: number;
  totalCompleted: number;
  clickRate: number;
  conversionRate: number;
  thisMonthSent: number;
}

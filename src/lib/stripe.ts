import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover' as any,
    });
  }
  return _stripe;
}

// Backward-compat alias — use getStripe() instead
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  multi: process.env.STRIPE_PRICE_MULTI || 'price_multi_placeholder',
};

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 29,
  multi: 79,
};

export type SubscriptionPlan = 'free' | 'pro' | 'multi';

export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Per iniziare',
    features: [
      '1 ristorante',
      '20 prenotazioni/mese',
      'Piantina base',
      'Supporto email',
    ],
    limits: {
      restaurants: 1,
      reservationsPerMonth: 20,
      staffMembers: 1,
    },
  },
  pro: {
    name: 'Pro',
    price: 29,
    description: 'Per ristoranti professionali',
    features: [
      '1 ristorante',
      'Prenotazioni illimitate',
      'Piantina avanzata',
      'ReviewFlow',
      'Analytics',
      'Supporto prioritario',
    ],
    limits: {
      restaurants: 1,
      reservationsPerMonth: -1, // illimitato
      staffMembers: 5,
    },
  },
  multi: {
    name: 'Multi',
    price: 79,
    description: 'Per catene e gruppi',
    features: [
      'Ristoranti illimitati',
      'Prenotazioni illimitate',
      'Piantina avanzata',
      'ReviewFlow',
      'Analytics avanzati',
      'Gestione team',
      'API access',
      'Supporto dedicato',
    ],
    limits: {
      restaurants: -1,
      reservationsPerMonth: -1,
      staffMembers: -1,
    },
  },
};

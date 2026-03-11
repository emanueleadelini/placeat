'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/stripe';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

interface PricingTableProps {
  currentPlan?: SubscriptionPlan;
  ristoranteId?: string;
}

export function PricingTable({ currentPlan = 'free', ristoranteId }: PricingTableProps) {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (plan === 'free') {
      // Handle downgrade or stay on free
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ristoranteId: ristoranteId || 'default',
          plan,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Errore durante la creazione del checkout. Riprova.');
    } finally {
      setLoading(null);
    }
  };

  const plans: SubscriptionPlan[] = ['free', 'pro', 'multi'];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => {
        const features = PLAN_FEATURES[plan];
        const isCurrentPlan = currentPlan === plan;
        const isLoading = loading === plan;

        return (
          <Card
            key={plan}
            className={`relative flex flex-col ${
              isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''
            } ${plan === 'pro' ? 'lg:scale-105 lg:z-10' : ''}`}
          >
            {plan === 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Più Popolare</Badge>
              </div>
            )}
            
            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">Piano Attuale</Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{features.name}</CardTitle>
              <CardDescription>{features.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€{features.price}</span>
                {features.price > 0 && (
                  <span className="text-muted-foreground">/mese</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 mb-6 flex-1">
                {features.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrentPlan || isLoading}
                variant={isCurrentPlan ? 'outline' : 'default'}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Caricamento...
                  </>
                ) : isCurrentPlan ? (
                  'Piano Attuale'
                ) : plan === 'free' ? (
                  'Inizia Gratis'
                ) : (
                  'Abbonati Ora'
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

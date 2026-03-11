'use client';

import { useState } from 'react';
import { useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Ristorante, Subscription } from '@/lib/types';
import { PricingTable } from '@/components/stripe/pricing-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BillingPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // Get restaurant data
  const { data: restaurant, isLoading: restaurantLoading } = useDoc<Ristorante>(
    user ? doc(db, 'ristoranti', 'default') : null
  );

  // Get subscription data
  const { data: subscription } = useDoc<Subscription>(
    restaurant?.stripeSubscriptionId 
      ? doc(db, 'subscriptions', restaurant.stripeSubscriptionId) 
      : null
  );

  const handleManageSubscription = async () => {
    if (!restaurant?.stripeCustomerId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: restaurant.stripeCustomerId,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentPlan = restaurant?.piano || 'free';
  const isTrial = restaurant?.stato === 'trial';
  const trialEndsAt = restaurant?.trialEndsAt;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abbonamento</h1>
        <p className="text-muted-foreground">
          Gestisci il tuo piano e i metodi di pagamento
        </p>
      </div>

      {isTrial && trialEndsAt && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sei in periodo di prova. Il trial scade il{' '}
            {format(trialEndsAt.toDate(), 'dd/MM/yyyy', { locale: it })}.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Piano Attuale
          </CardTitle>
          <CardDescription>
            Dettagli del tuo abbonamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold capitalize">{currentPlan}</span>
                <Badge variant={restaurant?.stato === 'active' ? 'default' : 'secondary'}>
                  {restaurant?.stato === 'active' ? 'Attivo' : 
                   restaurant?.stato === 'trial' ? 'Trial' : 'Free'}
                </Badge>
              </div>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  Prossimo rinnovo:{' '}
                  {format(subscription.currentPeriodEnd.toDate(), 'dd/MM/yyyy', { locale: it })}
                </p>
              )}
            </div>
            
            {currentPlan !== 'free' && (
              <Button 
                onClick={handleManageSubscription}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Gestisci Abbonamento'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <div className="pt-8">
        <h2 className="text-xl font-semibold mb-6">Cambia Piano</h2>
        <PricingTable currentPlan={currentPlan} ristoranteId={restaurant?.id} />
      </div>
    </div>
  );
}

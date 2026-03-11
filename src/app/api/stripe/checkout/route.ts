import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError, apiErrors } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  // Check rate limit before processing
  const rateLimitResponse = await checkRateLimit(req, 'general');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const { ristoranteId, plan, successUrl, cancelUrl } = body;

    if (!ristoranteId || !plan) {
      return apiErrors.validation('Missing required fields', {
        required: ['ristoranteId', 'plan'],
      });
    }

    // Get restaurant details
    const restaurantDoc = await adminDb.collection('ristoranti').doc(ristoranteId).get();
    if (!restaurantDoc.exists) {
      return apiErrors.notFound('Restaurant');
    }

    const restaurant = restaurantDoc.data();
    
    // Get or create Stripe customer
    let customerId = restaurant?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: restaurant?.email,
        name: restaurant?.nome,
        metadata: {
          ristoranteId,
          firebaseUid: restaurant?.proprietarioUid,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to restaurant
      await adminDb.collection('ristoranti').doc(ristoranteId).update({
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS];
    
    if (!priceId) {
      return apiErrors.validation('Invalid plan', { validPlans: Object.keys(STRIPE_PRICE_IDS) });
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?canceled=true`,
      metadata: {
        ristoranteId,
        plan,
      },
      subscription_data: {
        metadata: {
          ristoranteId,
          plan,
        },
      },
    });

    // Save checkout session to Firestore
    await adminDb.collection('stripeCheckoutSessions').doc(session.id).set({
      id: session.id,
      url: session.url,
      ristoranteId,
      plan,
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    return handleApiError('Stripe checkout', error, { endpoint: '/api/stripe/checkout' });
  }
}

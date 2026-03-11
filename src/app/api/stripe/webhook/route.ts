import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';
import { logApiError } from '@/lib/api-error';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  // Check rate limit before processing (higher limit for webhooks)
  const rateLimitResponse = await checkRateLimit(req, 'stripeWebhook');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      logApiError('Stripe webhook signature verification', err, {
        signature: signature?.substring(0, 20) + '...',
      });
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logApiError('Stripe webhook handler', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const { ristoranteId, plan } = session.metadata;
  
  if (!ristoranteId) {
    console.error('No ristoranteId in session metadata');
    return;
  }

  try {
    // Update restaurant status
    await adminDb.collection('ristoranti').doc(ristoranteId).update({
      piano: plan,
      stato: 'active',
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      updatedAt: Timestamp.now(),
    });

    // Create/update subscription document
    await adminDb.collection('subscriptions').doc(session.subscription).set({
      id: session.subscription,
      ristoranteId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: session.line_items?.data[0]?.price?.id,
      plan,
      status: 'active',
      currentPeriodStart: Timestamp.now(),
      currentPeriodEnd: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update checkout session status
    await adminDb.collection('stripeCheckoutSessions').doc(session.id).update({
      status: 'completed',
      subscriptionId: session.subscription,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Checkout completed for restaurant ${ristoranteId}, plan: ${plan}`);
  } catch (error) {
    logApiError('Stripe webhook: checkout completed', error, { ristoranteId, plan });
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  try {
    await adminDb.collection('subscriptions').doc(subscriptionId).update({
      status: 'active',
      lastPaymentStatus: 'succeeded',
      lastPaymentDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update restaurant status
    const subscriptionDoc = await adminDb.collection('subscriptions').doc(subscriptionId).get();
    const data = subscriptionDoc.data();
    if (data?.ristoranteId) {
      await adminDb.collection('ristoranti').doc(data.ristoranteId).update({
        stato: 'active',
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    logApiError('Stripe webhook: payment succeeded', error, { subscriptionId });
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  try {
    await adminDb.collection('subscriptions').doc(subscriptionId).update({
      status: 'past_due',
      lastPaymentStatus: 'failed',
      lastPaymentDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update restaurant status
    const subscriptionDoc = await adminDb.collection('subscriptions').doc(subscriptionId).get();
    const data = subscriptionDoc.data();
    if (data?.ristoranteId) {
      await adminDb.collection('ristoranti').doc(data.ristoranteId).update({
        stato: 'past_due',
        updatedAt: Timestamp.now(),
      });
    }

    console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
  } catch (error) {
    logApiError('Stripe webhook: payment failed', error, { subscriptionId });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    await adminDb.collection('subscriptions').doc(subscription.id).update({
      status: 'canceled',
      cancelAtPeriodEnd: false,
      canceledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Downgrade restaurant to free
    const subscriptionDoc = await adminDb.collection('subscriptions').doc(subscription.id).get();
    const data = subscriptionDoc.data();
    if (data?.ristoranteId) {
      await adminDb.collection('ristoranti').doc(data.ristoranteId).update({
        piano: 'free',
        stato: 'cancelled',
        updatedAt: Timestamp.now(),
      });
    }

    console.log(`❌ Subscription canceled for ${subscription.id}`);
  } catch (error) {
    logApiError('Stripe webhook: subscription deleted', error, { subscriptionId: subscription.id });
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const updates: any = {
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: Timestamp.fromMillis(subscription.current_period_start * 1000),
      currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
      updatedAt: Timestamp.now(),
    };

    if (subscription.canceled_at) {
      updates.canceledAt = Timestamp.fromMillis(subscription.canceled_at * 1000);
    }

    await adminDb.collection('subscriptions').doc(subscription.id).update(updates);
  } catch (error) {
    logApiError('Stripe webhook: subscription updated', error, { subscriptionId: subscription.id });
  }
}

// Disable body parsing for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

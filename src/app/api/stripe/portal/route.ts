import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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
    const { customerId, returnUrl } = body;

    if (!customerId) {
      return apiErrors.validation('Missing customerId');
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return handleApiError('Stripe portal', error, { endpoint: '/api/stripe/portal' });
  }
}

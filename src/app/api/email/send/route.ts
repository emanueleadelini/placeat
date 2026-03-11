import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateReservationEmail, generateReviewEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError, apiErrors } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  // Check rate limit before processing (strict limit for email)
  const rateLimitResponse = await checkRateLimit(req, 'email');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const { type, to, data } = body;

    if (!to || !type) {
      return apiErrors.validation('Missing required fields', {
        required: ['to', 'type'],
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return apiErrors.validation('Invalid email format', { field: 'to' });
    }

    let html = '';
    let subject = '';

    switch (type) {
      case 'reservation-confirmed':
        html = generateReservationEmail({
          type: 'confirmed',
          ...data,
        });
        subject = `Prenotazione confermata - ${data.restaurantName}`;
        break;

      case 'reservation-reminder':
        html = generateReservationEmail({
          type: 'reminder',
          ...data,
        });
        subject = `Reminder: La tua prenotazione domani alle ${data.time}`;
        break;

      case 'reservation-cancelled':
        html = generateReservationEmail({
          type: 'cancelled',
          ...data,
        });
        subject = `Prenotazione cancellata - ${data.restaurantName}`;
        break;

      case 'review-request':
        html = generateReviewEmail(data);
        subject = 'Come è andata la tua esperienza?';
        break;

      default:
        return apiErrors.validation('Invalid email type', {
          validTypes: ['reservation-confirmed', 'reservation-reminder', 'reservation-cancelled', 'review-request'],
        });
    }

    const result = await sendEmail({
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, id: result?.id });
  } catch (error: any) {
    return handleApiError('Email send', error, { endpoint: '/api/email/send' });
  }
}

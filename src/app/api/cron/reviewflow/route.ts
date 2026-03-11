import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewFlowConfig,
  getReservationsNeedingReviews,
  createReviewRequest,
  sendReviewRequest,
  markReservationAsReviewRequested,
} from '@/lib/reviewflow';

// This endpoint should be called by a cron job (e.g., every hour)
// In production, you would use Vercel Cron Jobs or similar
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if configured
    const cronSecret = req.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results: Array<{
      ristoranteId: string;
      prenotazioneId: string;
      status: 'sent' | 'skipped' | 'error';
      message?: string;
    }> = [];

    // Get configurations for all restaurants with ReviewFlow enabled
    // For each delayHours value (0, 24, 72, 168)
    const delayOptions = [0, 24, 72, 168];

    for (const delayHours of delayOptions) {
      const reservations = await getReservationsNeedingReviews(delayHours, 25);

      for (const reservation of reservations) {
        try {
          // Get config for this restaurant
          const config = await getReviewFlowConfig(reservation.ristoranteId);

          if (!config || !config.enabled) {
            results.push({
              ristoranteId: reservation.ristoranteId,
              prenotazioneId: reservation.prenotazioneId,
              status: 'skipped',
              message: 'ReviewFlow disabled',
            });
            continue;
          }

          // Check if this reservation matches the delayHours
          if (config.delayHours !== delayHours) {
            results.push({
              ristoranteId: reservation.ristoranteId,
              prenotazioneId: reservation.prenotazioneId,
              status: 'skipped',
              message: `Delay mismatch: config=${config.delayHours}h, checking=${delayHours}h`,
            });
            continue;
          }

          // Create review request
          const reviewRequestId = await createReviewRequest(
            reservation.ristoranteId,
            reservation.prenotazioneId,
            reservation.clienteEmail,
            reservation.clienteNome
          );

          // Send email if enabled
          if (config.sendEmail) {
            // Get restaurant name
            const { adminDb } = await import('@/lib/firebase-admin');
            let restaurantName = 'Il nostro ristorante';

            if (adminDb) {
              const ristoranteDoc = await adminDb
                .collection('ristoranti')
                .doc(reservation.ristoranteId)
                .get();
              if (ristoranteDoc.exists) {
                restaurantName = ristoranteDoc.data()?.nome || restaurantName;
              }
            }

            const sendResult = await sendReviewRequest(
              reviewRequestId,
              restaurantName,
              config.googleReviewLink,
              config.tripadvisorLink,
              config.theforkLink,
              config.customMessage
            );

            if (sendResult.success) {
              await markReservationAsReviewRequested(
                reservation.ristoranteId,
                reservation.prenotazioneId
              );

              results.push({
                ristoranteId: reservation.ristoranteId,
                prenotazioneId: reservation.prenotazioneId,
                status: 'sent',
              });
            } else {
              results.push({
                ristoranteId: reservation.ristoranteId,
                prenotazioneId: reservation.prenotazioneId,
                status: 'error',
                message: sendResult.error,
              });
            }
          } else {
            // Just created, marked as sent without email
            await markReservationAsReviewRequested(
              reservation.ristoranteId,
              reservation.prenotazioneId
            );

            results.push({
              ristoranteId: reservation.ristoranteId,
              prenotazioneId: reservation.prenotazioneId,
              status: 'skipped',
              message: 'Email sending disabled',
            });
          }
        } catch (error: any) {
          results.push({
            ristoranteId: reservation.ristoranteId,
            prenotazioneId: reservation.prenotazioneId,
            status: 'error',
            message: error.message,
          });
        }
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        sent,
        skipped,
        errors,
      },
      results,
    });
  } catch (error: any) {
    console.error('ReviewFlow cron error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run ReviewFlow cron' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}

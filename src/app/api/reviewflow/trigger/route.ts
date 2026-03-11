import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewFlowConfig,
  hasReviewRequestBeenSent,
  createReviewRequest,
  sendReviewRequest,
  markReservationAsReviewRequested,
} from '@/lib/reviewflow';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prenotazioneId, ristoranteId, manual = false } = body;

    if (!prenotazioneId || !ristoranteId) {
      return NextResponse.json(
        { error: 'Missing required fields: prenotazioneId and ristoranteId' },
        { status: 400 }
      );
    }

    // Get ReviewFlow configuration
    const config = await getReviewFlowConfig(ristoranteId);

    if (!config) {
      return NextResponse.json(
        { error: 'ReviewFlow configuration not found' },
        { status: 404 }
      );
    }

    // If not manual trigger, check if enabled
    if (!manual && !config.enabled) {
      return NextResponse.json(
        { error: 'ReviewFlow is disabled for this restaurant' },
        { status: 400 }
      );
    }

    // Get reservation details
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const prenotazioneRef = adminDb
      .collection('ristoranti')
      .doc(ristoranteId)
      .collection('prenotazioni')
      .doc(prenotazioneId);

    const prenotazioneDoc = await prenotazioneRef.get();

    if (!prenotazioneDoc.exists) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const prenotazione = prenotazioneDoc.data();

    if (!prenotazione?.cliente?.email) {
      return NextResponse.json(
        { error: 'Reservation does not have an email address' },
        { status: 400 }
      );
    }

    // Check if review request already sent
    const alreadySent = await hasReviewRequestBeenSent(ristoranteId, prenotazioneId);

    if (alreadySent) {
      return NextResponse.json(
        { error: 'Review request already sent for this reservation' },
        { status: 409 }
      );
    }

    // Get restaurant details
    const ristoranteRef = adminDb.collection('ristoranti').doc(ristoranteId);
    const ristoranteDoc = await ristoranteRef.get();

    if (!ristoranteDoc.exists) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const ristorante = ristoranteDoc.data();
    const restaurantName = ristorante?.nome || 'Il nostro ristorante';

    // Create review request record
    const reviewRequestId = await createReviewRequest(
      ristoranteId,
      prenotazioneId,
      prenotazione.cliente.email,
      prenotazione.cliente.nome || 'Cliente'
    );

    // If sending email is enabled, send immediately
    if (config.sendEmail || manual) {
      const sendResult = await sendReviewRequest(
        reviewRequestId,
        restaurantName,
        config.googleReviewLink,
        config.tripadvisorLink,
        config.theforkLink,
        config.customMessage
      );

      if (!sendResult.success) {
        return NextResponse.json(
          { error: 'Failed to send review request email', details: sendResult.error },
          { status: 500 }
        );
      }

      // Mark reservation as review requested
      await markReservationAsReviewRequested(ristoranteId, prenotazioneId);

      return NextResponse.json({
        success: true,
        message: 'Review request sent successfully',
        reviewRequestId,
      });
    }

    // Just created the request, email will be sent by cron job based on delayHours
    return NextResponse.json({
      success: true,
      message: 'Review request queued for later delivery',
      reviewRequestId,
    });
  } catch (error: any) {
    console.error('ReviewFlow trigger error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger review request' },
      { status: 500 }
    );
  }
}

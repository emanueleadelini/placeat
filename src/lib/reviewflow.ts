import { adminDb } from '@/lib/firebase-admin';
import { ReviewFlowConfig, ReviewRequest, ReviewStats } from '@/lib/types';
import { sendEmail, generateReviewEmail } from '@/lib/email';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const REVIEWFLOW_COLLECTION = 'reviewflowConfigs';
const REVIEW_REQUESTS_COLLECTION = 'reviewRequests';

/**
 * Get or create ReviewFlow configuration for a restaurant
 */
export async function getReviewFlowConfig(ristoranteId: string): Promise<ReviewFlowConfig | null> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const configsRef = adminDb.collection(REVIEWFLOW_COLLECTION);
  const snapshot = await configsRef.where('ristoranteId', '==', ristoranteId).limit(1).get();

  if (snapshot.empty) {
    // Create default config
    const defaultConfig: Omit<ReviewFlowConfig, 'id'> = {
      ristoranteId,
      enabled: false,
      delayHours: 24,
      customMessage: '',
      googleReviewLink: '',
      tripadvisorLink: '',
      theforkLink: '',
      sendEmail: true,
      showQRCode: true,
      createdAt: Timestamp.now() as unknown as FieldValue as any,
      updatedAt: Timestamp.now() as unknown as FieldValue as any,
    };

    const newDoc = await configsRef.add(defaultConfig);
    return { ...defaultConfig, id: newDoc.id } as ReviewFlowConfig;
  }

  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id } as ReviewFlowConfig;
}

/**
 * Update ReviewFlow configuration
 */
export async function updateReviewFlowConfig(
  configId: string,
  updates: Partial<Omit<ReviewFlowConfig, 'id' | 'createdAt'>>
): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const configRef = adminDb.collection(REVIEWFLOW_COLLECTION).doc(configId);
  await configRef.update({
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Check if a review request has already been sent for a reservation
 */
export async function hasReviewRequestBeenSent(
  ristoranteId: string,
  prenotazioneId: string
): Promise<boolean> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const requestsRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION);
  const snapshot = await requestsRef
    .where('ristoranteId', '==', ristoranteId)
    .where('prenotazioneId', '==', prenotazioneId)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Create a review request record
 */
export async function createReviewRequest(
  ristoranteId: string,
  prenotazioneId: string,
  clienteEmail: string,
  clienteNome: string
): Promise<string> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const requestsRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION);
  const newRequest: Omit<ReviewRequest, 'id'> = {
    ristoranteId,
    prenotazioneId,
    clienteEmail,
    clienteNome,
    status: 'pending',
    createdAt: Timestamp.now() as unknown as FieldValue as any,
    updatedAt: Timestamp.now() as unknown as FieldValue as any,
  };

  const doc = await requestsRef.add(newRequest);
  return doc.id;
}

/**
 * Send a review request email and update the record
 */
export async function sendReviewRequest(
  reviewRequestId: string,
  restaurantName: string,
  googleReviewLink?: string,
  tripadvisorLink?: string,
  theforkLink?: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  const requestRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION).doc(reviewRequestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    return { success: false, error: 'Review request not found' };
  }

  const requestData = requestDoc.data() as ReviewRequest;

  // Build review links HTML
  const reviewLinks: { name: string; url: string; icon: string }[] = [];
  if (googleReviewLink) {
    reviewLinks.push({ name: 'Google', url: googleReviewLink, icon: '⭐' });
  }
  if (tripadvisorLink) {
    reviewLinks.push({ name: 'TripAdvisor', url: tripadvisorLink, icon: '🌐' });
  }
  if (theforkLink) {
    reviewLinks.push({ name: 'TheFork', url: theforkLink, icon: '🍴' });
  }

  try {
    const html = generateReviewEmailEnhanced({
      restaurantName,
      customerName: requestData.clienteNome,
      reviewLinks,
      customMessage,
    });

    await sendEmail({
      to: requestData.clienteEmail,
      subject: `Come è andata la tua esperienza da ${restaurantName}?`,
      html,
    });

    await requestRef.update({
      status: 'sent',
      sentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error: any) {
    await requestRef.update({
      status: 'failed',
      errorMessage: error.message,
      updatedAt: Timestamp.now(),
    });
    return { success: false, error: error.message };
  }
}

/**
 * Generate enhanced review email HTML
 */
function generateReviewEmailEnhanced(params: {
  restaurantName: string;
  customerName: string;
  reviewLinks: { name: string; url: string; icon: string }[];
  customMessage?: string;
}): string {
  const { restaurantName, customerName, reviewLinks, customMessage } = params;

  const linksHtml = reviewLinks
    .map(
      (link) => `
      <a href="${link.url}" 
         style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 8px; margin: 8px; font-weight: 600;">
        ${link.icon} ${link.name}
      </a>
    `
    )
    .join('');

  const customMsgHtml = customMessage
    ? `<p style="font-style: italic; color: #555; margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff;">${customMessage}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Richiesta Recensione</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">⭐ ${restaurantName}</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">La tua opinione conta!</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">Ciao <strong>${customerName}</strong>,</p>
                  
                  <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                    Grazie per aver scelto <strong>${restaurantName}</strong>! Speriamo che la tua esperienza sia stata fantastica.
                  </p>
                  
                  <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 25px 0;">
                    Ci faresti un enorme favore lasciando una recensione? Il tuo feedback ci aiuta a migliorare e aiuta altri clienti a scoprirci.
                  </p>
                  
                  ${customMsgHtml}
                  
                  <div style="text-align: center; margin: 35px 0;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">Clicca su una delle piattaforme:</p>
                    ${linksHtml}
                  </div>
                  
                  <p style="font-size: 14px; color: #888; text-align: center; margin: 30px 0 0 0;">
                    Ci vuole solo un minuto e significa tantissimo per noi! 💙
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    Questa email è stata inviata automaticamente da Placeat.<br>
                    Se non desideri ricevere queste email, puoi disiscriverti contattandoci.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Get review requests for a restaurant
 */
export async function getReviewRequests(
  ristoranteId: string,
  limit: number = 100
): Promise<ReviewRequest[]> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const requestsRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION);
  const snapshot = await requestsRef
    .where('ristoranteId', '==', ristoranteId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as ReviewRequest));
}

/**
 * Get review stats for a restaurant
 */
export async function getReviewStats(ristoranteId: string): Promise<ReviewStats> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const requestsRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION);
  const snapshot = await requestsRef
    .where('ristoranteId', '==', ristoranteId)
    .get();

  const requests = snapshot.docs.map((doc) => doc.data() as ReviewRequest);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalSent = requests.filter((r) => r.status === 'sent' || r.status === 'clicked' || r.status === 'completed').length;
  const totalClicked = requests.filter((r) => r.status === 'clicked' || r.status === 'completed').length;
  const totalCompleted = requests.filter((r) => r.status === 'completed').length;
  const thisMonthSent = requests.filter((r) => {
    if (!r.sentAt) return false;
    const sentDate = r.sentAt.toDate();
    return sentDate >= startOfMonth;
  }).length;

  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const conversionRate = totalSent > 0 ? (totalCompleted / totalSent) * 100 : 0;

  return {
    totalSent,
    totalClicked,
    totalCompleted,
    clickRate: Math.round(clickRate * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    thisMonthSent,
  };
}

/**
 * Update review request status when clicked
 */
export async function trackReviewClick(reviewRequestId: string): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const requestRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION).doc(reviewRequestId);
  await requestRef.update({
    status: 'clicked',
    clickedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update review request status when completed
 */
export async function trackReviewCompleted(reviewRequestId: string): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const requestRef = adminDb.collection(REVIEW_REQUESTS_COLLECTION).doc(reviewRequestId);
  await requestRef.update({
    status: 'completed',
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get reservations that need review requests (for cron job)
 */
export async function getReservationsNeedingReviews(
  hoursDelay: number,
  batchSize: number = 50
): Promise<Array<{ prenotazioneId: string; ristoranteId: string; clienteEmail: string; clienteNome: string }>> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  // Calculate the target time window
  const now = Timestamp.now();
  const targetTime = new Date(Date.now() - hoursDelay * 60 * 60 * 1000);
  const targetTimestamp = Timestamp.fromDate(targetTime);
  
  // Get reservations that ended around the target time and don't have review requests sent
  const reservationsRef = adminDb.collectionGroup('prenotazioni');
  const snapshot = await reservationsRef
    .where('stato', '==', 'completata')
    .where('recensioneInviata', '==', false)
    .where('data', '<=', targetTimestamp)
    .limit(batchSize)
    .get();

  const results: Array<{ prenotazioneId: string; ristoranteId: string; clienteEmail: string; clienteNome: string }> = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.cliente?.email) continue;

    // Extract ristoranteId from the path
    const pathParts = doc.ref.path.split('/');
    const ristoranteId = pathParts[1];

    results.push({
      prenotazioneId: doc.id,
      ristoranteId,
      clienteEmail: data.cliente.email,
      clienteNome: data.cliente.nome,
    });
  }

  return results;
}

/**
 * Mark reservation as review requested
 */
export async function markReservationAsReviewRequested(
  ristoranteId: string,
  prenotazioneId: string
): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }

  const prenotazioneRef = adminDb
    .collection('ristoranti')
    .doc(ristoranteId)
    .collection('prenotazioni')
    .doc(prenotazioneId);

  await prenotazioneRef.update({
    recensioneInviata: true,
    recensioneInviataAt: Timestamp.now(),
  });
}

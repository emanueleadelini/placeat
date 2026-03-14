import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export const EMAIL_TEMPLATES = {
  reservationConfirmed: {
    subject: 'Prenotazione confermata - {{restaurantName}}',
    from: 'Placeat <noreply@placeat.app>',
  },
  reservationReminder: {
    subject: 'Reminder: La tua prenotazione domani alle {{time}}',
    from: 'Placeat <noreply@placeat.app>',
  },
  reservationCancelled: {
    subject: 'Prenotazione cancellata - {{restaurantName}}',
    from: 'Placeat <noreply@placeat.app>',
  },
  reviewRequest: {
    subject: 'Come è andata la tua esperienza?',
    from: 'Placeat <noreply@placeat.app>',
  },
  welcome: {
    subject: 'Benvenuto su Placeat!',
    from: 'Placeat <noreply@placeat.app>',
  },
  trialEnding: {
    subject: 'Il tuo trial sta per scadere',
    from: 'Placeat <noreply@placeat.app>',
  },
};

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not set, email not sent');
    return { id: 'mock-email-id' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || 'Placeat <noreply@placeat.app>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export function generateReservationEmail(params: {
  type: 'confirmed' | 'reminder' | 'cancelled';
  restaurantName: string;
  customerName: string;
  date: string;
  time: string;
  guests: number;
  address?: string;
  phone?: string;
  cancellationLink?: string;
}) {
  const { type, restaurantName, customerName, date, time, guests, address, phone } = params;

  const templates = {
    confirmed: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Prenotazione Confermata! 🎉</h1>
        <p>Ciao ${customerName},</p>
        <p>La tua prenotazione presso <strong>${restaurantName}</strong> è stata confermata.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dettagli Prenotazione</h3>
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Ora:</strong> ${time}</p>
          <p><strong>Ospiti:</strong> ${guests} persone</p>
          ${address ? `<p><strong>Indirizzo:</strong> ${address}</p>` : ''}
          ${phone ? `<p><strong>Telefono:</strong> ${phone}</p>` : ''}
        </div>
        
        <p>Ci vediamo presto!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">
          Questa email è stata inviata automaticamente da Placeat.
        </p>
      </div>
    `,
    reminder: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reminder Prenotazione ⏰</h1>
        <p>Ciao ${customerName},</p>
        <p>Ti ricordiamo che hai una prenotazione domani:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${restaurantName}</h3>
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Ora:</strong> ${time}</p>
          <p><strong>Ospiti:</strong> ${guests} persone</p>
        </div>
        
        <p>A domani!</p>
      </div>
    `,
    cancelled: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Prenotazione Cancellata</h1>
        <p>Ciao ${customerName},</p>
        <p>La tua prenotazione presso <strong>${restaurantName}</strong> è stata cancellata.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Ora:</strong> ${time}</p>
        </div>
        
        <p>Ci dispiace non averti con noi. Speriamo di rivederti presto!</p>
      </div>
    `,
  };

  return templates[type];
}

export function generateReviewEmail(params: {
  restaurantName: string;
  customerName: string;
  reviewLink: string;
  customMessage?: string;
  additionalLinks?: { name: string; url: string }[];
}) {
  const { restaurantName, customerName, reviewLink, customMessage, additionalLinks } = params;

  const customMsgHtml = customMessage
    ? `<p style="font-style: italic; color: #555; margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff;">${customMessage}</p>`
    : '';

  const additionalLinksHtml = additionalLinks?.length
    ? additionalLinks.map(link => `
      <a href="${link.url}" 
         style="display: inline-block; background: #6c757d; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; margin: 8px; font-weight: 500;">
        ${link.name}
      </a>
    `).join('')
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
                    <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">Clicca qui per lasciare una recensione:</p>
                    <a href="${reviewLink}" 
                       style="display: inline-block; background: #007bff; color: white; padding: 18px 36px; 
                              text-decoration: none; border-radius: 8px; margin: 8px; font-weight: 600; font-size: 16px;">
                      ⭐ Lascia una Recensione su Google
                    </a>
                    ${additionalLinksHtml}
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

# 📊 Uptime Monitoring Setup

Questa guida ti aiuta a configurare il monitoring del tuo SaaS Placeat.

---

## 🎯 Opzione 1: UptimeRobot (Consigliata - Gratuita)

### Setup Rapido

1. **Registrati** su [UptimeRobot](https://uptimerobot.com/sign-up)
2. **Aggiungi monitor**:
   - Click "Add New Monitor"
   - Monitor Type: HTTP(s)
   - Friendly Name: Placeat Homepage
   - URL: `https://tuodominio.com`
   - Monitoring Interval: 5 minuti

3. **Aggiungi altri monitor**:
   - Dashboard: `https://tuodominio.com/dashboard`
   - API Health: `https://tuodominio.com/api/health` (se implementi)
   - Stripe Webhook: `https://tuodominio.com/api/stripe/webhook` (HEAD request)

4. **Configura Alert**:
   - Email: tua-email@example.com
   - Slack (opzionale): Configura webhook
   - SMS (opzionale): Numero di telefono

5. **Status Page** (opzionale):
   - Vai su "Status Pages"
   - Crea pagina pubblica: `status.tuodominio.com`

### Piano Gratuito
- 50 monitor
- 5 minuti intervallo
- Alert email
- Status page base

---

## 🎯 Opzione 2: Pingdom (Premium)

Se hai bisogno di feature avanzate:
- Transaction monitoring
- Real user monitoring
- Root cause analysis

---

## 🎯 Opzione 3: Better Uptime (Moderno)

[Better Uptime](https://betteruptime.com) offre:
- UI moderna
- Incident management
- On-call scheduling
- Piano gratuito: 10 monitor

---

## 🔍 Health Check Endpoint

Aggiungi questo file per monitoraggio avanzato:

**`src/app/api/health/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      firebase: false,
      stripe: true, // Stripe webhook non lo possiamo testare qui
    },
  };

  try {
    // Test Firebase connection
    await adminDb.collection('health').doc('ping').get();
    checks.services.firebase = true;
  } catch (error) {
    checks.services.firebase = false;
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(checks, { status: statusCode });
}
```

Poi aggiungi monitor su UptimeRobot:
- URL: `https://tuodominio.com/api/health`
- Cerca: `"status": "healthy"` nel response

---

## 📱 Alert Configuration

### Email Alert Template
```
Subject: 🚨 Placeat DOWN - {monitor_name}

Il monitor {monitor_name} ha rilevato un problema.

URL: {monitor_url}
Status: DOWN
Time: {alert_datetime}
Error: {alert_details}

Azione richiesta:
1. Verifica lo stato su Sentry
2. Controlla i log Vercel/Firebase
3. Verifica Firebase Console
```

### Slack Integration
1. Crea webhook in Slack: `https://api.slack.com/messaging/webhooks`
2. Aggiungi URL in UptimeRobot > Alert Contacts
3. Formato messaggio:
```json
{
  "text": "🚨 Placeat Alert",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {
          "title": "Monitor",
          "value": "{monitor_name}",
          "short": true
        },
        {
          "title": "Status",
          "value": "DOWN ⬇️",
          "short": true
        },
        {
          "title": "URL",
          "value": "{monitor_url}",
          "short": false
        }
      ]
    }
  ]
}
```

---

## 📊 Runbook - Cosa fare quando c'è un downtime

### Checklist Rapida (2 minuti)

- [ ] Verifica [Vercel Status](https://www.vercel-status.com)
- [ ] Verifica [Firebase Status](https://status.firebase.google.com)
- [ ] Verifica [Stripe Status](https://status.stripe.com)
- [ ] Controlla Sentry per errori recenti
- [ ] Prova ad accedere manualmente al sito

### Se il problema persiste

1. **Controlla i log Vercel**:
   ```bash
   vercel logs --all
   ```

2. **Verifica Firebase Firestore**:
   - Vai su Firebase Console > Firestore
   - Controlla se ci sono errori di quota

3. **Verifica Stripe**:
   - Dashboard > Developers > Webhooks
   - Controlla se i webhook vengono ricevuti

4. **Riavvia deployment** (se necessario):
   ```bash
   vercel --prod
   ```

---

## 📈 Metriche da Monitorare

| Metrica | Target | Alert se |
|---------|--------|----------|
| Uptime | >99.9% | <99% |
| Response Time | <500ms | >2s |
| Error Rate | <0.1% | >1% |
| Stripe Webhook | 100% | Any failure |

---

## 🔗 Link Utili

- [UptimeRobot Dashboard](https://uptimerobot.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Console](https://console.firebase.google.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Sentry Issues](https://sentry.io)

---

**Setup completato?** Aggiungi il link della status page nel footer del tuo sito per trasparenza! 🚀

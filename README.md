# 🍽️ PLACEAT - SaaS Gestione Ristoranti

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-39%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

**Placeat** è una piattaforma SaaS B2B per la gestione completa di ristoranti: prenotazioni, piantine interattive, raccolta recensioni automatizzata e analytics.

---

## 🚀 Funzionalità Principali

### Per i Ristoratori
- 📅 **Gestione Prenotazioni** - Calendario intuitivo con gestione tavoli
- 🗺️ **Piantina Interattiva** - Configurazione visiva della sala
- 📊 **Analytics Dashboard** - Metriche di occupazione, fatturato stimato, trend
- 🤖 **ReviewFlow** - Invio automatico richieste recensioni post-visita
- 💳 **Abbonamenti** - Piani Free, Pro (€29/mese) e Multi (€79/mese)
- 👥 **Gestione Team** - Multi-utente con ruoli (in sviluppo)

### Per gli Amministratori
- 🎛️ **Super Admin Dashboard** - Gestione completa piattaforma
- 📈 **Statistiche Globali** - MRR, crescita, conversioni
- 🏪 **Gestione Ristoranti** - CRUD completo, attivazione/sospensione

---

## 🛠️ Stack Tecnologico

| Tecnologia | Uso |
|------------|-----|
| **Next.js 15** | Framework React con App Router |
| **TypeScript** | Type safety |
| **Firebase** | Auth, Firestore, Storage |
| **Stripe** | Pagamenti e abbonamenti |
| **Resend** | Email transactional |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Componenti UI |
| **Recharts** | Grafici e visualizzazioni |
| **Sentry** | Error monitoring |

---

## 📋 Prerequisiti

- Node.js 18+
- Account Firebase
- Account Stripe
- Account Resend
- Account Sentry (opzionale ma consigliato)

---

## 🚀 Guida al Deployment

### 1. Clone e Installazione

```bash
git clone <repository-url>
cd placeat
npm install
```

### 2. Configurazione Environment

Copia il file `.env` e configura tutte le variabili:

```bash
cp .env .env.local
```

#### Firebase Configuration
```env
# Firebase Client (da Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (da Service Account)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

⚠️ **IMPORTANTE**: La chiave privata deve essere formattata correttamente:
- Con virgolette doppie
- Con `\n` al posto degli a capo reali
- Oppure salva su file e leggi con fs.readFileSync

#### Stripe Configuration
1. Vai su [Stripe Dashboard](https://dashboard.stripe.com)
2. Crea i prodotti e prezzi:
   - Piano Pro: €29/mese
   - Piano Multi: €79/mese
3. Ottieni le API keys
4. Configura il webhook endpoint: `https://tuodominio.com/api/stripe/webhook`
5. Seleziona eventi: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_MULTI=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://tuodominio.com
```

#### Email Configuration (Resend)
1. Registrati su [Resend](https://resend.com)
2. Verifica il tuo dominio
3. Ottieni API key

```env
RESEND_API_KEY=re_...
```

#### Sentry Configuration (Error Monitoring)
1. Crea progetto su [Sentry](https://sentry.io)
2. Ottieni DSN

```env
NEXT_PUBLIC_SENTRY_DSN=https://... sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=placeat
```

### 3. Configurazione Firebase Firestore

#### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

Oppure vai su Firebase Console > Firestore Database > Rules e incolla il contenuto di `firestore.rules`.

#### Creazione Super Admin

1. **Crea utente in Firebase Authentication:**
   - Vai su Firebase Console > Authentication > Users
   - Add user con email e password
   - Copia l'UID generato

2. **Crea documento admin in Firestore:**
   - Collection: `admins`
   - Document ID: [UID copiato sopra]
   - Dati:
   ```json
   {
     "email": "admin@tuoemail.com",
     "nome": "Mario",
     "cognome": "Rossi",
     "ruolo": "superadmin",
     "attivo": true,
     "createdAt": [timestamp server]
   }
   ```

3. **Accedi al pannello admin:**
   - Vai su `https://tuodominio.com/admin/login`
   - Inserisci le credenziali

### 4. Build e Deploy

#### Test Build Locale
```bash
npm run build
```

#### Deploy su Vercel (Consigliato)
```bash
npm i -g vercel
vercel --prod
```

#### Deploy su Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🧪 Testing

### Esegui tutti i test
```bash
npm test
```

### Esegui test in watch mode
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

### Test specifici Stripe
```bash
npm test -- --testPathPattern=stripe
```

---

## 📊 Monitoring

### Sentry (Error Tracking)
- Dashboard: https://sentry.io/organizations/your-org/projects/placeat/
- Alert configurati per errori critici
- Session replay disponibile

### Uptime Monitoring
Consigliamo [UptimeRobot](https://uptimerobot.com) (gratuito):
- Aggiungi monitor per `https://tuodominio.com`
- Intervallo: 5 minuti
- Alert via email/Slack

### Stripe Dashboard
- Monitora pagamenti: https://dashboard.stripe.com/payments
- Gestisci abbonamenti: https://dashboard.stripe.com/subscriptions
- Webhook logs: https://dashboard.stripe.com/webhooks

---

## 📁 Struttura del Progetto

```
placeat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Pannello admin
│   │   ├── api/                # API Routes
│   │   ├── dashboard/          # Dashboard ristoratore
│   │   ├── marketing/          # Landing pages
│   │   └── ristorante/         # Public booking pages
│   ├── components/
│   │   ├── analytics/          # Componenti analytics
│   │   ├── reviewflow/         # Componenti ReviewFlow
│   │   ├── stripe/             # Componenti pagamento
│   │   └── ui/                 # shadcn/ui components
│   ├── firebase/               # Firebase config & hooks
│   ├── lib/                    # Utilities
│   └── test/                   # Test utilities
├── docs/                       # Documentazione
├── firestore.rules             # Security rules
└── jest.config.ts              # Test configuration
```

---

## 🔒 Sicurezza

- ✅ **Rate Limiting** - 100 req/15min (general), 10 req/hour (email)
- ✅ **Security Headers** - XSS, CSRF, Content-Type protection
- ✅ **Firestore Rules** - Strict ownership model
- ✅ **Input Validation** - Zod schemas
- ✅ **API Authentication** - Firebase Auth verification

---

## 🆘 Troubleshooting

### Build fallisce con errore Firebase Admin
```
Failed to parse private key
```
**Soluzione**: Verifica che `FIREBASE_PRIVATE_KEY` sia formattato correttamente con `\n`.

### Webhook Stripe non funziona
**Checklist:**
- [ ] Webhook secret corretto in `.env`
- [ ] Endpoint URL raggiungibile pubblicamente
- [ ] Eventi selezionati corretti in Stripe Dashboard

### Email non inviate
**Checklist:**
- [ ] Dominio verificato su Resend
- [ ] API key corretta
- [ ] Indirizzo "from" usa dominio verificato

### Rate limit exceeded
- Verifica i limiti in `src/lib/rate-limit.ts`
- Per IP specifici, puoi aggiungere whitelist

---

## 📈 Roadmap

- [x] MVP Base
- [x] Stripe Payments
- [x] Email System
- [x] Analytics Dashboard
- [x] ReviewFlow Automation
- [x] SEO Optimization
- [ ] Mobile App (PWA)
- [ ] Multi-lingua
- [ ] Integrazione POS
- [ ] API Pubblica

---

## 📞 Supporto

- Email: support@placeat.app
- Admin: admin@placeat.app
- Documentazione: `/docs`

---

## 📄 Licenza

MIT License - Copyright (c) 2024 Placeat

---

<p align="center">Fatto con ❤️ per i ristoratori italiani</p>

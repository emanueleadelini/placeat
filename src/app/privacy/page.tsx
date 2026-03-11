import { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

export const metadata: Metadata = {
  title: 'Privacy Policy - Protezione dei Dati Personali',
  description:
    'Informativa sulla privacy di Placeat: scopri come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali in conformità con il GDPR.',
  keywords: [
    'privacy policy',
    'protezione dati',
    'GDPR',
    'cookie policy',
    'dati personali',
    'placeat privacy',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy - Protezione dei Dati Personali | Placeat',
    description:
      'Informativa sulla privacy di Placeat: scopri come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali.',
    url: `${SITE_URL}/privacy`,
  },
  twitter: {
    title: 'Privacy Policy - Protezione dei Dati Personali | Placeat',
    description: 'Informativa sulla privacy di Placeat: scopri come proteggiamo i tuoi dati.',
  },
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          ← Torna alla home
        </Link>
        
        <article>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-8">
            Ultimo aggiornamento: <time dateTime={new Date().toISOString()}>{lastUpdated}</time>
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduzione</h2>
              <p>
                Placeat (&quot;noi&quot;, &quot;nostro&quot;) si impegna a proteggere la privacy degli utenti. 
                Questa Privacy Policy spiega come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali 
                quando utilizzi la nostra piattaforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Titolare del Trattamento</h2>
              <p className="mb-2">
                Il titolare del trattamento dei dati è:
              </p>
              <address className="not-italic pl-4 border-l-2 border-primary/20">
                <strong>Placeat S.r.l.</strong><br />
                Via Example, 123<br />
                00100 Roma (RM)<br />
                Italia<br />
                Email: <a href="mailto:privacy@placeat.app" className="text-primary hover:underline">privacy@placeat.app</a>
              </address>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Dati che raccogliamo</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dati di registrazione:</strong> nome, email, numero di telefono</li>
                <li><strong>Dati del ristorante:</strong> nome, indirizzo, tipo di attività, coordinate geografiche</li>
                <li><strong>Dati di pagamento:</strong> gestiti da Stripe (non conserviamo dati della carta)</li>
                <li><strong>Dati di utilizzo:</strong> log di accesso, preferenze, prenotazioni, statistiche</li>
                <li><strong>Cookie e dati di tracciamento:</strong> vedi nostra Cookie Policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Base giuridica del trattamento</h2>
              <p className="mb-4">Trattiamo i tuoi dati personali sulla base delle seguenti basi giuridiche:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Esecuzione del contratto:</strong> per fornire i servizi richiesti</li>
                <li><strong>Consenso:</strong> per attività di marketing e cookie non essenziali</li>
                <li><strong>Obbligo legale:</strong> per adempiere agli obblighi fiscali e amministrativi</li>
                <li><strong>Legittimo interesse:</strong> per migliorare i nostri servizi e garantire la sicurezza</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Come utilizziamo i dati</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornire e mantenere il servizio</li>
                <li>Gestire le prenotazioni e comunicazioni con i clienti</li>
                <li>Elaborare i pagamenti</li>
                <li>Inviare notifiche e aggiornamenti</li>
                <li>Migliorare la piattaforma</li>
                <li>Prevenire frodi e abusi</li>
                <li>Adempiere agli obblighi legali</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Conservazione dei dati</h2>
              <p>
                I tuoi dati personali sono conservati per il tempo necessario a fornire i servizi richiesti 
                e in conformità con gli obblighi legali. I dati degli account inattivi vengono eliminati 
                dopo 24 mesi di inattività, salvo obblighi legali diversi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Condivisione dei dati</h2>
              <p className="mb-4">I tuoi dati possono essere condivisi con:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Fornitori di servizi:</strong> Stripe (pagamenti), Google (analytics), Firebase (hosting)</li>
                <li><strong>Autorità legali:</strong> quando richiesto dalla legge</li>
                <li><strong>Consulenti professionali:</strong> commercialisti, avvocati (solo se necessario)</li>
              </ul>
              <p className="mt-4">
                Non vendiamo né affittiamo i tuoi dati personali a terzi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. I tuoi diritti (GDPR)</h2>
              <p className="mb-4">Hai il diritto di:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accesso:</strong> richiedere una copia dei tuoi dati personali</li>
                <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
                <li><strong>Cancellazione:</strong> richiedere la cancellazione dei tuoi dati (&quot;diritto all&apos;oblio&quot;)</li>
                <li><strong>Limitazione:</strong> richiedere la limitazione del trattamento</li>
                <li><strong>Portabilità:</strong> ricevere i dati in formato strutturato</li>
                <li><strong>Opposizione:</strong> opporti al trattamento per motivi legittimi</li>
                <li><strong>Revoca del consenso:</strong> in qualsiasi momento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Sicurezza dei dati</h2>
              <p>
                Adottiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati personali 
                da accessi non autorizzati, alterazioni, divulgazione o distruzione. Utilizziamo crittografia 
                SSL/TLS, autenticazione a due fattori e backup regolari.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Trasferimenti internazionali</h2>
              <p>
                Alcuni dei nostri fornitori di servizi possono trovarsi al di fuori dello Spazio Economico Europeo (SEE). 
                In tali casi, garantiamo che siano rispettate le appropriate garanzie ai sensi del GDPR, 
                come le Clausole Contrattuali Standard della Commissione Europea.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Modifiche alla Privacy Policy</h2>
              <p>
                Ci riserviamo il diritto di aggiornare questa Privacy Policy in qualsiasi momento. 
                Le modifiche saranno pubblicate su questa pagina con la data di aggiornamento. 
                Ti invitiamo a consultare regolarmente questa pagina.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contatti</h2>
              <p>
                Per qualsiasi domanda sulla privacy o per esercitare i tuoi diritti, contattaci:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Email: <a href="mailto:privacy@placeat.app" className="text-primary hover:underline">privacy@placeat.app</a></li>
                <li>PEC: <a href="mailto:placeat@pec.it" className="text-primary hover:underline">placeat@pec.it</a></li>
              </ul>
              <p className="mt-4">
                Hai anche il diritto di presentare un reclamo all&apos;<strong>Autorità Garante per la Protezione dei Dati Personali</strong>.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}

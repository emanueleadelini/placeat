import { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://placeat.app';

export const metadata: Metadata = {
  title: 'Termini di Servizio - Condizioni di Utilizzo',
  description:
    'Termini e condizioni di utilizzo di Placeat. Leggi le regole per l\'uso della nostra piattaforma SaaS per ristoranti.',
  keywords: [
    'termini di servizio',
    'condizioni di utilizzo',
    'terms of service',
    'contratto',
    'placeat terms',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Termini di Servizio - Condizioni di Utilizzo | Placeat',
    description:
      'Termini e condizioni di utilizzo di Placeat. Leggi le regole per l\'uso della nostra piattaforma.',
    url: `${SITE_URL}/terms`,
  },
  twitter: {
    title: 'Termini di Servizio - Condizioni di Utilizzo | Placeat',
    description: 'Termini e condizioni di utilizzo di Placeat.',
  },
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-4">Termini di Servizio</h1>
          
          <p className="text-muted-foreground mb-8">
            Ultimo aggiornamento: <time dateTime={new Date().toISOString()}>{lastUpdated}</time>
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Accettazione dei Termini</h2>
              <p>
                Utilizzando Placeat (&quot;Servizio&quot;, &quot;Piattaforma&quot;), accetti questi Termini di Servizio 
                (&quot;Termini&quot;). Se non accetti questi termini, ti preghiamo di non utilizzare la piattaforma. 
                Questi Termini costituiscono un accordo legale tra te e Placeat S.r.l. (&quot;noi&quot;, &quot;nostro&quot;).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Definizioni</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>&quot;Utente&quot;</strong>: qualsiasi persona fisica o giuridica che utilizza il Servizio</li>
                <li><strong>&quot;Ristoratore&quot;</strong>: utente che gestisce un ristorante sulla piattaforma</li>
                <li><strong>&quot;Cliente Finale&quot;</strong>: cliente che effettua prenotazioni tramite il Servizio</li>
                <li><strong>&quot;Contenuti&quot;</strong>: dati, testi, immagini o altri materiali caricati dagli utenti</li>
                <li><strong>&quot;Piano&quot;</strong>: livello di abbonamento (Free, Pro, Multi)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Descrizione del Servizio</h2>
              <p className="mb-4">
                Placeat è una piattaforma SaaS per la gestione di ristoranti, che include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestione delle prenotazioni</li>
                <li>Creazione e modifica di piantine dei tavoli</li>
                <li>Raccolta e gestione delle recensioni</li>
                <li>Strumenti di comunicazione con i clienti</li>
                <li>Reportistica e analisi</li>
              </ul>
              <p className="mt-4">
                Ci riserviamo il diritto di modificare, sospendere o interrompere il Servizio 
                (o qualsiasi parte di esso) in qualsiasi momento, con o senza preavviso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Account e Registrazione</h2>
              <h3 className="text-lg font-medium mb-2">4.1 Requisiti</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Devi avere almeno 18 anni di età</li>
                <li>Devi fornire informazioni accurate, complete e aggiornate</li>
                <li>Sei responsabile della riservatezza delle tue credenziali di accesso</li>
                <li>Devi notificarci immediatamente qualsiasi uso non autorizzato del tuo account</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2 mt-4">4.2 Sicurezza dell&apos;Account</h3>
              <p>
                Sei responsabile di tutte le attività che avvengono sul tuo account. 
                Placeat non è responsabile per perdite derivanti da accessi non autorizzati al tuo account.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">4.3 Unicità dell&apos;Account</h3>
              <p>
                Un account può essere utilizzato solo dall&apos;utente registrato. 
                La condivisione delle credenziali è vietata.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Abbonamenti e Pagamenti</h2>
              <h3 className="text-lg font-medium mb-2">5.1 Piani Disponibili</h3>
              <p className="mb-4">
                Offriamo diversi piani di abbonamento con funzionalità e limiti diversi, 
                come descritto nella pagina <Link href="/marketing/pricing" className="text-primary hover:underline">Prezzi</Link>.
              </p>
              
              <h3 className="text-lg font-medium mb-2">5.2 Gestione Pagamenti</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>I pagamenti sono gestiti tramite Stripe</li>
                <li>Gli abbonamenti si rinnovano automaticamente al termine del periodo</li>
                <li>Puoi cancellare l&apos;abbonamento in qualsiasi momento</li>
                <li>Non rimborsiamo i periodi di abbonamento già iniziati</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2 mt-4">5.3 Trial Gratuito</h3>
              <p>
                Ogni nuovo account può beneficiare di 14 giorni di prova gratuita del piano Pro. 
                Al termine del periodo di prova, l&apos;account verrà automaticamente convertito al piano Free 
                salvo sottoscrizione di un abbonamento a pagamento.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">5.4 Rimborso</h3>
              <p>
                Offriamo una garanzia &quot;soddisfatti o rimborsati&quot; entro 30 giorni dalla prima sottoscrizione 
                di un piano a pagamento. Contattaci per richiedere il rimborso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Contenuti e Proprietà Intellettuale</h2>
              <h3 className="text-lg font-medium mb-2">6.1 I tuoi Contenuti</h3>
              <p>
                Mantieni la proprietà dei contenuti che carichi sulla piattaforma. 
                Concedi a Placeat una licenza non esclusiva per utilizzare i tuoi contenuti 
                al solo scopo di fornire il Servizio.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">6.2 Proprietà Intellettuale di Placeat</h3>
              <p>
                Tutti i diritti di proprietà intellettuale relativi al Servizio sono di proprietà di Placeat. 
                Non puoi copiare, modificare, distribuire, vendere o noleggiare alcuna parte del nostro Servizio 
                senza il nostro permesso scritto.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Condotta Proibita</h2>
              <p className="mb-4">È vietato:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizzare il Servizio per scopi illegali o non autorizzati</li>
                <li>Caricare contenuti illeciti, offensivi o diffamatori</li>
                <li>Tentare di accedere ad aree riservate del sistema</li>
                <li>Interferire con il funzionamento del Servizio</li>
                <li>Raccogliere dati di altri utenti senza consenso</li>
                <li>Utilizzare il Servizio per inviare spam</li>
                <li>Circumvenire le misure di sicurezza</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Sospensione e Terminazione</h2>
              <p className="mb-4">
                Possiamo sospendere o terminare il tuo accesso al Servizio in caso di:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violazione di questi Termini</li>
                <li>Comportamento fraudolento o abusivo</li>
                <li>Mancato pagamento degli abbonamenti dovuti</li>
                <li>Richiesta delle autorità competenti</li>
              </ul>
              <p className="mt-4">
                Puoi terminare il tuo account in qualsiasi momento dalle impostazioni del profilo. 
                I tuoi dati saranno conservati per il periodo richiesto dalla legge.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitazione di Responsabilità</h2>
              <p className="mb-4">
                Nella misura massima consentita dalla legge applicabile:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Il Servizio è fornito &quot;così com&apos;è&quot; senza garanzie di alcun tipo</li>
                <li>Non garantiamo che il Servizio sia ininterrotto o privo di errori</li>
                <li>Non siamo responsabili per perdite di profitti, dati o opportunità commerciali</li>
                <li>La nostra responsabilità totale è limitata all&apos;importo pagato negli ultimi 12 mesi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Indennizzo</h2>
              <p>
                Accetti di difendere, indennizzare e tenere indenne Placeat e i suoi dipendenti 
                da qualsiasi reclamo, danno, obbligo, perdita, responsabilità, costo o debito 
                derivante da: (i) il tuo uso del Servizio; (ii) la tua violazione di questi Termini; 
                (iii) la tua violazione dei diritti di terzi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Legge Applicabile e Foro</h2>
              <p>
                Questi Termini sono regolati dalla legge italiana. Qualsiasi controversia 
                derivante da o in connessione con questi Termini sarà soggetta alla giurisdizione 
                esclusiva del Foro di Roma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Modifiche ai Termini</h2>
              <p>
                Ci riserviamo il diritto di modificare questi Termini in qualsiasi momento. 
                Le modifiche entreranno in vigore 30 giorni dopo la pubblicazione. 
                L&apos;uso continuato del Servizio dopo tali modifiche costituirà accettazione dei nuovi Termini.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Disposizioni Generali</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Invalidità parziale:</strong> Se una disposizione è invalida, le altre restano valide</li>
                <li><strong>Rinuncia:</strong> La mancata applicazione di un diritto non costituisce rinuncia</li>
                <li><strong>Cessione:</strong> Non puoi cedere questi Termini senza il nostro consenso</li>
                <li><strong>Contratto completo:</strong> Questi Termini costituiscono l&apos;intero accordo tra le parti</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contatti</h2>
              <p>
                Per domande sui Termini di Servizio:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Email: <a href="mailto:legal@placeat.app" className="text-primary hover:underline">legal@placeat.app</a></li>
                <li>PEC: <a href="mailto:placeat@pec.it" className="text-primary hover:underline">placeat@pec.it</a></li>
                <li>Indirizzo: Via Example, 123 - 00100 Roma (RM), Italia</li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}

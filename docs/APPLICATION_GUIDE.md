
# Guida all'Applicazione PLACEAT

## 1. Introduzione

PLACEAT è una piattaforma SaaS (Software-as-a-Service) B2B progettata per i ristoranti. Semplifica la gestione delle prenotazioni e la raccolta di recensioni attraverso due funzionalità principali:

1.  **Editor di Piantine Interattive**: Permette ai ristoratori di creare una replica digitale del proprio locale, posizionando tavoli, muri e zone.
2.  **Sistema di Prenotazione Pubblico**: Utilizza la piantina creata per offrire ai clienti finali un'esperienza di prenotazione visiva e interattiva.
3.  **Automazione della Raccolta Recensioni (ReviewFlow)**: Invia richieste di recensione intelligenti e automatiche ai clienti dopo la loro visita.

Questo documento fornisce una spiegazione tecnica completa dell'architettura e del codice dell'applicazione.

## 2. Tech Stack

L'applicazione è costruita utilizzando un moderno stack tecnologico basato su JavaScript/TypeScript:

-   **Frontend Framework**: [Next.js](https://nextjs.org/) con App Router
-   **Libreria UI**: [React](https://react.dev/)
-   **Componenti UI**: [ShadCN/UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore per il database, Authentication per la gestione utenti)
-   **Funzionalità AI**: [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
-   **Linguaggio**: [TypeScript](https://www.typescriptlang.org/)

## 3. Struttura del Progetto

La codebase è organizzata in modo modulare per favorire la manutenibilità e la scalabilità.

```
/
├── src/
│   ├── app/                # Pagine e routing (Next.js App Router)
│   │   ├── dashboard/      # Layout e pagine dell'area riservata
│   │   ├── ristorante/     # Pagina di prenotazione pubblica
│   │   ├── (auth)/         # Pagine di login, signup, onboarding
│   │   ├── layout.tsx      # Layout principale dell'app
│   │   └── page.tsx        # Landing page
│   │
│   ├── components/         # Componenti React riutilizzabili
│   │   ├── ui/             # Componenti base di ShadCN (Button, Card, etc.)
│   │   ├── floor-plan-editor/ # L'editor della piantina
│   │   └── public-booking-page.tsx # Componente principale della pagina pubblica
│   │
│   ├── firebase/           # Configurazione e hooks per Firebase
│   │   ├── firestore/      # Hooks per interagire con Firestore (useCollection, useDoc)
│   │   ├── index.ts        # Punto di ingresso per l'inizializzazione e l'export
│   │   └── provider.tsx    # Provider React per Firebase
│   │
│   ├── lib/                # Funzioni utility, tipi e dati statici
│   │   ├── types.ts        # Definizioni dei tipi TypeScript (Ristorante, Tavolo, etc.)
│   │   └── utils.ts        # Funzioni di utilità generiche (es. cn per classi CSS)
│   │
│   └── ai/                 # Logica per l'intelligenza artificiale con Genkit
│       ├── flows/          # Flussi AI per task specifici
│       └── genkit.ts       # Configurazione di Genkit
│
├── docs/
│   ├── backend.json        # Schema e struttura del database Firestore
│   └── APPLICATION_GUIDE.md # Questo documento
│
└── firestore.rules         # Regole di sicurezza per il database Firestore
```

## 4. Funzionalità e Flussi Principali

### 4.1. Autenticazione e Onboarding

-   **Flusso di Registrazione**: L'utente si registra tramite email e password (`/signup`). Al successo, viene reindirizzato all'onboarding.
-   **Flusso di Accesso**: L'utente accede con le sue credenziali (`/login`). Al successo, viene reindirizzato alla dashboard.
-   **Onboarding (`/onboarding`)**: Un processo guidato in 5 passaggi dove il ristoratore inserisce i dati base del locale, definisce gli orari, crea una prima versione della piantina e configura il ReviewFlow. Questo processo è cruciale perché è qui che viene creato il documento `Ristorante` su Firestore.
-   **Gestione Stato Utente**: L'hook `useUser()` (da `src/firebase/provider.tsx`) fornisce lo stato di autenticazione in tutta l'app, permettendo di proteggere le rotte e personalizzare l'interfaccia.

### 4.2. Dashboard Ristoratore (`/dashboard`)

È l'area riservata dove il ristoratore gestisce ogni aspetto del suo locale.

-   **Layout (`/dashboard/layout.tsx`)**: Un layout persistente con una barra laterale di navigazione che dà accesso a tutte le sezioni principali: Prenotazioni, Piantina, Recensioni, Impostazioni.
-   **Gestione Piantina (`/dashboard/floor-plan`)**: Questa è la sezione che ospita il componente `<FloorPlanEditor />`.
    -   **Componente Editor (`src/components/floor-plan-editor/editor.tsx`)**: È il cuore della funzionalità di disegno. Utilizza SVG per renderizzare la piantina.
        -   **Strumenti**: Permette di disegnare forme (rettangoli, cerchi, poligoni a mano libera), muri e di aggiungere tavoli.
        -   **Interattività**: Gestisce lo spostamento, la rotazione e il ridimensionamento degli oggetti.
        -   **Pannello Proprietà**: Un pannello contestuale sulla destra permette di modificare i dettagli dell'elemento selezionato (es. nome della zona, numero e capienza del tavolo).
        -   **Logica di "Fusione"**: Le aree con lo stesso `nome` vengono considerate parte della stessa zona logica.
        -   **Pubblicazione**: Il pulsante "Pubblica Piantina" esegue una `writeBatch` su Firestore: cancella i dati vecchi della piantina (tavoli, muri, zone) e salva quelli nuovi in un'unica operazione atomica, garantendo la consistenza dei dati.

### 4.3. Pagina di Prenotazione Pubblica (`/ristorante/[ristoranteId]`)

È la pagina che il cliente finale visita per prenotare un tavolo.

-   **Caricamento Dati (`page.tsx`)**: La pagina recupera i dati del ristorante specifico (inclusi tavoli, muri, zone) da Firestore in base all'ID nell'URL.
-   **Componente di Prenotazione (`public-booking-page.tsx`)**:
    -   **Modulo di Ricerca**: L'utente seleziona data, ora e numero di persone.
    -   **Verifica Disponibilità**: Cliccando "Verifica Disponibilità", il sistema esegue una query su Firestore per trovare le prenotazioni esistenti in quella data. Confronta i tavoli prenotati con quelli adatti alla richiesta dell'utente (per capienza).
    -   **Feedback Visivo**: La piantina viene aggiornata visivamente. I tavoli non disponibili diventano semi-trasparenti e non cliccabili. Quelli disponibili restano attivi.
    -   **Selezione e Conferma**: L'utente clicca su un tavolo disponibile, che viene evidenziato. Compare un modulo finale per inserire nome e telefono. Cliccando "Conferma Prenotazione", viene creato un nuovo documento `Prenotazione` su Firestore.

### 4.4. Landing Page (`/app/page.tsx`)

La pagina principale dell'applicazione, che funge da vetrina.

-   **Sezione Ristoranti**: Mostra una lista di ristoranti iscritti, recuperati da Firestore.
-   **Ricerca**: Una barra di ricerca permette di filtrare i ristoranti mostrati in tempo reale, lato client.
-   **Navigazione**: Cliccando su una scheda ristorante, l'utente viene reindirizzato alla pagina di prenotazione pubblica di quel locale.

## 5. Backend e Dati (Firebase)

### 5.1. Modello Dati (`docs/backend.json`)

Questo file funge da "schema" per il nostro database Firestore. Definisce le entità principali:

-   **Ristorante**: Contiene tutte le informazioni sul locale (nome, indirizzo, tipo, UID del proprietario, dettagli dell'abbonamento, etc.).
-   **Tavolo**: Rappresenta un singolo tavolo (numero, capienza, posizione, rotazione, zona di appartenenza). È in una sub-collezione di `Ristorante`.
-   **Zona**: Definisce un'area della piantina (nome, colore, percorso dei punti). È in una sub-collezione di `Ristorante`.
-   **Muro**: Definisce un muro. È in una sub-collezione di `Ristorante`.
-   **Prenotazione**: Contiene i dettagli di una prenotazione (cliente, data, ora, tavolo assegnato). È in una sub-collezione di `Ristorante`.
-   Altre entità di supporto come `Customer`, `DailyOpeningHours`, etc.

### 5.2. Regole di Sicurezza (`firestore.rules`)

Queste regole definiscono chi può leggere e scrivere i dati. La filosofia è:

-   **Proprietà Stretta**: Le operazioni di scrittura (creazione, modifica, cancellazione) sui dati di un ristorante e sulle sue sub-collezioni sono permesse solo al proprietario (verificando `request.auth.uid == resource.data.proprietarioUid`).
-   **Lettura Pubblica Controllata**: La lettura di dati necessari alla prenotazione (dettagli del ristorante, tavoli, piantina, prenotazioni esistenti) è pubblica per permettere il funzionamento delle pagine di prenotazione. La scrittura delle prenotazioni è permessa a chiunque, ma con validazioni sui dati inviati.
-   **Lettura Lista Ristoranti**: La lista dei ristoranti è pubblica per alimentare la sezione sulla landing page.

### 5.3. Integrazione con il Frontend

-   **Provider (`src/firebase/provider.tsx`)**: Il `FirebaseProvider` inizializza Firebase e usa il Context di React per rendere disponibili le istanze di `auth` e `firestore`, oltre allo stato dell'utente, a tutti i componenti figli.
-   **Hooks Personalizzati**:
    -   `useUser()`: Fornisce l'oggetto `user` autenticato.
    -   `useFirestore()`: Fornisce l'istanza di Firestore.
    -   `useCollection()` e `useDoc()`: Hooks per sottoscrivere in tempo reale a collezioni o documenti, gestendo automaticamente loading, dati ed errori. È cruciale che le query passate a questi hooks siano memoizzate con `useMemo` per evitare loop infiniti.

## 6. Conclusioni

Questa guida fornisce una base solida per comprendere il funzionamento dell'applicazione PLACEAT. L'architettura è progettata per essere scalabile, con una chiara separazione tra l'interfaccia utente, la gestione dello stato e l'interazione con il backend. Ogni componente è stato pensato per essere il più possibile autonomo e riutilizzabile.

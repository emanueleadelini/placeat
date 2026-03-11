# Setup Super Admin

## Istruzioni per configurare il Super Admin

### 1. Crea l'utente in Firebase Authentication

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il tuo progetto
3. Vai su **Authentication** > **Users**
4. Clicca su **Add user**
5. Inserisci:
   - Email: `emanueleadelini@gmail.com`
   - Password: `Angela25!`
6. Clicca **Add user**
7. Copia l'**UID** dell'utente creato (sarà qualcosa come: `abc123def456...`)

### 2. Crea il documento Admin in Firestore

1. Vai su **Firestore Database**
2. Clicca su **Start collection**
3. Nome collezione: `admins`
4. Document ID: incolla l'UID copiato sopra
5. Aggiungi i seguenti campi:

```json
{
  "email": "emanueleadelini@gmail.com",
  "nome": "Emanuele",
  "cognome": "Adelini",
  "ruolo": "superadmin",
  "attivo": true,
  "createdAt": (timestamp - usa server timestamp)
}
```

### 3. Accedi al pannello Admin

1. Vai su: `https://tuodominio.com/admin/login`
2. Inserisci le credenziali:
   - Email: `emanueleadelini@gmail.com`
   - Password: `Angela25!`
3. Verrai reindirizzato alla dashboard admin

## Funzionalità Admin

### Dashboard
- Statistiche globali della piattaforma
- MRR (Monthly Recurring Revenue)
- Numero di ristoranti attivi/trial
- Crescita nel tempo

### Gestione Ristoranti
- Lista di tutti i ristoranti
- Ricerca per nome/email/indirizzo
- Modifica stato (attivo/sospeso/cancellato)
- Eliminazione definitiva

### Gestione Admin
- Aggiungi altri admin/support
- Gestisci permessi (superadmin/admin/support)
- Attiva/disattiva account

### Prenotazioni
- Visualizza tutte le prenotazioni di tutti i ristoranti
- Filtri e ricerca
- Statistiche per stato

## Sicurezza

Le regole Firestore sono configurate per:
- ✅ Permettere l'accesso completo agli admin
- ✅ Bloccare accesso non autorizzato
- ✅ Verificare il ruolo admin nella collezione `admins`

## Ruoli disponibili

- **superadmin**: Accesso completo, può gestire altri admin
- **admin**: Accesso completo ai dati, ma non può gestire altri admin
- **support**: Accesso in lettura, può visualizzare ma non modificare dati sensibili

## Note

- I dati degli admin sono protetti e accessibili solo ad altri admin
- Ogni azione di modifica/eliminazione è tracciata nei log
- In produzione, considera l'aggiunta di audit logging

// Script per inizializzare il primo super admin
// Esegui: node scripts/init-superadmin.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  // Inserisci qui la tua configurazione Firebase
  // La trovi in: Firebase Console > Impostazioni progetto > App
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SUPER_ADMIN_EMAIL = 'emanueleadelini@gmail.com';

async function initSuperAdmin() {
  try {
    // Crea il documento admin (l'UID verrà ottenuto dopo il primo login)
    // In alternativa, puoi creare l'utente via Firebase Console e poi aggiungere il documento
    
    const adminData = {
      email: SUPER_ADMIN_EMAIL,
      nome: 'Emanuele',
      cognome: 'Adelini',
      ruolo: 'superadmin',
      attivo: true,
      createdAt: new Date(),
    };

    console.log('Inizializzazione Super Admin...');
    console.log('Email:', SUPER_ADMIN_EMAIL);
    console.log('');
    console.log('IMPORTANTE: Devi anche:');
    console.log('1. Creare un utente con questa email in Firebase Authentication');
    console.log('2. Ottenere l\'UID dell\'utente');
    console.log('3. Creare un documento in /admins/{UID} con i dati sopra');
    console.log('');
    console.log('Dati da inserire:');
    console.log(JSON.stringify(adminData, null, 2));
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

initSuperAdmin();

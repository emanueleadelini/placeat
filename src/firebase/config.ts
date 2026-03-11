import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  "projectId": "studio-5252657656-b7ce3",
  "appId": "1:548783751049:web:fb753e8b0517e065b42b58",
  "apiKey": "AIzaSyAjIYQMSjxEtCpbRbeD54z8yxcKaKgPNfE",
  "authDomain": "studio-5252657656-b7ce3.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "548783751049"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);

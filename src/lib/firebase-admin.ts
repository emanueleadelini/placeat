import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseAdmin: App;
let adminDb: ReturnType<typeof getFirestore>;

/**
 * Parse Firebase private key from environment variable
 * Handles various formats including double-escaped newlines and surrounding quotes
 */
function parsePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  let parsed = key
    // Remove surrounding quotes if present (common in .env files)
    .replace(/^"+/, '')
    .replace(/"+$/, '')
    .replace(/^'+/, '')
    .replace(/'+$/, '')
    // Handle double-escaped newlines (\\n) that might occur from double parsing
    .replace(/\\\\n/g, '\n')
    // Handle single-escaped newlines (\n) that are common in env files
    .replace(/\\n/g, '\n')
    // Remove double newlines that might occur
    .replace(/\n\n/g, '\n')
    .trim();
  
  return parsed;
}

/**
 * Check if the private key is a placeholder/invalid value
 */
function isValidPrivateKey(key: string): boolean {
  // Must have PEM headers
  if (!key.includes('BEGIN PRIVATE KEY') || !key.includes('END PRIVATE KEY')) {
    return false;
  }
  
  // Must not be a placeholder
  const placeholderPatterns = [
    'your private key here',
    'your-private-key-here',
    'your_private_key_here',
    'placeholder',
    'xxx',
    '***',
  ];
  
  const lowerKey = key.toLowerCase();
  return !placeholderPatterns.some(pattern => lowerKey.includes(pattern));
}

// Only initialize if we have the required credentials
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    if (!privateKey) {
      console.warn('Firebase Admin: Private key is empty after parsing, using mock');
      firebaseAdmin = {} as App;
      adminDb = {} as any;
    } else if (!isValidPrivateKey(privateKey)) {
      console.warn('Firebase Admin: Private key appears to be a placeholder, using mock');
      firebaseAdmin = {} as App;
      adminDb = {} as any;
    } else {
      const firebaseAdminConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'studio-5252657656-b7ce3',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      };

      firebaseAdmin = getApps().length === 0 
        ? initializeApp({
            credential: cert(firebaseAdminConfig),
          })
        : getApps()[0];

      adminDb = getFirestore(firebaseAdmin);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Provide mock during build
    firebaseAdmin = {} as App;
    adminDb = {} as any;
  }
} else {
  // Mock for build time
  console.warn('Firebase Admin credentials not found, using mock');
  firebaseAdmin = {} as App;
  adminDb = {} as any;
}

export { firebaseAdmin, adminDb };

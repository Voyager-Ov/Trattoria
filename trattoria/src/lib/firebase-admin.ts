import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK for server-side operations
 * Used for:
 * - Verifying ID tokens from client
 * - Creating session cookies
 * - Verifying session cookies
 * - Managing user claims
 */

let app: App | undefined;
let auth: Auth | undefined;

if (!getApps().length) {
  try {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    auth = getAuth(app);
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export const adminAuth = auth as Auth;
export const adminApp = app as App;

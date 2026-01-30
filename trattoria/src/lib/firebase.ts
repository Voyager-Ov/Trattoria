import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase Client SDK for browser-side operations
 * Used for:
 * - Email/password authentication
 * - Google OAuth
 * - Getting ID tokens to send to backend
 */

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} else {
    app = getApps()[0];
    auth = getAuth(app);
}

export { auth };
export const googleProvider = new GoogleAuthProvider();

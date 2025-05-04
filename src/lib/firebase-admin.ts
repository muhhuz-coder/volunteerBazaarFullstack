// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// IMPORTANT: This setup requires you to have a service account key file
// and set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// Download the key file from your Firebase project settings > Service accounts.
// Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"

// Ensure the app is only initialized once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // Add databaseURL if using Realtime Database:
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
    // Throwing error might be preferable in production to halt if admin SDK fails
    // throw new Error('Firebase Admin SDK failed to initialize.');
  }
}

const auth = admin.auth();
const firestoreAdmin = admin.firestore(); // Use this for server-side Firestore access if needed

export { auth, firestoreAdmin, admin };

// Note: Using the Admin SDK in middleware or API routes means these parts run on the server,
// not in the browser. Environment variables like GOOGLE_APPLICATION_CREDENTIALS must be
// available in the server environment where your Next.js app is hosted/built.

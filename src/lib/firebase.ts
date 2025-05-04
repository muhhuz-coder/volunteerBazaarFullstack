// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// ---- TROUBLESHOOTING: `auth/api-key-not-valid` Error ----
// If you are seeing an error like "Firebase: Error (auth/api-key-not-valid)",
// it means the `apiKey` provided in `firebaseConfig` is incorrect or missing.
//
// 1.  **Check your `.env.local` file:** Ensure you have a `.env.local` file
//     in the root directory of your project (next to `package.json`).
// 2.  **Verify `NEXT_PUBLIC_FIREBASE_API_KEY`:** Make sure the `.env.local`
//     file contains a line like:
//     `NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY`
//     Replace `YOUR_ACTUAL_API_KEY` with the key from your Firebase project settings
//     (Project settings > General > Your apps > Web app > SDK setup and configuration > Config).
// 3.  **Restart your Next.js development server:** After creating or modifying
//     `.env.local`, you MUST restart the server (`npm run dev` or similar)
//     for the changes to take effect.
// 4.  **Firebase Project Settings:** Double-check that the API key in your
//     Firebase project settings is correct and that the correct project is being used.
//
// Ensure all other `NEXT_PUBLIC_FIREBASE_...` variables are also correctly set.
// ---------------------------------------------------------

// Initialize Firebase
let app;
if (!getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
    } catch (error: any) {
        console.error("Firebase initialization error:", error);
        // Prevent further errors by not initializing auth/db if config is bad
        throw new Error("Failed to initialize Firebase. Check your configuration and environment variables.");
    }
} else {
    app = getApp();
    console.log("Firebase app already initialized.");
}

// Initialize Auth and Firestore only if Firebase app was successfully initialized
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

// Environment variables needed in .env.local (create this file if it doesn't exist)
// NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
// NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID (Optional)

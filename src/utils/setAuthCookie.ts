// src/utils/setAuthCookie.ts
import { User } from 'firebase/auth';

/**
 * Sets the Firebase ID token as an HTTP cookie.
 * This should be called on the client-side after successful login or signup.
 * The middleware will then read this cookie for server-side authentication checks.
 *
 * @param user The Firebase user object containing the ID token.
 */
export const setAuthCookie = async (user: User): Promise<void> => {
  if (!user) {
    // Handle logout: Clear the cookie by setting maxAge to -1
    document.cookie = 'firebaseIdToken=; path=/; max-age=-1; SameSite=Lax'; // Add Secure in production
    return;
  }

  try {
    const idToken = await user.getIdToken(true); // Force refresh the token
    const maxAge = 60 * 60 * 24 * 5; // 5 days, adjust as needed

    // Set the cookie
    // In production, add 'Secure;' attribute: SameSite=Lax; Secure;
    document.cookie = `firebaseIdToken=${idToken}; path=/; max-age=${maxAge}; SameSite=Lax`;

    console.log('Auth cookie set.'); // For debugging
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    // Optionally handle the error, e.g., show a message to the user
  }
};

/**
 * Clears the Firebase ID token cookie.
 * Call this on the client-side during logout.
 */
export const clearAuthCookie = (): void => {
  document.cookie = 'firebaseIdToken=; path=/; max-age=-1; SameSite=Lax'; // Add Secure in production
  console.log('Auth cookie cleared.'); // For debugging
};

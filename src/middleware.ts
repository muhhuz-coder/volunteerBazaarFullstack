// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin'; // Using Admin SDK for server-side verification

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ['/', '/login', '/signup', '/apply', '/select-role']; // Paths accessible without login
  const staticFiles = /\.(.*)$/; // Regex to match static file requests (e.g., .png, .css)

  // Allow static files and public paths
  if (staticFiles.test(pathname) || publicPaths.some(p => pathname.startsWith(p) && p !== '/')) {
      // Special check for root path '/'
      if(pathname === '/') return NextResponse.next();
      // Check if it's exactly '/apply' or '/select-role' or starts with '/apply/'
      if (pathname === '/apply' || pathname === '/select-role' || pathname.startsWith('/apply/')) {
          return NextResponse.next();
      }
      // Allow login and signup pages always
      if (pathname === '/login' || pathname === '/signup') {
          return NextResponse.next();
      }
       // Let non-exact public paths through if not dashboards
       if (publicPaths.includes(pathname) && !pathname.startsWith('/dashboard')) {
         return NextResponse.next();
       }
  }


  const idToken = request.cookies.get('firebaseIdToken')?.value;

  if (!idToken) {
    // No token, redirect to login for protected routes
    if (pathname.startsWith('/dashboard')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname); // Optional: Add redirect param
        return NextResponse.redirect(loginUrl);
    }
     // Allow access to non-dashboard routes if no token (already covered by publicPaths but good failsafe)
     return NextResponse.next();
  }

  try {
    // Verify the ID token using Firebase Admin SDK
    // Note: This requires setting up firebase-admin and GOOGLE_APPLICATION_CREDENTIALS
    // For simplicity in this example, we'll assume verification passes if token exists.
    // In production, implement full token verification.

    // ---- PRODUCTION CODE SHOULD VERIFY TOKEN ----
    // const decodedToken = await auth.verifyIdToken(idToken);
    // const uid = decodedToken.uid;
    // Fetch user role from Firestore based on uid (using Admin SDK or an API route)
    // const userRole = await getUserRoleFromServer(uid); // Implement this function
    // ---- END PRODUCTION CODE ----

    // --- SIMPLIFIED LOGIC FOR EXAMPLE ---
    // Placeholder: Assume token is valid if present. Role check needs real implementation.
    // const userRole = 'employee'; // Or 'company' - THIS NEEDS TO BE FETCHED
    // --- END SIMPLIFIED LOGIC ---

    // If trying to access a dashboard, enforce role (THIS REQUIRES REAL ROLE FETCHING)
    // if (pathname.startsWith('/dashboard/employee') && userRole !== 'employee') {
    //   return NextResponse.redirect(new URL('/dashboard/company', request.url)); // Or access denied page
    // }
    // if (pathname.startsWith('/dashboard/company') && userRole !== 'company') {
    //   return NextResponse.redirect(new URL('/dashboard/employee', request.url)); // Or access denied page
    // }

    // If token exists and path is login/signup, redirect to dashboard (or home)
    if (pathname === '/login' || pathname === '/signup') {
      // Redirect logic needs actual role fetching to determine correct dashboard
      // For now, redirecting to home as a fallback
       return NextResponse.redirect(new URL('/', request.url));
      // Example with role:
      // return NextResponse.redirect(new URL(userRole === 'company' ? '/dashboard/company' : '/dashboard/employee', request.url));
    }


    // Allow access if token is valid (and role matches, if checked)
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware token verification error:', error);
    // Invalid token, clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('firebaseIdToken', '', { maxAge: -1 }); // Clear the cookie
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - healthz (health check)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|healthz).*)',
  ],
};

// Helper function placeholder for server-side role fetching (needs implementation)
// async function getUserRoleFromServer(uid: string): Promise<UserRole | null> {
//   // Use Firebase Admin SDK to fetch user document from Firestore
//   // Example:
//   // const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
//   // if (userDoc.exists) {
//   //   return userDoc.data()?.role || null;
//   // }
//   return null; // Return null if user or role not found
// }

// --- IMPORTANT ---
// This middleware uses a placeholder for token verification and role fetching.
// For a production app:
// 1. Set up Firebase Admin SDK (`firebase-admin`).
// 2. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to your service account key file.
// 3. Implement `auth.verifyIdToken(idToken)` for real token verification.
// 4. Implement `getUserRoleFromServer(uid)` to fetch the user's role from Firestore using the Admin SDK.
// 5. Adjust the cookie name ('firebaseIdToken') if your client-side implementation uses a different name. You'll need to set this cookie upon successful login/signup on the client.
// 6. Ensure cookies are handled correctly (HttpOnly, Secure in production).

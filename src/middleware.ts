// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: With simple mock auth, middleware has limited capability
// It cannot reliably check session state stored client-side (e.g., in AuthContext)
// or in localStorage without more complex token passing (like using cookies,
// which our simple context doesn't do).

// This simplified middleware primarily prevents unauthenticated access to dashboard routes
// based *only* on the URL path, not actual login state. The client-side checks in
// dashboard pages are now the main gatekeepers.

// This middleware primarily protects unauthenticated access to dashboard routes
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Updated protected paths, including admin
  const protectedPaths = ['/dashboard/volunteer', '/dashboard/organization', '/select-role', '/admin'];
  // Updated public paths (apply route structure might change)
  const publicPaths = ['/', '/login', '/signup', '/apply', '/forgot-password']; // Added forgot-password
  const staticFiles = /\.(.*)$/; // Regex to match static file requests

  // Allow static files and API routes
  if (staticFiles.test(pathname) || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow explicitly public paths and the root
   // Adjusted the check for apply routes potentially having IDs
   if (pathname === '/' || publicPaths.some(p => pathname.startsWith(p))) {
     // Exception: if trying to access /login or /signup while theoretically logged in
     // (middleware can't know for sure), the page component should handle redirection.
     return NextResponse.next();
   }

  // --- Limited Protected Route Check ---
  // This check is very basic. It assumes if someone is trying to access a dashboard or admin area,
  // they *should* be logged in with the correct role.
  // It CANNOT verify *if* they are actually logged in or have the correct role with this simple setup.
  const isAccessingProtectedPath = protectedPaths.some(p => pathname.startsWith(p));

  if (isAccessingProtectedPath) {
    // In a real app with server-readable sessions (e.g., cookies managed by AuthContext),
    // you would check the session here. Since we can't, we rely on client-side checks.
    // This middleware layer becomes less effective for auth *enforcement* in this simple model.
    // console.log(`Middleware: Accessing protected path ${pathname}. Relying on client-side auth check.`);
  }

  // Redirect if trying to access /admin without being an admin (very basic check, real check client-side)
  // This middleware logic is mostly a placeholder for more robust server-side auth.
  // The actual enforcement will primarily happen in the AuthContext on the client-side.
  if (pathname.startsWith('/admin')) {
    // console.log("Middleware: Attempting to access /admin. Client-side check will determine access.");
    // We can't check role here, so allow through and let client-side redirect.
  }


  // Allow all other requests by default; client-side logic handles auth.
  return NextResponse.next();

}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - healthz (health check)
     * - api (API routes - assuming you might add some later)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|healthz).*)',
  ],
};

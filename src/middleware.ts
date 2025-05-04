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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Updated protected paths
  const protectedPaths = ['/dashboard/volunteer', '/dashboard/organization', '/select-role'];
  // Updated public paths (apply route structure might change)
  const publicPaths = ['/', '/login', '/signup', '/apply'];
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
  // This check is very basic. It assumes if someone is trying to access a dashboard,
  // they *should* be logged in. If not, redirect to login.
  // It CANNOT verify *if* they are actually logged in with this simple setup.
  const isAccessingProtectedPath = protectedPaths.some(p => pathname.startsWith(p));

  if (isAccessingProtectedPath) {
    // In a real app with server-readable sessions (e.g., cookies managed by AuthContext),
    // you would check the session here. Since we can't, we rely on client-side checks.
    // This middleware layer becomes less effective for auth *enforcement* in this simple model.
    // We could potentially add a dummy cookie on login and check for it, but it's insecure.
    // console.log(`Middleware: Accessing protected path ${pathname}. Relying on client-side auth check.`);
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

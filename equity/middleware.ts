import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/verify-email',
  '/api/register',
  '/api/verify-email',
];

// Admin-only routes
const adminRoutes = [
  '/admin',
];

// Create the auth middleware
const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Check if user is trying to access admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!token || token.role !== "admin") {
        // Return 403 Forbidden instead of redirecting
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // For authenticated users, allow access
    if (token) {
      return NextResponse.next();
    }

    // For unauthenticated users on protected routes
    // Return 401 Unauthorized for API routes, redirect for pages
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Redirect to login for page routes
    return NextResponse.redirect(new URL("/login", req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Require token for protected routes
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Main middleware function
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes and API auth routes to pass through without auth check
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // For all other routes, use the auth middleware
  return authMiddleware(request);
}

// Protect all routes except public ones and static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

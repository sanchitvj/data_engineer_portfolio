import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Regex pattern for static assets
const STATIC_ASSETS = /\.(jpe?g|png|gif|svg|webp|ico|ttf|woff2?|eot|mp4|webm|pdf|css|js)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Set cache control headers for static assets
  if (STATIC_ASSETS.test(pathname)) {
    // Cache static assets for 30 days (2592000 seconds)
    response.headers.set(
      'Cache-Control',
      'public, max-age=2592000, stale-while-revalidate=86400'
    );
  } else if (pathname.startsWith('/_next/data/')) {
    // Cache build-time generated data for 1 hour, revalidate in background
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=300'
    );
  } else if (pathname.startsWith('/_next/static/')) {
    // Cache Next.js static assets for 1 year (immutable)
    response.headers.set(
      'Cache-Control', 
      'public, max-age=31536000, immutable'
    );
  } else if (pathname.startsWith('/api/')) {
    // Don't cache API routes by default
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    // For regular pages - cache for 5 minutes, but allow background revalidation
    response.headers.set(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=3600'
    );
  }

  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Apply to all routes except specific ones
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
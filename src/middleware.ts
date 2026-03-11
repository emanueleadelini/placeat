/**
 * Next.js Middleware
 * Adds security headers to all responses
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers to add to all responses
const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking by disallowing framing
  'X-Frame-Options': 'DENY',
  // Enable XSS protection in browsers
  'X-XSS-Protection': '1; mode=block',
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Restrict browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  return response;
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to all page routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

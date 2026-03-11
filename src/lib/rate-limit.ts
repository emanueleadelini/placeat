/**
 * Rate limiting utility using rate-limiter-flexible
 * Uses in-memory store for MVP (can be upgraded to Redis later)
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Store rate limiters in memory
const rateLimiters: Map<string, RateLimiterMemory> = new Map();

// Rate limit configurations
export const RateLimitConfig = {
  // General API: 100 requests per 15 minutes per IP
  general: {
    key: 'general',
    points: 100,
    duration: 15 * 60, // 15 minutes in seconds
  },
  // Stripe webhook: 50 requests per minute per IP
  stripeWebhook: {
    key: 'stripe-webhook',
    points: 50,
    duration: 60, // 1 minute in seconds
  },
  // Email API: 10 requests per hour per IP
  email: {
    key: 'email',
    points: 10,
    duration: 60 * 60, // 1 hour in seconds
  },
} as const;

type RateLimitType = keyof typeof RateLimitConfig;

/**
 * Get or create a rate limiter instance
 */
function getRateLimiter(type: RateLimitType): RateLimiterMemory {
  const config = RateLimitConfig[type];
  
  if (!rateLimiters.has(config.key)) {
    rateLimiters.set(
      config.key,
      new RateLimiterMemory({
        keyPrefix: config.key,
        points: config.points,
        duration: config.duration,
      })
    );
  }
  
  return rateLimiters.get(config.key)!;
}

/**
 * Get client IP from request
 * Handles various proxy scenarios
 */
export function getClientIP(req: NextRequest): string {
  // Try X-Forwarded-For header first (common for proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0].trim();
  }
  
  // Try X-Real-IP header
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fall back to a default identifier (less reliable)
  return 'unknown-ip';
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or a response object if rate limited
 */
export async function checkRateLimit(
  req: NextRequest,
  type: RateLimitType
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(type);
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  
  try {
    await limiter.consume(key, 1);
    // Request allowed
    return null;
  } catch (rateLimiterRes) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((rateLimiterRes as any).msBeforeNext / 1000);
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again after ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(RateLimitConfig[type].points),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + (rateLimiterRes as any).msBeforeNext),
        },
      }
    );
  }
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: RateLimitType
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await checkRateLimit(req, type);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(req);
  };
}

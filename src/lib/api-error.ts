/**
 * Standardized API error handling utility
 * Provides consistent error responses and logging
 */

import { NextResponse } from 'next/server';

// Error types for categorization
export enum ApiErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

// HTTP status codes mapping
const errorStatusCodes: Record<ApiErrorType, number> = {
  [ApiErrorType.VALIDATION]: 400,
  [ApiErrorType.AUTHENTICATION]: 401,
  [ApiErrorType.AUTHORIZATION]: 403,
  [ApiErrorType.NOT_FOUND]: 404,
  [ApiErrorType.RATE_LIMIT]: 429,
  [ApiErrorType.EXTERNAL_SERVICE]: 502,
  [ApiErrorType.INTERNAL]: 500,
};

// Standard API error response structure
export interface ApiErrorResponse {
  error: string;
  type: ApiErrorType;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Create a standardized API error response
 */
export function createApiError(
  type: ApiErrorType,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  const status = errorStatusCodes[type];
  
  const response: ApiErrorResponse = {
    error: type,
    type,
    message,
    ...(details && { details }),
    ...(requestId && { requestId }),
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Log API errors with appropriate level and context
 */
export function logApiError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const logEntry = {
    timestamp,
    context,
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    ...(extra && { extra }),
  };
  
  // In production, you might want to send this to a logging service
  // For now, we use console.error for visibility
  console.error('[API Error]', JSON.stringify(logEntry, null, 2));
}

/**
 * Common error response helpers
 */
export const apiErrors = {
  validation: (message: string, details?: Record<string, unknown>) =>
    createApiError(ApiErrorType.VALIDATION, message, details),
    
  authentication: (message: string = 'Authentication required') =>
    createApiError(ApiErrorType.AUTHENTICATION, message),
    
  authorization: (message: string = 'Access denied') =>
    createApiError(ApiErrorType.AUTHORIZATION, message),
    
  notFound: (resource: string) =>
    createApiError(ApiErrorType.NOT_FOUND, `${resource} not found`),
    
  rateLimit: (retryAfter: number) =>
    createApiError(
      ApiErrorType.RATE_LIMIT,
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      { retryAfter }
    ),
    
  externalService: (service: string, message: string) =>
    createApiError(
      ApiErrorType.EXTERNAL_SERVICE,
      `External service error: ${message}`,
      { service }
    ),
    
  internal: (message: string = 'Internal server error') =>
    createApiError(ApiErrorType.INTERNAL, message),
};

/**
 * Handle unknown errors and convert to API response
 */
export function handleApiError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
): NextResponse {
  logApiError(context, error, extra);
  
  // Don't expose internal error details in production
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev && error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
    
  return apiErrors.internal(message);
}

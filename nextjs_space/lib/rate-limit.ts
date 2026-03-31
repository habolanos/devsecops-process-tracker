import { NextRequest, NextResponse } from 'next/server';

// ============================================
// In-Memory Rate Limiter
// For production, consider using @upstash/ratelimit with Redis
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  interval: number;    // Time window in ms
  maxRequests: number; // Max requests per window
}

// In-memory store (per-instance, resets on restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Default configurations per endpoint type
export const RATE_LIMIT_CONFIGS = {
  upload: { interval: 60000, maxRequests: 30 },      // 30 uploads/min
  api: { interval: 60000, maxRequests: 100 },        // 100 requests/min
  auth: { interval: 300000, maxRequests: 10 },       // 10 auth attempts/5min
  strict: { interval: 60000, maxRequests: 10 },      // 10 requests/min
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

// Get client identifier (IP or forwarded IP)
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}

// Check rate limit
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupStaleEntries();
  
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // No existing entry or expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.interval
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.interval
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now
    };
  }
  
  // Increment counter
  entry.count += 1;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now
  };
}

// Rate limit response helper
export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(resetIn / 1000)
    },
    { 
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000))
      }
    }
  );
}

// Middleware helper for API routes
export function withRateLimit(
  request: NextRequest,
  endpoint: string,
  type: RateLimitType = 'api'
): { allowed: boolean; response?: NextResponse } {
  const identifier = getClientIdentifier(request);
  const config = RATE_LIMIT_CONFIGS[type];
  const result = checkRateLimit(identifier, endpoint, config);
  
  if (!result.allowed) {
    return { 
      allowed: false, 
      response: rateLimitResponse(result.resetIn) 
    };
  }
  
  return { allowed: true };
}

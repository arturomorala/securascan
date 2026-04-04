import { Request, Response, NextFunction } from 'express';
import type { User } from '../../drizzle/schema';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limiting middleware factory
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @param keyGenerator - Function to generate unique key for each request
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number,
  keyGenerator: (req: any) => string = (req) => req.ip || 'unknown'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    store[key].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

    if (store[key].count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Rate limiter for login attempts (5 attempts per 5 minutes per IP)
 */
export const loginLimiter = createRateLimiter(5, 5 * 60 * 1000);

/**
 * Rate limiter for scan endpoint (10 scans per hour per user)
 */
export const scanLimiter = (req: Request & { user?: User }, res: Response, next: NextFunction) => {
  const userId = req.user?.id?.toString() || req.ip || 'unknown';
  const key = `scan:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 10;

  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  store[key].count++;

  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
  res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

  if (store[key].count > maxRequests) {
    res.status(429).json({
      error: 'Too many scan requests',
      message: `Maximum 10 scans per hour. Please try again later.`,
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
    });
    return;
  }

  next();
};

/**
 * Rate limiter for webhook endpoint (100 requests per minute)
 */
export const webhookLimiter = createRateLimiter(100, 60 * 1000, (req) => {
  // Use a generic key for webhook since it's a single endpoint
  return 'webhook';
});

/**
 * Cleanup old entries from store (runs every 10 minutes)
 */
export function startRateLimitCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (now > store[key].resetTime) {
        delete store[key];
      }
    }
  }, 10 * 60 * 1000);
}

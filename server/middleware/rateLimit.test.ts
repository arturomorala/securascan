import { describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter, scanLimiter, webhookLimiter } from './rateLimit';

describe('Rate Limiting Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let nextCalled: boolean;

  beforeEach(() => {
    mockReq = {
      ip: `127.0.0.${Math.random()}`,
      user: { id: Math.random() },
    };
    mockRes = {
      status: (code: number) => {
        mockRes.statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        mockRes.jsonData = data;
      },
      setHeader: (key: string, value: string) => {
        if (!mockRes.headers) mockRes.headers = {};
        mockRes.headers[key] = value;
      },
    };
    nextCalled = false;
  });

  it('should allow requests within rate limit', () => {
    const limiter = createRateLimiter(5, 60000);
    const next = () => { nextCalled = true; };

    for (let i = 0; i < 5; i++) {
      limiter(mockReq, mockRes, next);
      expect(nextCalled).toBe(true);
      nextCalled = false;
    }
  });

  it('should reject requests exceeding rate limit', () => {
    const limiter = createRateLimiter(1, 60000);
    const next = () => { nextCalled = true; };

    limiter(mockReq, mockRes, next);
    expect(nextCalled).toBe(true);

    limiter(mockReq, mockRes, next);
    expect(mockReq.rateLimitExceeded).toBe(true);
    expect(nextCalled).toBe(true); // next is still called, error handled by tRPC
  });

  it('should set rate limit headers', () => {
    const limiter = createRateLimiter(5, 60000);
    const next = () => {};

    limiter(mockReq, mockRes, next);

    expect(mockRes.headers['X-RateLimit-Limit']).toBe('5');
    expect(mockRes.headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('should use custom key generator', () => {
    const keyGen = (req: any) => `custom-${req.user?.id}`;
    const limiter = createRateLimiter(1, 60000, keyGen);
    const next = () => { nextCalled = true; };

    limiter(mockReq, mockRes, next);
    expect(nextCalled).toBe(true);

    limiter(mockReq, mockRes, next);
    expect(mockReq.rateLimitExceeded).toBe(true);
    expect(nextCalled).toBe(true);
  });

  it('scan limiter should limit by user ID', () => {
    const next = () => { nextCalled = true; };

    for (let i = 0; i < 10; i++) {
      scanLimiter(mockReq, mockRes, next);
      expect(nextCalled).toBe(true);
      nextCalled = false;
    }

    scanLimiter(mockReq, mockRes, next);
    expect(mockReq.rateLimitExceeded).toBe(true);
    expect(nextCalled).toBe(true);
  });

  it('webhook limiter should limit requests', () => {
    const next = () => { nextCalled = true; };

    for (let i = 0; i < 100; i++) {
      webhookLimiter(mockReq, mockRes, next);
      expect(nextCalled).toBe(true);
      nextCalled = false;
    }

    webhookLimiter(mockReq, mockRes, next);
    expect(mockReq.rateLimitExceeded).toBe(true);
    expect(nextCalled).toBe(true);
  });
});

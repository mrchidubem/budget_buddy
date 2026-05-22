/**
 * In-memory rate limiting for auth endpoints
 */

const buckets = new Map();

const pruneExpired = (now) => {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

/**
 * @param {{ windowMs?: number, max?: number, keyPrefix?: string }} options
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  keyPrefix = 'global',
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 5000) {
      pruneExpired(now);
    }

    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
      });
    }

    return next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: 'auth',
});

export default { createRateLimiter, authRateLimiter };

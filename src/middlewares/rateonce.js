/* FIXME:
 * Current limiter identifies requesters by IP (req.ip). Behind proxies/CDNs/NAT, multiple users share one IP,
 * so they throttle each other.
 * Fix:
 *  - Use a per-user key (e.g., req.user.id or SHA-256 of normalized email) instead of raw IP.
 *  - app.set('trust proxy', 1) and read X-Forwarded-For / CF-Connecting-IP for real client IP.
 *  - (Optional) Keep a secondary IP limiter only to mitigate abuse.
 */
export function rateLimitOnce({
  windowMs = 60_000,
  keyResolver = (req) => req.user?.id || req.headers['x-user-id'] || req.ip,
  onReject,
  countOn = 'attempt',
} = {}) {
  const hits = new Map();

  return function rateOnceMiddleware(req, res, next) {
    const requester = keyResolver(req);
    if (!requester) {
      req._rateOnceNote = 'fallback to IP';
    }
    const key = String(requester || req.ip);

    const now = Date.now();
    const expiresAt = hits.get(key);
    if (expiresAt && now < expiresAt) {
      const retryMs = expiresAt - now;
      res.setHeader('Retry-After', Math.ceil(retryMs / 1000));
      if (onReject) return onReject(req, res, retryMs);
      return res.status(429).json({
        code: 429,
        message: 'Too Many Requests: only one call allowed per window.',
        retryAfterMs: retryMs,
      });
    }

    const startWindow = () => {
      const until = now + windowMs;
      hits.set(key, until);
      setTimeout(() => {
        const current = hits.get(key);
        if (current && current <= until) hits.delete(key);
      }, windowMs + 1000);
    };

    if (countOn === 'attempt') {
      startWindow();
      return next();
    }

    res.once('finish', () => {
      if (res.statusCode < 400) startWindow();
    });
    return next();
  };
}

/**
 * Rate Limiter Middleware
 *
 * Usage:
 *   // Global: Apply to all routes
 *   app.use(rateLimiterMiddleware);
 *
 *   // Selective: Apply to specific routes
 *   app.use('/api', rateLimiterMiddleware);
 *   app.post('/protected-route', rateLimiterMiddleware, controllerHandler);
 *
 * Requires:
 *   - Authentication middleware must run BEFORE this (sets req.client)
 *   - OR req.query.clientId / req.body.clientId must be present
 *
 * Behavior:
 *   - If authenticated (req.client): Uses client-scoped limit
 *   - Else if clientId in body/query: Uses that client ID
 *   - Else if IP available: Falls back to IP-based limit (less strict)
 *   - Returns 429 Too Many Requests if limit exceeded
 *   - Sets X-RateLimit-* headers on all responses
 */

const rateLimiterService = require("../services/rateLimiter");

module.exports = async function rateLimiterMiddleware(req, res, next) {
  try {
    let clientId = null;
    let ip = req.ip || req.connection.remoteAddress;
    let route = req.path;

    // Priority 1: Use authenticated client's ID (if auth middleware ran first)
    if (req.client) {
      clientId = req.client.id;
    }
    // Priority 2: Accept clientId from request body (for direct API calls)
    else if (req.body?.clientId) {
      clientId = req.body.clientId;
    }
    // Priority 3: Accept clientId from query params
    else if (req.query?.clientId) {
      clientId = req.query.clientId;
    }
    // Priority 4: Fall back to IP-based (less precise but still useful)
    // Note: IP in cloud/proxy scenarios may not be accurate

    // Check rate limit
    const result = await rateLimiterService.checkLimit({
      clientId,
      ip,
      route,
    });

    // Add standard rate limit headers to response
    res.set("X-RateLimit-Limit", result.limit);
    res.set("X-RateLimit-Remaining", result.remaining);
    res.set(
      "X-RateLimit-Reset",
      Math.ceil(Date.now() / 1000) + result.retryAfter,
    );

    // Check if limit exceeded
    if (!result.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        message: `Rate limit of ${result.limit} requests per ${result.window}s exceeded`,
        retryAfter: result.retryAfter,
        limit: result.limit,
        window: result.window,
        remaining: result.remaining,
      });
    }

    // Attach rate limit info to request for logging/debugging
    req.rateLimit = result;

    // Allow request to proceed
    next();
  } catch (err) {
    // On service error, fail open: allow request (prefers availability)
    console.error("Rate limiter error:", err);

    // Still set headers if possible
    res.set("X-RateLimit-Limit", "?");
    res.set("X-RateLimit-Remaining", "?");

    // Log error and pass through - don't block user traffic
    next();
  }
};

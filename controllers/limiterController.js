const rateLimiter = require("../services/rateLimiter");

exports.checkLimit = async (req, res, next) => {
  try {
    // Use authenticated client when present; otherwise require clientId or ip in body
    const clientId = req.body.clientId ?? req.client?.id;
    const ip = req.body.ip ?? req.ip ?? req.connection?.remoteAddress;
    const route = req.body.route;
    if (!ip && !clientId)
      return res
        .status(400)
        .json({ error: "Either clientId or ip is required" });

    const result = await rateLimiter.checkLimit({ clientId, ip, route });

    // Add standard rate limit headers
    res.set("X-RateLimit-Limit", result.limit);
    res.set("X-RateLimit-Remaining", result.remaining);
    res.set(
      "X-RateLimit-Reset",
      Math.ceil(Date.now() / 1000) + result.retryAfter,
    );

    if (!result.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: result.retryAfter,
        remaining: result.remaining,
        limit: result.limit,
        window: result.window,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.setLimit = async (req, res, next) => {
  try {
    const { clientId, route, limit, window } = req.body;
    if (!clientId || !limit || !window) {
      return res
        .status(400)
        .json({ error: "clientId, limit, window are required" });
    }

    // SECURITY: Verify client is only modifying their own limits
    if (req.client.id !== clientId && !req.client.isAdmin) {
      return res
        .status(403)
        .json({ error: "Cannot modify limits for other clients" });
    }

    const result = await rateLimiter.setLimit({
      clientId,
      route,
      limit,
      window,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

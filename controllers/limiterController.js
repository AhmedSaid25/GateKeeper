const rateLimiter = require("../services/rateLimiter");

exports.checkLimit = async (req, res, next) => {
  try {
    const { clientId, ip, route } = req.body;
    if (!ip && !clientId) return res.status(400).json({ error: "Either clientId or ip is required" });

    const result = await rateLimiter.checkLimit({ clientId, ip, route });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.setLimit = async (req, res, next) => {
  try {
    const { clientId, route, limit, window } = req.body;
    if (!clientId || !limit || !window) {
      return res.status(400).json({ error: "clientId, limit, window are required" });
    }

    const result = await rateLimiter.setLimit({ clientId, route, limit, window });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const redis = require("./redisClient");
const { DEFAULT_LIMIT, DEFAULT_WINDOW } = require("../config/settings");

exports.checkLimit = async ({ clientId, ip, route }) => {
  let identifier = clientId && ip ? `${clientId}:${ip}` : clientId || ip;
  if (route) identifier += `:${route}`;

  const configKey = `config:${identifier}`;
  const config = await redis.hgetall(configKey);

  const limit = config.limit ? parseInt(config.limit) : DEFAULT_LIMIT;
  const window = config.window ? parseInt(config.window) : DEFAULT_WINDOW;

  const key = `rate:${identifier}`;
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, window);
  }

  if (requests > limit) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      retryAfter: ttl,
      remaining: 0,
      limit,
      window,
    };
  }

  return {
    allowed: true,
    remaining: limit - requests,
    retryAfter: 0,
    limit,
    window,
  };
};

// set custom limits
exports.setLimit = async ({ clientId, route, limit, window }) => {
  if (!clientId) throw new Error("clientId is required");

  let identifier = clientId;
  if (route) identifier += `:${route}`;

  const configKey = `config:${identifier}`;
  await redis.hmset(configKey, { limit, window });

  return { message: "Limit updated", identifier, limit, window };
};

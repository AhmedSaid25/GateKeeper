const Redis = require("ioredis");
const { REDIS_URL } = require("../config/settings");

const redis = new Redis(REDIS_URL);

redis.on("connect", () => {
  console.log("✅ Connected to Redis");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

module.exports = redis;

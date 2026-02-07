require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DB_DIALECT: process.env.DB_DIALECT || "sqlite",
  DB_STORAGE: process.env.DB_STORAGE || "./gatekeeper.sqlite",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",

  // Rate limiting defaults
  DEFAULT_LIMIT: parseInt(process.env.DEFAULT_LIMIT || "10"),
  DEFAULT_WINDOW: parseInt(process.env.DEFAULT_WINDOW || "60"),

  // Security
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "10"),
};

// Run before tests. Load .env first so tests use the same credentials as npm start;
// then set NODE_ENV=test (dotenv won't override this when config/settings loads .env later).
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env") });
process.env.NODE_ENV = "test";

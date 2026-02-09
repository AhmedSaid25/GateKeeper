// Express app factory (used by index.js and by tests with supertest)
const express = require("express");
const limiterRoutes = require("./routes/limiter");
const registerRoutes = require("./routes/register");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");
const { NODE_ENV } = require("./config/settings");

const app = express();
app.use(express.json());
app.use(cors());

if (NODE_ENV !== "production") {
  const swaggerUi = require("swagger-ui-express");
  const swaggerSpec = require("./config/swagger");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use("/", limiterRoutes);
app.use("/register", registerRoutes);
app.use(errorHandler);

module.exports = app;

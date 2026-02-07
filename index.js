const express = require("express");
const limiterRoutes = require("./routes/limiter");
const registerRoutes = require("./routes/register");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");
const { sequelize } = require("./models/Client");
const { PORT } = require("./config/settings");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/", limiterRoutes);
app.use("/register", registerRoutes);

// Error handler
app.use(errorHandler);

// Start server
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚦 GateKeeper running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to sync database:", err);
    process.exit(1);
  });

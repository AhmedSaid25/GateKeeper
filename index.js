const express = require("express");
const limiterRoutes = require("./routes/limiter");
const registerRoutes = require("./routes/register");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");
const { sequelize } = require("./models/Client");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/", limiterRoutes);
app.use("/register", registerRoutes);

// Error handler
app.use(errorHandler);

sequelize.sync().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚦 GateKeeper running on port ${PORT}`);
  });
});

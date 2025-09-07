const express = require("express");
const limiterRoutes = require("./routes/limiter");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/", limiterRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚦 GateKeeper running on port ${PORT}`);
});

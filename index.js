const app = require("./app");
const { sequelize } = require("./models/Client");
const { PORT } = require("./config/settings");

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

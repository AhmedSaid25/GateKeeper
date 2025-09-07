const express = require("express");
const Redis = require("ioredis");

const app = express();
const redis = new Redis(); 

app.get("/", (req, res) => {
  res.send("🚦 GateKeeper is running!");
});

app.get("/test-redis", async (req, res) => {
  await redis.set("visits", (parseInt(await redis.get("visits")) || 0) + 1);
  const visits = await redis.get("visits");
  res.send(`Redis counter: ${visits}`);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

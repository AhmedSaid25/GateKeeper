const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");
const limiterController = require("../controllers/limiterController");

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "🚦 GateKeeper is running" });
});

// Protected endpoints: auth -> rate limit -> controller
router.post("/check-limit", auth, rateLimiter, limiterController.checkLimit);
router.post("/set-limit", auth, rateLimiter, limiterController.setLimit);

module.exports = router;

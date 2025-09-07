const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const limiterController = require("../controllers/limiterController");


router.get("/", (req, res) => {
  res.json({ status: "ok", message: "🚦 GateKeeper is running" });
});


router.post("/check-limit",auth , limiterController.checkLimit);
router.post("/set-limit", auth , limiterController.setLimit);

module.exports = router;

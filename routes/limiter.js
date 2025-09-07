const express = require("express");
const router = express.Router();
const limiterController = require("../controllers/limiterController");


router.get("/", (req, res) => {
  res.json({ status: "ok", message: "🚦 GateKeeper is running" });
});


router.post("/check-limit", limiterController.checkLimit);
router.post("/set-limit", limiterController.setLimit);

module.exports = router;

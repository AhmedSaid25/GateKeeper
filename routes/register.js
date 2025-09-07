const express = require("express");
const router = express.Router();
const { Client } = require("../models/Client");
const crypto = require("crypto");

router.post("/", async (req, res) => {
  const { clientName, email } = req.body;
  if (!clientName || !email)
    return res.status(400).json({ error: "clientName and email required" });

  const apiKey = crypto.randomBytes(16).toString("hex");
  try {
    const client = await Client.create({ clientName, email, apiKey });
    res.json({ apiKey });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
});

module.exports = router;

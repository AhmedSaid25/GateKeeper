const express = require("express");
const router = express.Router();
const { Client } = require("../models/Client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { BCRYPT_ROUNDS } = require("../config/settings");

router.post("/", async (req, res) => {
  const { clientName, email } = req.body;
  if (!clientName || !email)
    return res.status(400).json({ error: "clientName and email required" });

  // Generate random key (this is the ONLY time user sees plaintext)
  const apiKey = crypto.randomBytes(16).toString("hex");
  
  // Hash the API key immediately
  const apiKeyHash = bcrypt.hashSync(apiKey, BCRYPT_ROUNDS);

  try {
    const client = await Client.create({ clientName, email, apiKey, apiKeyHash });

    // Return plaintext key to user - they must store it securely
    res.json({
      message:
        "Client registered successfully. Store this API key securely; it won't be shown again.",
      clientId: client.id,
      apiKey,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Email already registered" });
    }
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
});

module.exports = router;

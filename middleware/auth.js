const { Client } = require("../models/Client");
const bcrypt = require("bcrypt");

module.exports = async function (req, res, next) {
  const apiKey = req.headers["authorization"];
  if (!apiKey) return res.status(401).json({ error: "API key required" });

  const client = await Client.findOne({ where: { apiKey } });
  if (!client) return res.status(401).json({ error: "Invalid API key" });

  // Verify the plaintext key against the hash
  const isValid = await bcrypt.compare(apiKey, client.apiKeyHash);
  if (!isValid) return res.status(401).json({ error: "Invalid API key" });

  // Check if client is active
  if (!client.isActive || client.revokedAt) {
    return res.status(403).json({ error: "API key has been revoked" });
  }

  // Attach client info to request
  req.client = client;
  next();
};

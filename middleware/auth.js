const { Client } = require("../models/Client");

module.exports = async function (req, res, next) {
  const apiKey = req.headers["authorization"];
  if (!apiKey) return res.status(401).json({ error: "API key required" });

  const client = await Client.findOne({ where: { apiKey } });
  if (!client) return res.status(401).json({ error: "Invalid API key" });

  // Optionally attach client info to request
  req.client = client;
  next();
};

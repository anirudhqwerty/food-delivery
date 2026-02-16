const express = require("express");
const orderRoutes = require("./routes/order.routes");
const pool = require("./config/db");
const { getChannel } = require("./config/rabbitmq");
const { getRedis } = require("./config/redis");
const requestId = require("./middleware/requestId");
const httpLogger = require("./middleware/httpLogger");

const app = express();

app.use(requestId);
app.use(httpLogger);
app.use(express.json());

app.use("/order", orderRoutes);

app.get("/health/live", (req, res) => {
  res.json({ status: "live" });
});

app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    getChannel(); // throws if not initialized
    const redis = getRedis();
    await redis.ping();
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err.message || err) });
  }
});

// Backwards-compatible health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "order service running" });
});

module.exports = app;

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initDb, getDb, closeDb, initRabbit, getRabbit, closeRabbit, initRedis, getRedis, closeRedis } = require("../db");
const orderRoutes = require("../routes/restaurant.routes");
const startConsumer = require("./order.consumer");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.use("/order", orderRoutes);

app.get("/health/live", (req, res) => {
  res.json({ status: "live" });
});

app.get("/health/ready", async (req, res) => {
  try {
    const db = getDb();
    const channel = getRabbit();
    const redis = getRedis();
    
    await db.query("SELECT 1");
    await redis.ping();
    
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

async function start() {
  try {
    await initDb();
    console.log("✓ Database connected");

    await initRabbit();
    console.log("✓ RabbitMQ connected");

    await initRedis();
    console.log("✓ Redis connected");

    await startConsumer();
    console.log("✓ Consumer started");

    const server = app.listen(PORT, () => {
      console.log(`✓ Order service listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);

      server.close(async () => {
        try {
          await closeRabbit();
          await closeRedis();
          await closeDb();
          console.log("✓ All connections closed");
          process.exit(0);
        } catch (err) {
          console.error("Shutdown error:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Failed to start service:", err);
    process.exit(1);
  }
}

start();

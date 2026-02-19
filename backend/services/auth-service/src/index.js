require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("../routes/auth.routes");
const pool = require("../db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/auth/health", (req, res) => {
  res.json({ status: "auth service running" });
});

app.use("/auth", authRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("✓ Database connected");
    
    const server = app.listen(PORT, () => {
      console.log(`✓ Auth service listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(async () => {
        try {
          await pool.end();
          console.log("✓ Database closed");
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
    console.error("✗ Failed to start service:", err.message);
    process.exit(1);
  }
}

start();

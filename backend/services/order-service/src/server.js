require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");
const connectRabbit = require("./config/rabbitmq");
const { closeRabbit } = require("./config/rabbitmq");
const connectRedis = require("./config/redis");
const { getRedis } = require("./config/redis");
const startConsumer = require("./events/consumer");
const { startOutboxWorker } = require("./events/outboxWorker");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5002;

async function startServer() {
  let server;
  let stopOutbox;
  try {
    await pool.query("SELECT 1");
    logger.info("Database connected");

    await connectRabbit();
    logger.info("RabbitMQ connected");

    await connectRedis();
    logger.info("Redis connected");

    await startConsumer();
    logger.info("Event consumer started");

    stopOutbox = startOutboxWorker();
    logger.info("Outbox worker started");

    server = app.listen(PORT, () => {
      logger.info("Order service listening", { port: PORT });
    });

    const shutdown = async (signal) => {
      logger.info("Shutdown requested", { signal });

      if (server) {
        await new Promise((resolve) => server.close(resolve));
        logger.info("HTTP server closed");
      }

      try {
        stopOutbox?.();
      } catch (err) {
        logger.error("Failed stopping outbox worker", { err: String(err) });
      }

      try {
        await closeRabbit();
        logger.info("RabbitMQ closed");
      } catch (err) {
        logger.error("RabbitMQ close error", { err: String(err) });
      }

      try {
        const redis = getRedis();
        await redis.quit();
        logger.info("Redis closed");
      } catch (err) {
        logger.error("Redis close error", { err: String(err) });
      }

      try {
        await pool.end();
        logger.info("DB pool closed");
      } catch (err) {
        logger.error("DB close error", { err: String(err) });
      }

      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start service", { err: String(err) });
    process.exit(1);
  }
}

startServer();

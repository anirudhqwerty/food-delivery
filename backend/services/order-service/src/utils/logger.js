const winston = require("winston");

const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service_name: SERVICE_NAME },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;


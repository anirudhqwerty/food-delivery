const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX || "20", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});


const logger = require("../utils/logger");

function httpLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    logger.info("http_request", {
      request_id: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    });
  });

  next();
}

module.exports = httpLogger;


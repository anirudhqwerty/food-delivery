const { randomUUID } = require("crypto");

function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  req.requestId = incoming || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}

module.exports = requestId;

const { getRedis } = require("../config/redis");

async function idempotency(req, res, next) {
  const key = req.headers["idempotency-key"];
  if (!key) return next();

  const redis = getRedis();
  const existing = await redis.get(key);

  if (existing) {
    return res.status(409).json({ error: "Duplicate request" });
  }

  await redis.set(key, "locked", "EX", 300);
  next();
}

module.exports = idempotency;

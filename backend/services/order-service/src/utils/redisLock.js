const { getRedis } = require("../config/redis");
const { randomUUID } = require("crypto");

const UNLOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

async function acquireLock(key, ttlMs) {
  const redis = getRedis();
  const token = randomUUID();
  const ok = await redis.set(key, token, "PX", ttlMs, "NX");
  if (!ok) return null;
  return token;
}

async function releaseLock(key, token) {
  const redis = getRedis();
  await redis.eval(UNLOCK_SCRIPT, 1, key, token);
}

async function withRedisLock(key, { ttlMs = 5000, waitMs = 2000 } = {}, fn) {
  const start = Date.now();
  while (Date.now() - start < waitMs) {
    const token = await acquireLock(key, ttlMs);
    if (token) {
      try {
        return await fn();
      } finally {
        await releaseLock(key, token);
      }
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Failed to acquire lock");
}

module.exports = { withRedisLock };

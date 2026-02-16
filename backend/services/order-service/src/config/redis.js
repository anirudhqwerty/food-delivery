const Redis = require("ioredis");

let redis;

async function connectRedis() {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: 6379,
  });

  redis.on("connect", () => {
    console.log("Redis connected");
  });

  redis.on("error", (err) => {
    console.error("Redis error", err);
  });

  return redis;
}

function getRedis() {
  if (!redis) {
    throw new Error("Redis not initialized");
  }
  return redis;
}

module.exports = connectRedis;
module.exports.getRedis = getRedis;

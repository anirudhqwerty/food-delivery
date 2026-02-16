const axios = require("axios");
const { getRedis } = require("../config/redis");

const VENDOR_BASE_URL = process.env.VENDOR_BASE_URL || "http://nginx/vendor";
const MENU_ITEM_CACHE_TTL_SECONDS = parseInt(
  process.env.MENU_ITEM_CACHE_TTL_SECONDS || "30",
  10
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { retries = 3, baseDelayMs = 150 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function getMenuItemById(id) {
  const redis = getRedis();
  const cacheKey = `vendor:menu_item:${id}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await withRetry(
    () =>
      axios.get(`${VENDOR_BASE_URL}/public/menu/${id}`, {
        timeout: parseInt(process.env.VENDOR_HTTP_TIMEOUT_MS || "2000", 10),
      }),
    {
      retries: parseInt(process.env.VENDOR_HTTP_RETRIES || "3", 10),
      baseDelayMs: parseInt(process.env.VENDOR_HTTP_RETRY_DELAY_MS || "150", 10),
    }
  );

  await redis.set(
    cacheKey,
    JSON.stringify(response.data),
    "EX",
    MENU_ITEM_CACHE_TTL_SECONDS
  );

  return response.data;
}

module.exports = {
  getMenuItemById,
};

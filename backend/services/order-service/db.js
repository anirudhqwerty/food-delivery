const { Pool } = require("pg");
const amqp = require("amqplib");
const Redis = require("ioredis");

let db;
let rabbit = { connection: null, channel: null };
let redis;

async function initDb() {
  let retries = 5;
  let lastError;
  
  while (retries > 0) {
    try {
      db = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });
      await db.query("SELECT 1");
      return;
    } catch (err) {
      lastError = err;
      retries--;
      if (db) {
        await db.end().catch(() => {});
        db = null;
      }
      if (retries > 0) {
        console.log(`Database connection failed, retrying... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

async function closeDb() {
  if (db) await db.end();
}

async function initRabbit() {
  let retries = 5;
  let lastError;
  
  while (retries > 0) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertExchange("order_exchange", "topic", { durable: true });
      await channel.assertQueue("order_queue", { durable: true });
      await channel.bindQueue("order_queue", "order_exchange", "order.*");
      
      rabbit.connection = conn;
      rabbit.channel = channel;
      return;
    } catch (err) {
      lastError = err;
      retries--;
      if (retries > 0) {
        console.log(`RabbitMQ connection failed, retrying... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

function getRabbit() {
  if (!rabbit.channel) throw new Error("RabbitMQ not initialized");
  return rabbit.channel;
}

async function closeRabbit() {
  if (rabbit.channel) await rabbit.channel.close();
  if (rabbit.connection) await rabbit.connection.close();
}

async function initRedis() {
  let retries = 5;
  let lastError;
  
  while (retries > 0) {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: 6379,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        connectTimeout: 5000,
      });
      
      await new Promise((resolve, reject) => {
        redis.on("connect", resolve);
        redis.on("error", reject);
        setTimeout(() => reject(new Error("Redis connection timeout")), 5000);
      });
      return;
    } catch (err) {
      lastError = err;
      retries--;
      if (redis) {
        redis.disconnect();
        redis = null;
      }
      if (retries > 0) {
        console.log(`Redis connection failed, retrying... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

function getRedis() {
  if (!redis) throw new Error("Redis not initialized");
  return redis;
}

async function closeRedis() {
  if (redis) await redis.quit();
}

module.exports = {
  initDb,
  getDb,
  closeDb,
  initRabbit,
  getRabbit,
  closeRabbit,
  initRedis,
  getRedis,
  closeRedis,
};

const { Pool } = require("pg");
const amqp = require("amqplib");
const Redis = require("ioredis");

let db;
let rabbit = { connection: null, channel: null };
let redis;

async function initDb() {
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  await db.query("SELECT 1");
}

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

async function closeDb() {
  if (db) await db.end();
}

async function initRabbit() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange("order_exchange", "topic", { durable: true });
  await channel.assertQueue("order_queue", { durable: true });
  await channel.bindQueue("order_queue", "order_exchange", "order.*");
  
  rabbit.connection = conn;
  rabbit.channel = channel;
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
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  await redis.ping();
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

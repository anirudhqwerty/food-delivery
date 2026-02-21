const { Pool } = require("pg");
const amqp = require("amqplib");

let db;
let rabbit = { connection: null, channel: null };

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
      await channel.bindQueue("order_queue", "order_exchange", "delivery.*");
      
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

module.exports = {
  initDb,
  getDb,
  closeDb,
  initRabbit,
  getRabbit,
  closeRabbit,
};

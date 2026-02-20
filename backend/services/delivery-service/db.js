const { Pool } = require("pg");
const amqp = require("amqplib");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let rabbit = { connection: null, channel: null };

async function initRabbit() {
  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertExchange("order_exchange", "topic", { durable: true });
      await channel.assertQueue("delivery_queue", { durable: true });
      await channel.bindQueue("delivery_queue", "order_exchange", "order.ready");
      
      rabbit.connection = conn;
      rabbit.channel = channel;
      return;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

module.exports = {
  getDb: () => pool,
  initRabbit,
  getRabbit: () => rabbit.channel,
};

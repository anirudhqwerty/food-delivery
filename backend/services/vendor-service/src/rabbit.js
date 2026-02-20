const amqp = require("amqplib");

let rabbit = { connection: null, channel: null };

async function initRabbit() {
  let retries = 5;
  let lastErr;

  while (retries > 0) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();

      await channel.assertExchange("order_exchange", "topic", { durable: true });
      await channel.assertQueue("vendor_queue", { durable: true });
      await channel.bindQueue("vendor_queue", "order_exchange", "order.vendor_accepted");

      rabbit.connection = conn;
      rabbit.channel = channel;
      return;
    } catch (err) {
      lastErr = err;
      retries--;
      if (retries > 0) {
        console.log(`RabbitMQ connection failed, retrying... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  throw lastErr;
}

function getRabbit() {
  if (!rabbit.channel) throw new Error("RabbitMQ not initialized");
  return rabbit.channel;
}

async function closeRabbit() {
  if (rabbit.channel) await rabbit.channel.close();
  if (rabbit.connection) await rabbit.connection.close();
}

module.exports = { initRabbit, getRabbit, closeRabbit };

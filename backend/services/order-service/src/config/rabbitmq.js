const amqp = require("amqplib");

let connection;
let channel;

async function connectRabbit() {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange("order_exchange", "topic", { durable: true });
  return channel;
}

function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  return channel;
}

async function closeRabbit() {
  try {
    if (channel) await channel.close();
  } finally {
    channel = undefined;
  }

  try {
    if (connection) await connection.close();
  } finally {
    connection = undefined;
  }
}

module.exports = connectRabbit;
module.exports.getChannel = getChannel;
module.exports.closeRabbit = closeRabbit;

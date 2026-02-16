const { getChannel } = require("../config/rabbitmq");

async function publishEvent(routingKey, message) {
  const channel = getChannel();
  channel.publish(
    "order_exchange",
    routingKey,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
      contentType: "application/json",
      messageId: message && message.event_id ? message.event_id : undefined,
      correlationId: message && message.request_id ? message.request_id : undefined,
    }
  );
}

module.exports = publishEvent;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initRabbit } = require("../db");
const deliveryRoutes = require("../routes/delivery.routes");
const startConsumer = require("./delivery.consumer");

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.use("/delivery", deliveryRoutes);

async function start() {
  try {
    console.log("Initializing RabbitMQ...");
    await initRabbit();
    
    console.log("Starting delivery consumer...");
    await startConsumer();
    
    app.listen(PORT, () => {
      console.log(`[Delivery Service] listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start delivery service:", err.message);
    process.exit(1);
  }
}

start();

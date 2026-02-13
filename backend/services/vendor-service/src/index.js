require("dotenv").config();
const express = require("express");
const cors = require("cors");
const restaurantRoutes = require("../routes/restaurant.routes");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/vendor/health", (req, res) => {
  res.json({ status: "vendor service running" });
});

// Mount restaurant routes under /vendor
app.use("/vendor", restaurantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Vendor service running on port ${PORT}`);
});

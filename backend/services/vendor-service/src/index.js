require("dotenv").config();
const express = require("express");
const cors = require("cors");

const restaurantRoutes = require("../routes/restaurant.routes");
const menuRoutes = require("../routes/menu.routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/vendor/health", (req, res) => {
  res.json({ status: "vendor service running" });
});

app.use("/vendor/restaurants", restaurantRoutes);
app.use("/vendor/menu", menuRoutes);

app.listen(PORT, () => {
  console.log(`Vendor service running on port ${PORT}`);
});

require("dotenv").config();
const express = require("express");
const authRoutes = require("../routes/auth.routes");

const app = express();
const PORT = 5000;

// middleware to parse JSON
app.use(express.json());

// health check
app.get("/auth/health", (req, res) => {
  res.json({ status: "auth service running" });
});

// Mount auth routes under /auth to match nginx proxy path
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

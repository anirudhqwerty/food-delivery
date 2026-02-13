const express = require("express");
const pool = require("../db");
const { verifyVendor } = require("../middleware/vendor-auth");

const router = express.Router();

async function getRestaurantByVendor(vendorId) {
  const result = await pool.query(
    "SELECT * FROM restaurants WHERE vendor_id = $1",
    [vendorId]
  );

  return result.rows[0] || null;
}

router.post("/", verifyVendor, async (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Restaurant name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO restaurants (vendor_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.vendorId, name.trim(), description ?? null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Vendor already has a restaurant" });
    }

    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", verifyVendor, async (req, res) => {
  try {
    const restaurant = await getRestaurantByVendor(req.vendorId);
    return res.json(restaurant);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/", verifyVendor, async (req, res) => {
  const { name, description } = req.body;

  if (name === undefined && description === undefined) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  try {
    const existing = await getRestaurantByVendor(req.vendorId);

    if (!existing) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const updatedName =
      name !== undefined ? String(name).trim() : existing.name;
    const updatedDescription =
      description !== undefined ? description : existing.description;

    if (!updatedName) {
      return res.status(400).json({ error: "Restaurant name cannot be empty" });
    }

    const result = await pool.query(
      `UPDATE restaurants
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [updatedName, updatedDescription, existing.id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const restaurantsResult = await pool.query(
      "SELECT id, name, description, created_at FROM restaurants ORDER BY created_at DESC"
    );

    if (restaurantsResult.rows.length === 0) {
      return res.json([]);
    }

    const menuResult = await pool.query(
      `SELECT id, restaurant_id, name, description, price, is_available
       FROM menu_items
       WHERE restaurant_id = ANY($1::uuid[])
       ORDER BY created_at DESC`,
      [restaurantsResult.rows.map((restaurant) => restaurant.id)]
    );

    const menuByRestaurant = menuResult.rows.reduce((acc, item) => {
      if (!acc[item.restaurant_id]) {
        acc[item.restaurant_id] = [];
      }

      acc[item.restaurant_id].push(item);
      return acc;
    }, {});

    const response = restaurantsResult.rows.map((restaurant) => ({
      ...restaurant,
      menu: menuByRestaurant[restaurant.id] || [],
    }));

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

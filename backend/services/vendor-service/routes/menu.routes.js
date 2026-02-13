const express = require("express");
const pool = require("../db");
const { verifyVendor } = require("../middleware/vendor-auth");

const router = express.Router();

async function getVendorRestaurant(vendorId) {
  const result = await pool.query(
    "SELECT id FROM restaurants WHERE vendor_id = $1",
    [vendorId]
  );

  return result.rows[0] || null;
}

router.post("/", verifyVendor, async (req, res) => {
  const { name, description, price, is_available } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: "Name and price are required" });
  }

  const parsedPrice = Number(price);

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "Price must be a valid non-negative number" });
  }

  try {
    const restaurant = await getVendorRestaurant(req.vendorId);

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found for vendor" });
    }

    const result = await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, is_available)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        restaurant.id,
        String(name).trim(),
        description ?? null,
        parsedPrice,
        is_available ?? true,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", verifyVendor, async (req, res) => {
  try {
    const restaurant = await getVendorRestaurant(req.vendorId);

    if (!restaurant) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, price, is_available, created_at
       FROM menu_items
       WHERE restaurant_id = $1
       ORDER BY created_at DESC`,
      [restaurant.id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/", verifyVendor, async (req, res) => {
  const { item_id, name, description, price, is_available } = req.body;

  if (!item_id) {
    return res.status(400).json({ error: "item_id is required" });
  }

  if (
    name === undefined &&
    description === undefined &&
    price === undefined &&
    is_available === undefined
  ) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  try {
    const restaurant = await getVendorRestaurant(req.vendorId);

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found for vendor" });
    }

    const existingResult = await pool.query(
      "SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2",
      [item_id, restaurant.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const existing = existingResult.rows[0];
    const updatedName = name !== undefined ? String(name).trim() : existing.name;
    const updatedDescription =
      description !== undefined ? description : existing.description;
    const updatedPrice = price !== undefined ? Number(price) : Number(existing.price);
    const updatedAvailability =
      is_available !== undefined ? Boolean(is_available) : existing.is_available;

    if (!updatedName) {
      return res.status(400).json({ error: "Menu item name cannot be empty" });
    }

    if (!Number.isFinite(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ error: "Price must be a valid non-negative number" });
    }

    const result = await pool.query(
      `UPDATE menu_items
       SET name = $1, description = $2, price = $3, is_available = $4
       WHERE id = $5 AND restaurant_id = $6
       RETURNING *`,
      [
        updatedName,
        updatedDescription,
        updatedPrice,
        updatedAvailability,
        item_id,
        restaurant.id,
      ]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/", verifyVendor, async (req, res) => {
  const { item_id } = req.body;

  if (!item_id) {
    return res.status(400).json({ error: "item_id is required" });
  }

  try {
    const restaurant = await getVendorRestaurant(req.vendorId);

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found for vendor" });
    }

    const result = await pool.query(
      `DELETE FROM menu_items
       WHERE id = $1 AND restaurant_id = $2
       RETURNING id`,
      [item_id, restaurant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    return res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

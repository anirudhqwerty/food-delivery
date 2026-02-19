const express = require("express");
const { verifyVendor } = require("../middleware/vendor-auth");
const pool = require("../db");

const router = express.Router();

/**
 * GET /vendor/restaurant
 * Get the vendor's restaurant (or create if doesn't exist)
 */
router.get("/restaurant", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;

    let result = await pool.query(
      "SELECT id, vendor_id, name, description, created_at FROM restaurants WHERE vendor_id = $1",
      [vendorId]
    );

    if (result.rows.length === 0) {
      // Create a default restaurant for the vendor
      result = await pool.query(
        `INSERT INTO restaurants (vendor_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, vendor_id, name, description, created_at`,
        [vendorId, "My Restaurant", "Welcome to my restaurant"]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /vendor/restaurant
 * Create a new restaurant for the vendor
 */
router.post("/restaurant", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Restaurant name is required" });
    }

    // Check if vendor already has a restaurant
    const existing = await pool.query(
      "SELECT id FROM restaurants WHERE vendor_id = $1",
      [vendorId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Vendor already has a restaurant" });
    }

    const result = await pool.query(
      `INSERT INTO restaurants (vendor_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, vendor_id, name, description, created_at`,
      [vendorId, name, description || ""]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});


router.put("/restaurant", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Restaurant name is required" });
    }

    const result = await pool.query(
      `UPDATE restaurants
       SET name = $1, description = $2
       WHERE vendor_id = $3
       RETURNING id, vendor_id, name, description, created_at`,
      [name, description || "", vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /vendor/menu
 * Get all menu items for the vendor's restaurant
 */
router.get("/menu", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;

    const result = await pool.query(
      `SELECT m.id, m.restaurant_id, m.name, m.description, m.price, m.quantity, m.is_available, m.created_at
       FROM menu_items m
       INNER JOIN restaurants r ON m.restaurant_id = r.id
       WHERE r.vendor_id = $1
       ORDER BY m.created_at DESC`,
      [vendorId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /vendor/menu
 * Add a menu item to the vendor's restaurant
 */
router.post("/menu", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;
    const { name, description, price, quantity } = req.body;

    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({
        error: "Name, price, and quantity are required",
      });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Price must be a valid positive number" });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: "Quantity must be a non-negative integer" });
    }

    // Get vendor's restaurant
    const restaurantResult = await pool.query(
      "SELECT id FROM restaurants WHERE vendor_id = $1",
      [vendorId]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const restaurantId = restaurantResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, restaurant_id, name, description, price, quantity, is_available, created_at`,
      [restaurantId, name, description || "", parseFloat(price), parseInt(quantity)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /vendor/menu/:id
 * Update a menu item
 */
router.put("/menu/:id", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;
    const menuItemId = req.params.id;
    const { name, description, price, quantity, is_available } = req.body;

    // Validate that the menu item belongs to the vendor
    const ownershipResult = await pool.query(
      `SELECT m.id FROM menu_items m
       INNER JOIN restaurants r ON m.restaurant_id = r.id
       WHERE m.id = $1 AND r.vendor_id = $2`,
      [menuItemId, vendorId]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found or unauthorized" });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (price !== undefined) {
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "Price must be a valid positive number" });
      }
      updates.push(`price = $${paramCount}`);
      values.push(parseFloat(price));
      paramCount++;
    }

    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ error: "Quantity must be a non-negative integer" });
      }
      updates.push(`quantity = $${paramCount}`);
      values.push(quantity);
      paramCount++;
    }

    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount}`);
      values.push(is_available);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(menuItemId);

    const query = `UPDATE menu_items
                   SET ${updates.join(", ")}
                   WHERE id = $${paramCount}
                   RETURNING id, restaurant_id, name, description, price, quantity, is_available, created_at`;

    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /vendor/menu/:id
 * Delete a menu item
 */
router.delete("/menu/:id", verifyVendor, async (req, res, next) => {
  try {
    const vendorId = req.vendorId;
    const menuItemId = req.params.id;

    // Verify ownership before deleting
    const ownershipResult = await pool.query(
      `SELECT m.id FROM menu_items m
       INNER JOIN restaurants r ON m.restaurant_id = r.id
       WHERE m.id = $1 AND r.vendor_id = $2`,
      [menuItemId, vendorId]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found or unauthorized" });
    }

    await pool.query("DELETE FROM menu_items WHERE id = $1", [menuItemId]);

    res.json({ success: true, message: "Menu item deleted" });
  } catch (err) {
    next(err);
  }
});

// public routes for customer app via nginx

// GET /vendor/public/restaurants
// get a list of all restaurants for the customer feed
router.get("/public/restaurants", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description 
       FROM restaurants 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /vendor/public/menu
// get all available menu items from all restaurants
router.get("/public/menu", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
         m.id, 
         m.name AS item_name, 
         m.description, 
         m.price,
         m.quantity,
         m.restaurant_id,
         r.name AS restaurant_name 
       FROM menu_items m
       INNER JOIN restaurants r ON m.restaurant_id = r.id
       WHERE m.is_available = true
       ORDER BY m.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /vendor/public/menu/:id
// get a single available menu item by id (used by order-service)
router.get("/public/menu/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
         m.id,
         m.restaurant_id,
         m.name,
         m.description,
         m.price,
         m.quantity,
         m.is_available
       FROM menu_items m
       WHERE m.id = $1 AND m.is_available = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /vendor/internal/inventory
// internal endpoint to decrease menu item quantities (called by order-service)
router.patch("/internal/inventory", async (req, res, next) => {
  try {
    const { items } = req.body; // items: [{ menu_item_id, quantity }, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid items array" });
    }

    // Update all items
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity) {
        return res.status(400).json({ error: "Each item must have menu_item_id and quantity" });
      }

      await pool.query(
        `UPDATE menu_items 
         SET quantity = GREATEST(quantity - $1, 0)
         WHERE id = $2`,
        [item.quantity, item.menu_item_id]
      );
    }

    res.json({ success: true, message: "Inventory updated" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

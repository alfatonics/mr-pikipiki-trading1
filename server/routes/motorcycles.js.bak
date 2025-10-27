import express from "express";
import Motorcycle from "../models/Motorcycle.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all motorcycles
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("Motorcycles API requested by user:", req.user.username);
    const { status, brand, supplier } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (brand) filter.brand = brand;
    if (supplier) filter.supplierId = supplier;

    const motorcycles = await Motorcycle.findAll(filter);

    console.log(`Found ${motorcycles.length} motorcycles`);
    res.json(motorcycles);
  } catch (error) {
    console.error("Motorcycles API error:", error);
    res.status(500).json({ error: "Failed to fetch motorcycles" });
  }
});

// Get single motorcycle
router.get("/:id", authenticate, async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findById(req.params.id);

    if (!motorcycle) {
      return res.status(404).json({ error: "Motorcycle not found" });
    }

    res.json(motorcycle);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch motorcycle" });
  }
});

// Create new motorcycle
router.post(
  "/",
  authenticate,
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const motorcycle = await Motorcycle.create(req.body);
      const populated = await Motorcycle.findById(motorcycle.id);
      res.status(201).json(populated);
    } catch (error) {
      if (error.code === "23505") {
        // PostgreSQL unique violation
        return res.status(400).json({ error: "Chassis number already exists" });
      }
      res.status(500).json({ error: "Failed to create motorcycle" });
    }
  }
);

// Update motorcycle
router.put(
  "/:id",
  authenticate,
  authorize("admin", "sales", "registration"),
  async (req, res) => {
    try {
      const motorcycle = await Motorcycle.update(req.params.id, req.body);

      if (!motorcycle) {
        return res.status(404).json({ error: "Motorcycle not found" });
      }

      // Get full data with relations
      const fullMotorcycle = await Motorcycle.findById(motorcycle.id);
      res.json(fullMotorcycle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update motorcycle" });
    }
  }
);

// Delete motorcycle
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const motorcycle = await Motorcycle.delete(req.params.id);

    if (!motorcycle) {
      return res.status(404).json({ error: "Motorcycle not found" });
    }

    res.json({ message: "Motorcycle deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete motorcycle" });
  }
});

// Get motorcycle statistics
router.get("/stats/summary", authenticate, async (req, res) => {
  try {
    const stats = await Motorcycle.countByStatus();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;

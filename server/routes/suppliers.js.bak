import express from "express";
import Supplier from "../models/Supplier.js";
import Motorcycle from "../models/Motorcycle.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all suppliers
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("Suppliers API requested by user:", req.user.username);
    const suppliers = await Supplier.findAll();
    console.log(`Found ${suppliers.length} suppliers`);
    res.json(suppliers);
  } catch (error) {
    console.error("Suppliers API error:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// Get single supplier with performance data
router.get("/:id", authenticate, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Get motorcycles from this supplier
    const motorcycles = await Motorcycle.findAll({ supplierId: req.params.id });
    const sold = motorcycles.filter((m) => m.status === "sold").length;
    const inStock = motorcycles.filter((m) => m.status === "in_stock").length;

    res.json({
      ...supplier,
      performance: {
        totalSupplied: motorcycles.length,
        sold,
        inStock,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

// Create new supplier
router.post(
  "/",
  authenticate,
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const supplier = await Supplier.create(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  }
);

// Update supplier
router.put(
  "/:id",
  authenticate,
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const supplier = await Supplier.update(req.params.id, req.body);

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  }
);

// Delete supplier
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    // Check if supplier has motorcycles
    const motorcycleCount = await Motorcycle.count({
      supplierId: req.params.id,
    });
    if (motorcycleCount > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete supplier with associated motorcycles" });
    }

    const supplier = await Supplier.delete(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;

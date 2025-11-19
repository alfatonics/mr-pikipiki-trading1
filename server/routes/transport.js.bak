import express from "express";
import Transport from "../models/Transport.js";
import Motorcycle from "../models/Motorcycle.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all transport records
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, driver } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (driver) filter.driverId = driver;

    const transports = await Transport.findAll(filter);
    res.json(transports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transport records" });
  }
});

// Get single transport record
router.get("/:id", authenticate, async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({ error: "Transport record not found" });
    }

    res.json(transport);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transport record" });
  }
});

// Create new transport record
router.post(
  "/",
  authenticate,
  authorize("admin", "transport", "sales"),
  async (req, res) => {
    try {
      const transport = await Transport.create(req.body);

      // Update motorcycle status to in_transit
      await Motorcycle.update(req.body.motorcycleId, { status: "in_transit" });

      res.status(201).json(transport);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transport record" });
    }
  }
);

// Update transport record
router.put(
  "/:id",
  authenticate,
  authorize("admin", "transport"),
  async (req, res) => {
    try {
      const transport = await Transport.update(req.params.id, req.body);

      if (!transport) {
        return res.status(404).json({ error: "Transport record not found" });
      }

      // If transport is completed, update motorcycle status
      if (req.body.status === "delivered") {
        const fullTransport = await Transport.findById(req.params.id);
        await Motorcycle.update(fullTransport.motorcycleId, { status: "sold" });
      }

      res.json(transport);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transport record" });
    }
  }
);

// Delete transport record
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const transport = await Transport.delete(req.params.id);

    if (!transport) {
      return res.status(404).json({ error: "Transport record not found" });
    }

    res.json({ message: "Transport record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transport record" });
  }
});

export default router;

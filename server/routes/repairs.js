import express from "express";
import Repair from "../models/Repair.js";
import Motorcycle from "../models/Motorcycle.js";
import Task from "../models/Task.js";
import { authenticate, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get all repairs
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, mechanic, motorcycle } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (mechanic) filter.mechanicId = mechanic;
    if (motorcycle) filter.motorcycleId = motorcycle;

    const repairs = await Repair.findAll(filter);
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repairs" });
  }
});

// Get single repair
router.get("/:id", authenticate, async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);

    if (!repair) {
      return res.status(404).json({ error: "Repair record not found" });
    }

    // Get spare parts
    const spareParts = await Repair.getSpareParts(req.params.id);

    res.json({
      ...repair,
      spareParts,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repair record" });
  }
});

// Create new repair
router.post(
  "/",
  authenticate,
  authorize("admin", "mechanic"),
  async (req, res) => {
    try {
      console.log("Creating repair with data:", req.body);

      const {
        motorcycleId,
        mechanicId,
        description,
        repairType,
        spareParts,
        laborCost,
        notes,
      } = req.body;

      // Create repair
      const repair = await Repair.create({
        motorcycleId,
        mechanicId,
        description,
        repairType,
        startDate: new Date(),
        status: "pending",
        laborCost: laborCost || 0,
        totalCost: laborCost || 0,
        notes,
      });

      // Add spare parts if provided
      if (spareParts && spareParts.length > 0) {
        for (const part of spareParts) {
          await Repair.addSparePart(repair.id, part);
        }
      }

      // Update motorcycle status
      await Motorcycle.update(motorcycleId, { status: "in_repair" });

      res.status(201).json(repair);
    } catch (error) {
      console.error("Error creating repair:", error);
      res.status(500).json({ error: "Failed to create repair" });
    }
  }
);

// Update repair
router.put(
  "/:id",
  authenticate,
  authorize("admin", "mechanic"),
  async (req, res) => {
    try {
      const repair = await Repair.update(req.params.id, req.body);

      if (!repair) {
        return res.status(404).json({ error: "Repair record not found" });
      }

      if (req.body.status) {
        const fullRepair = await Repair.findById(req.params.id);

        if (req.body.status === "completed" && fullRepair?.motorcycleId) {
          await Motorcycle.update(fullRepair.motorcycleId, {
            status: "in_stock",
          });
        }

        const allowedStatuses = ["pending", "in_progress", "completed"];
        if (allowedStatuses.includes(req.body.status)) {
          await Task.updateStatusByRepairId(req.params.id, req.body.status);
        }
      }

      res.json(repair);
    } catch (error) {
      res.status(500).json({ error: "Failed to update repair" });
    }
  }
);

// Delete repair
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const repair = await Repair.delete(req.params.id);

    if (!repair) {
      return res.status(404).json({ error: "Repair record not found" });
    }

    res.json({ message: "Repair deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete repair" });
  }
});

// Add spare part to repair
router.post(
  "/:id/spare-parts",
  authenticate,
  authorize("admin", "mechanic"),
  async (req, res) => {
    try {
      const sparePart = await Repair.addSparePart(req.params.id, req.body);
      res.status(201).json(sparePart);
    } catch (error) {
      res.status(500).json({ error: "Failed to add spare part" });
    }
  }
);

// Register repair details (mechanic)
router.post(
  "/:id/register-details",
  authenticate,
  authorize("mechanic"),
  upload.single("proofOfWork"),
  async (req, res) => {
    try {
      const repair = await Repair.findById(req.params.id);
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }

      // Parse form data
      const spareParts = JSON.parse(req.body.spareParts || "[]");
      const laborHours = parseFloat(req.body.laborHours) || 0;
      const laborCost = parseFloat(req.body.laborCost) || 0;
      const workDescription = req.body.workDescription || "";
      const issuesFound = req.body.issuesFound || "";
      const recommendations = req.body.recommendations || "";
      const proofOfWork = req.file ? `/uploads/${req.file.filename}` : null;

      // Calculate total cost
      const sparePartsCost = spareParts.reduce(
        (sum, part) =>
          sum + (parseFloat(part.cost) || 0) * (parseInt(part.quantity) || 1),
        0
      );
      const totalCost = laborCost + sparePartsCost;

      // Update spare parts
      await Repair.clearSpareParts(req.params.id);
      for (const part of spareParts) {
        if (part.name && part.cost > 0) {
          await Repair.addSparePart(req.params.id, part);
        }
      }

      // Update repair
      await Repair.update(req.params.id, {
        laborHours,
        laborCost,
        totalCost,
        workDescription,
        issuesFound,
        recommendations,
        detailsRegistered: true,
        status: "awaiting_details_approval",
        proofOfWork,
      });

      const updatedRepair = await Repair.findById(req.params.id);
      res.json(updatedRepair);
    } catch (error) {
      console.error("Error registering repair details:", error);
      res.status(500).json({ error: "Failed to register repair details" });
    }
  }
);

// Complete repair
router.post(
  "/:id/complete",
  authenticate,
  authorize("mechanic", "admin"),
  async (req, res) => {
    try {
      const repair = await Repair.findById(req.params.id);
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }

      await Repair.update(req.params.id, {
        status: "completed",
        completionDate: new Date(),
      });

      // Update motorcycle status
      if (repair.motorcycleId) {
        await Motorcycle.update(repair.motorcycleId, {
          status: "in_stock",
        });
      }

      // Update task status
      await Task.updateStatusByRepairId(req.params.id, "completed");

      const updatedRepair = await Repair.findById(req.params.id);
      res.json(updatedRepair);
    } catch (error) {
      console.error("Error completing repair:", error);
      res.status(500).json({ error: "Failed to complete repair" });
    }
  }
);

export default router;

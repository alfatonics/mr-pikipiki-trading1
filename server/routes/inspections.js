import express from "express";
import Inspection from "../models/Inspection.js";
import Task from "../models/Task.js";
import Repair from "../models/Repair.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all inspections
router.get("/", authenticate, async (req, res) => {
  try {
    const { motorcycleId, contractId, status } = req.query;
    const filter = {};

    if (motorcycleId) filter.motorcycleId = motorcycleId;
    if (contractId) filter.contractId = contractId;
    if (status) filter.status = status;

    const inspections = await Inspection.findAll(filter);
    res.json(inspections);
  } catch (error) {
    console.error("Inspections API error:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// Get single inspection
router.get("/:id", authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    res.json(inspection);
  } catch (error) {
    console.error("Inspection API error:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
});

// Create new inspection
router.post("/", authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.create({
      ...req.body,
      inspectionDate:
        req.body.inspectionDate || new Date().toISOString().split("T")[0],
    });
    res.status(201).json(inspection);
  } catch (error) {
    console.error("Error creating inspection:", error);
    res.status(500).json({ error: "Failed to create inspection" });
  }
});

// Update inspection
router.put("/:id", authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.update(req.params.id, req.body);

    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    res.json(inspection);
  } catch (error) {
    console.error("Error updating inspection:", error);
    res.status(500).json({ error: "Failed to update inspection" });
  }
});

// Delete inspection
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.delete(req.params.id);

    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    res.json({ message: "Inspection deleted successfully" });
  } catch (error) {
    console.error("Error deleting inspection:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
});

// Create repair task from inspection (Gidion -> Dito)
router.post(
  "/:id/assign-task",
  authenticate,
  authorize("admin", "transport"),
  async (req, res) => {
    try {
      const inspection = await Inspection.findById(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      const { mechanicId, problemDescription, priority, dueDate, notes } =
        req.body;

      if (!mechanicId) {
        return res.status(400).json({ error: "Mechanic ID is required" });
      }

      // Create repair record for mechanic workflow
      const repair = await Repair.create({
        motorcycleId: inspection.motorcycleId,
        mechanicId,
        description:
          problemDescription ||
          `Repair task for inspection ${inspection.id.substring(0, 6)}`,
        repairType: "engine_repair",
        startDate: new Date(),
        status: "pending",
        notes,
      });

      // Create task for task management
      const task = await Task.create({
        taskType: "repair",
        title: `Repair ${inspection.motorcycle?.brand || ""} ${
          inspection.motorcycle?.model || ""
        }`,
        description:
          problemDescription ||
          inspection.notes ||
          "Repair task generated from inspection",
        source: inspection.originLocation || "Inspection",
        motorcycleId: inspection.motorcycleId,
        inspectionId: inspection.id,
        repairId: repair.id,
        assignedBy: req.user.id,
        assignedTo: mechanicId,
        priority: priority || "medium",
        dueDate,
        problemDescription:
          problemDescription || inspection.notes || inspection.status,
        location: inspection.originLocation || inspection.status,
        notes,
      });

      res.status(201).json({ task, repair });
    } catch (error) {
      console.error("Error creating task from inspection:", error);
      res
        .status(500)
        .json({ error: "Failed to create repair task from inspection" });
    }
  }
);

export default router;

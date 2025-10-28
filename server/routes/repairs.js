import express from "express";
import Repair from "../models/Repair.js";
import Motorcycle from "../models/Motorcycle.js";
import Approval from "../models/Approval.js";
import { authenticate, authorize } from "../middleware/auth.js";

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

      // If repair is completed, update motorcycle status
      if (req.body.status === "completed") {
        const fullRepair = await Repair.findById(req.params.id);
        await Motorcycle.update(fullRepair.motorcycleId, {
          status: "in_stock",
        });
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

// Start work on repair
router.post(
  "/:id/start-work",
  authenticate,
  authorize("admin", "mechanic"),
  async (req, res) => {
    try {
      const repair = await Repair.update(req.params.id, { status: 'in_progress' });
      
      if (!repair) {
        return res.status(404).json({ error: "Repair record not found" });
      }

      res.json(repair);
    } catch (error) {
      res.status(500).json({ error: "Failed to start repair" });
    }
  }
);

// Register repair details
router.post(
  "/:id/register-details",
  authenticate,
  authorize("admin", "mechanic"),
  async (req, res) => {
    try {
      const { workDescription, issuesFound, recommendations, spareParts, laborCost, laborHours } = req.body;
      
      // Calculate total cost
      let totalCost = parseFloat(laborCost) || 0;
      if (spareParts && spareParts.length > 0) {
        const sparePartsCost = spareParts.reduce((sum, part) => sum + (parseFloat(part.cost) * parseInt(part.quantity)), 0);
        totalCost += sparePartsCost;
      }

      // Update repair with details
      const repair = await Repair.update(req.params.id, {
        workDescription,
        issuesFound,
        recommendations,
        laborCost: parseFloat(laborCost) || 0,
        laborHours: parseFloat(laborHours) || 0,
        totalCost,
        detailsRegistered: true,
        status: 'awaiting_details_approval'
      });

      if (!repair) {
        return res.status(404).json({ error: "Repair record not found" });
      }

      // Add spare parts if provided
      if (spareParts && spareParts.length > 0) {
        for (const part of spareParts) {
          if (part.name && part.quantity && part.cost) {
            await Repair.addSparePart(req.params.id, part);
          }
        }
      }

      // Create approval record for repair details
      const fullRepair = await Repair.findById(req.params.id);
      if (fullRepair) {
        await Approval.create({
          approvalType: 'repair_complete',
          entityType: 'Repair',
          entityId: req.params.id,
          proposedData: {
            workDescription,
            issuesFound,
            recommendations,
            laborCost: parseFloat(laborCost) || 0,
            laborHours: parseFloat(laborHours) || 0,
            totalCost,
            spareParts: spareParts || []
          },
          originalData: {
            workDescription: fullRepair.workDescription,
            issuesFound: fullRepair.issuesFound,
            recommendations: fullRepair.recommendations,
            laborCost: fullRepair.laborCost,
            laborHours: fullRepair.laborHours,
            totalCost: fullRepair.totalCost
          },
          status: 'pending_sales',
          requestedBy: req.user.id,
          description: `Repair details submitted for ${fullRepair.motorcycleBrand || 'Unknown'} ${fullRepair.motorcycleModel || ''} - ${fullRepair.description}`,
          notes: `Total cost: TZS ${totalCost.toLocaleString()}`
        });
      }

      res.json(repair);
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
  authorize("admin", "mechanic"),
  async (req, res) => {
    try {
      const repair = await Repair.update(req.params.id, { 
        status: 'completed',
        completionDate: new Date()
      });
      
      if (!repair) {
        return res.status(404).json({ error: "Repair record not found" });
      }

      // Update motorcycle status back to in_stock
      const fullRepair = await Repair.findById(req.params.id);
      if (fullRepair) {
        await Motorcycle.update(fullRepair.motorcycleId, { status: "in_stock" });
      }

      res.json(repair);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete repair" });
    }
  }
);

// Fix approved repairs endpoint (temporary)
export default router;

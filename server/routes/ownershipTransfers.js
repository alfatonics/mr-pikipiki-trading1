import express from "express";
import OwnershipTransfer from "../models/OwnershipTransfer.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all ownership transfers
router.get("/", authenticate, async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.createdBy) filters.createdBy = req.query.createdBy;
    if (req.query.motorcycleId) filters.motorcycleId = req.query.motorcycleId;
    if (req.query.search) filters.search = req.query.search;

    const transfers = await OwnershipTransfer.findAll(filters);
    res.json(transfers);
  } catch (error) {
    console.error("Error fetching ownership transfers:", error);
    res.status(500).json({ error: "Failed to fetch ownership transfers" });
  }
});

// Get single ownership transfer
router.get("/:id", authenticate, async (req, res) => {
  try {
    const transfer = await OwnershipTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ error: "Ownership transfer not found" });
    }
    res.json(transfer);
  } catch (error) {
    console.error("Error fetching ownership transfer:", error);
    res.status(500).json({ error: "Failed to fetch ownership transfer" });
  }
});

// Create new ownership transfer (registration role)
router.post(
  "/",
  authenticate,
  authorize("registration", "admin"),
  async (req, res) => {
    try {
      const transfer = await OwnershipTransfer.create({
        ...req.body,
        createdBy: req.user.id,
      });
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating ownership transfer:", error);
      res.status(500).json({ error: "Failed to create ownership transfer" });
    }
  }
);

// Update ownership transfer
router.put(
  "/:id",
  authenticate,
  authorize("registration", "admin"),
  async (req, res) => {
    try {
      const transfer = await OwnershipTransfer.update(req.params.id, req.body);
      if (!transfer) {
        return res.status(404).json({ error: "Ownership transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Error updating ownership transfer:", error);
      res.status(500).json({ error: "Failed to update ownership transfer" });
    }
  }
);

// Approve ownership transfer (admin only)
router.post(
  "/:id/approve",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const transfer = await OwnershipTransfer.approve(
        req.params.id,
        req.user.id
      );
      if (!transfer) {
        return res.status(404).json({ error: "Ownership transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Error approving ownership transfer:", error);
      res.status(500).json({ error: "Failed to approve ownership transfer" });
    }
  }
);

// Delete ownership transfer
router.delete(
  "/:id",
  authenticate,
  authorize("registration", "admin"),
  async (req, res) => {
    try {
      const result = await OwnershipTransfer.delete(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Ownership transfer not found" });
      }
      res.json({ message: "Ownership transfer deleted successfully" });
    } catch (error) {
      console.error("Error deleting ownership transfer:", error);
      res.status(500).json({ error: "Failed to delete ownership transfer" });
    }
  }
);

export default router;






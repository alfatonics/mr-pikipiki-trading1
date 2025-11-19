import express from "express";
import RepairBill from "../models/RepairBill.js";
import Repair from "../models/Repair.js";
import { authenticate, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get bills
router.get("/", authenticate, async (req, res) => {
  try {
    const filters = {
      mechanicId: req.query.mechanicId,
      status: req.query.status,
      repairId: req.query.repairId,
      motorcycleId: req.query.motorcycleId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    const bills = await RepairBill.findAll(filters);
    res.json(bills);
  } catch (error) {
    console.error("Error fetching repair bills:", error);
    res.status(500).json({ error: "Failed to fetch repair bills" });
  }
});

// Get single bill
router.get("/:id", authenticate, async (req, res) => {
  try {
    const bill = await RepairBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Repair bill not found" });
    }
    res.json(bill);
  } catch (error) {
    console.error("Error fetching repair bill:", error);
    res.status(500).json({ error: "Failed to fetch repair bill" });
  }
});

// Create bill (mechanic)
router.post(
  "/",
  authenticate,
  authorize("mechanic"),
  upload.single("proofOfWork"),
  async (req, res) => {
    try {
      // Ensure repair belongs to mechanic
      const repair = await Repair.findById(req.body.repairId);
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }
      if (repair.mechanicId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "You can only create bills for your repairs" });
      }

      const laborCost = parseFloat(req.body.laborCost || 0);
      const sparePartsCost = parseFloat(req.body.sparePartsCost || 0);

      const bill = await RepairBill.create({
        repairId: req.body.repairId,
        mechanicId: req.user.id,
        motorcycleId: repair.motorcycleId,
        laborCost,
        sparePartsCost,
        totalAmount:
          req.body.totalAmount !== undefined
            ? parseFloat(req.body.totalAmount)
            : laborCost + sparePartsCost,
        currency: req.body.currency || "TZS",
        description: req.body.description,
        proofOfWork: req.file ? req.file.path : req.body.proofOfWork,
        repairDate:
          req.body.repairDate || new Date().toISOString().split("T")[0],
        sentBy: req.user.id,
        notes: req.body.notes,
      });
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error creating repair bill:", error);
      res.status(500).json({ error: "Failed to create repair bill" });
    }
  }
);

// Send bill to cashier
router.post(
  "/:id/send",
  authenticate,
  authorize("mechanic"),
  async (req, res) => {
    try {
      const bill = await RepairBill.sendToCashier(req.params.id, req.user.id);
      if (!bill) {
        return res.status(404).json({ error: "Repair bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error sending bill:", error);
      res.status(500).json({ error: "Failed to send bill" });
    }
  }
);

// Approve bill payment (cashier/admin)
router.post(
  "/:id/approve",
  authenticate,
  authorize("cashier", "admin"),
  async (req, res) => {
    try {
      const bill = await RepairBill.approvePayment(req.params.id, req.user.id);
      if (!bill) {
        return res.status(404).json({ error: "Repair bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error approving bill:", error);
      res.status(500).json({ error: "Failed to approve bill" });
    }
  }
);

// Reject bill
router.post(
  "/:id/reject",
  authenticate,
  authorize("cashier", "admin"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const bill = await RepairBill.rejectPayment(
        req.params.id,
        req.user.id,
        reason
      );
      if (!bill) {
        return res.status(404).json({ error: "Repair bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error rejecting bill:", error);
      res.status(500).json({ error: "Failed to reject bill" });
    }
  }
);

// Mark as paid
router.post(
  "/:id/paid",
  authenticate,
  authorize("cashier", "admin"),
  async (req, res) => {
    try {
      const bill = await RepairBill.markAsPaid(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: "Repair bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      res.status(500).json({ error: "Failed to mark bill as paid" });
    }
  }
);

export default router;

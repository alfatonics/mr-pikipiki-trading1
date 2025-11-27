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

    // If frontend asks for bills approved by current cashier/user
    if (req.query.approvedByMe === "true") {
      filters.paymentApprovedBy = req.user.id;
    }

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

    // Get repair details with spare parts
    if (bill.repairId) {
      const Repair = (await import("../models/Repair.js")).default;
      const repair = await Repair.findById(bill.repairId);

      if (repair) {
        // Get spare parts for this repair
        const spareParts = await Repair.getSpareParts(bill.repairId);
        bill.repair = {
          ...repair,
          spareParts: spareParts || [],
        };
      }
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

// Approve bill payment (ADMIN ONLY - required before cashier can pay)
router.post(
  "/:id/approve",
  authenticate,
  authorize("admin"),
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

// Reject bill (ADMIN ONLY)
router.post(
  "/:id/reject",
  authenticate,
  authorize("admin"),
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

// Cashier approves payment (after receiving bill)
router.post(
  "/:id/approve-payment",
  authenticate,
  authorize("cashier", "secretary,cashier", "admin"),
  async (req, res) => {
    try {
      const bill = await RepairBill.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: "Repair bill not found" });
      }

      if (bill.status !== "sent_to_cashier") {
        return res
          .status(400)
          .json({ error: "Bill is not pending cashier approval" });
      }

      // Update bill status to payment_approved and record who approved
      await RepairBill.approvePayment(req.params.id, req.user.id);

      // Get repair details to fetch motorcycle info
      const repair = await Repair.findById(bill.repairId);

      // Import Motorcycle and Message models
      const Motorcycle = (await import("../models/Motorcycle.js")).default;
      const Message = (await import("../models/Message.js")).default;
      const User = (await import("../models/User.js")).default;

      const motorcycle = repair?.motorcycleId
        ? await Motorcycle.findById(repair.motorcycleId)
        : null;

      // Calculate total costs
      const purchasePrice = parseFloat(motorcycle?.purchasePrice || 0);
      const repairCost = parseFloat(bill.totalAmount || 0);
      const otherCosts = parseFloat(motorcycle?.otherCosts || 0);
      const totalCost = purchasePrice + repairCost + otherCosts;

      // Update motorcycle with repair cost and total cost
      if (motorcycle) {
        await Motorcycle.update(motorcycle.id, {
          repairCost: repairCost,
          totalCost: totalCost,
          pricingStatus: "pending_pricing",
        });
      }

      // Send notification to admin with cost breakdown
      const admins = await User.findAll({ role: "admin", isActive: true });

      for (const admin of admins) {
        const motorcycleInfo = motorcycle
          ? `${motorcycle.brand} ${motorcycle.model} (${motorcycle.chassisNumber})`
          : "Pikipiki";

        const messageBody = `Cashier amethibitisha malipo ya matengenezo kwa ${motorcycleInfo}.

📊 MUHTASARI WA GHARAMA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Bei ya Manunuzi: TZS ${purchasePrice.toLocaleString()}
• Gharama za Matengenezo: TZS ${repairCost.toLocaleString()}
• Gharama Nyingine: TZS ${otherCosts.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 JUMLA YA GHARAMA: TZS ${totalCost.toLocaleString()}

Tafadhali weka FAIDA (profit margin) ili kupata bei ya mauzo.`;

        await Message.create({
          senderId: req.user.id,
          receiverId: admin.id,
          subject: `Malipo Yamethibitishwa - ${motorcycleInfo}`,
          message: messageBody,
          relatedEntityType: "Motorcycle",
          relatedEntityId: motorcycle?.id || null,
          priority: "high",
        });
      }

      const updatedBill = await RepairBill.findById(req.params.id);
      res.json(updatedBill);
    } catch (error) {
      console.error("Error approving payment:", error);
      res.status(500).json({ error: "Failed to approve payment" });
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

import express from "express";
import Loan from "../models/Loan.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all loans
router.get("/", authenticate, async (req, res) => {
  try {
    const filters = {
      loanType: req.query.loanType,
      status: req.query.status,
      personType: req.query.personType,
      search: req.query.search,
    };
    const loans = await Loan.findAll(filters);
    res.json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

// Get single loan
router.get("/:id", authenticate, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.json(loan);
  } catch (error) {
    console.error("Error fetching loan:", error);
    res.status(500).json({ error: "Failed to fetch loan" });
  }
});

// Get loans summary
router.get("/summary/stats", authenticate, async (req, res) => {
  try {
    const summary = await Loan.getSummary();
    res.json(summary);
  } catch (error) {
    console.error("Error fetching loans summary:", error);
    res.status(500).json({ error: "Failed to fetch loans summary" });
  }
});

// Create loan
router.post("/", authenticate, async (req, res) => {
  try {
    const loan = await Loan.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json(loan);
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ error: "Failed to create loan" });
  }
});

// Update loan
router.put("/:id", authenticate, async (req, res) => {
  try {
    const loan = await Loan.update(req.params.id, req.body);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.json(loan);
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({ error: "Failed to update loan" });
  }
});

// Add payment to loan
router.post("/:id/payments", authenticate, async (req, res) => {
  try {
    const { amount, paymentDate, notes } = req.body;
    const loan = await Loan.addPayment(
      req.params.id,
      amount,
      paymentDate || new Date().toISOString().split("T")[0],
      notes,
      req.user.id
    );
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.json(loan);
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ error: "Failed to add payment" });
  }
});

// Delete loan
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    // Soft delete by updating status
    const loan = await Loan.update(req.params.id, { status: "cancelled" });
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }
    res.json({ message: "Loan deleted successfully" });
  } catch (error) {
    console.error("Error deleting loan:", error);
    res.status(500).json({ error: "Failed to delete loan" });
  }
});

export default router;





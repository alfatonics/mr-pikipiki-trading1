import express from "express";
import FinanceTransaction from "../models/FinanceTransaction.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all transactions
router.get("/transactions", authenticate, async (req, res) => {
  try {
    const { transactionType, category, dateFrom, dateTo, department } =
      req.query;
    const filter = {};

    if (transactionType) filter.transactionType = transactionType;
    if (category) filter.category = category;
    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;
    if (department) filter.department = department;

    const transactions = await FinanceTransaction.findAll(filter);
    res.json(transactions);
  } catch (error) {
    console.error("Finance transactions API error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Get single transaction
router.get("/transactions/:id", authenticate, async (req, res) => {
  try {
    const transaction = await FinanceTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Finance transaction API error:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// Create new transaction - Everyone can create, but cash_out requires admin approval (except petty cash)
router.post("/transactions", authenticate, async (req, res) => {
  try {
    // Categories that require admin approval before cashier payment:
    // repairs, motorcycle payments, advertisements, broker fees, registration, etc.
    // Petty cash can bypass approval
    const requiresApprovalCategories = [
      "repairs",
      "purchase_expense", // Motorcycle payments
      "broker_fees",
      "registration",
      "plates",
      "transport", // If it's a significant amount
      "debts",
    ];

    const isPettyCash =
      req.body.category === "petty_cash" ||
      (req.body.category === "other_expense" &&
        parseFloat(req.body.amount || 0) <= 50000);

    // For cash_out transactions, set status based on category
    // Petty cash can be completed directly, others require admin approval
    let status;
    if (req.body.transactionType === "cash_out") {
      if (isPettyCash) {
        status = "completed"; // Petty cash bypasses approval
      } else if (requiresApprovalCategories.includes(req.body.category)) {
        status = "pending"; // Requires admin approval
      } else {
        // For other categories, check if amount is small (petty cash threshold)
        const amount = parseFloat(req.body.amount || 0);
        status = amount <= 50000 ? "completed" : "pending";
      }
    } else {
      status = req.body.status || "completed"; // Cash_in can be completed directly
    }

    const transaction = await FinanceTransaction.create({
      ...req.body,
      createdBy: req.user.id,
      date: req.body.date || new Date().toISOString().split("T")[0],
      status: status,
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// Get pending money requests (for admin approval) - includes repair bills and finance transactions
router.get(
  "/pending-requests",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      // Get pending finance transactions
      const transactions = await FinanceTransaction.findAll({
        transactionType: "cash_out",
        status: "pending",
      });

      // Get pending repair bills (sent to cashier but not approved)
      const RepairBill = (await import("../models/RepairBill.js")).default;
      const bills = await RepairBill.findAll({
        status: "sent_to_cashier",
      });

      // Format bills as money requests
      const billRequests = bills.map((bill) => ({
        id: bill.id,
        type: "repair_bill",
        billNumber: bill.billNumber,
        amount: bill.totalAmount,
        currency: bill.currency || "TZS",
        category: "repairs",
        description: `Repair bill ${bill.billNumber}: ${bill.description}`,
        date: bill.repairDate,
        createdBy: bill.sentBy,
        createdByName: bill.sentByUser?.name || "N/A",
        motorcycle: bill.motorcycle,
        mechanic: bill.mechanic,
        status: bill.status,
        createdAt: bill.createdAt,
      }));

      // Combine and sort by date
      const allRequests = [...transactions, ...billRequests].sort(
        (a, b) =>
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );

      res.json(allRequests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  }
);

// Approve money request (admin only)
router.post(
  "/transactions/:id/approve",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const transaction = await FinanceTransaction.approve(
        req.params.id,
        req.user.id
      );
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error approving transaction:", error);
      res.status(500).json({ error: "Failed to approve transaction" });
    }
  }
);

// Reject money request (admin only)
router.post(
  "/transactions/:id/reject",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const transaction = await FinanceTransaction.reject(
        req.params.id,
        req.user.id,
        reason
      );
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      res.status(500).json({ error: "Failed to reject transaction" });
    }
  }
);

// Pay approved request (cashier only)
router.post(
  "/transactions/:id/pay",
  authenticate,
  authorize("cashier", "admin"),
  async (req, res) => {
    try {
      const transaction = await FinanceTransaction.findById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "approved") {
        return res
          .status(400)
          .json({ error: "Transaction must be approved before payment" });
      }

      const paidTransaction = await FinanceTransaction.update(req.params.id, {
        status: "completed",
      });

      res.json(paidTransaction);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  }
);

// Update transaction
router.put("/transactions/:id", authenticate, async (req, res) => {
  try {
    const transaction = await FinanceTransaction.update(
      req.params.id,
      req.body
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// Delete transaction
router.delete(
  "/transactions/:id",
  authenticate,
  authorize("admin", "cashier"),
  async (req, res) => {
    try {
      const transaction = await FinanceTransaction.delete(req.params.id);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  }
);

// Get summary (income/expense by category)
router.get("/summary", authenticate, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;

    const summary = await FinanceTransaction.getSummary(filter);
    res.json(summary);
  } catch (error) {
    console.error("Finance summary API error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Get cash flow
router.get("/cashflow", authenticate, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;

    const cashFlow = await FinanceTransaction.getCashFlow(filter);
    res.json(cashFlow);
  } catch (error) {
    console.error("Cash flow API error:", error);
    res.status(500).json({ error: "Failed to fetch cash flow" });
  }
});

// Get balance (total income - total expenses)
router.get("/balance", authenticate, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = {};

    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;

    const income = await FinanceTransaction.findAll({
      ...filter,
      transactionType: "cash_in",
    });
    const expenses = await FinanceTransaction.findAll({
      ...filter,
      transactionType: "cash_out",
    });

    const totalIncome = income.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );
    const balance = totalIncome - totalExpenses;

    res.json({
      totalIncome,
      totalExpenses,
      balance,
      incomeCount: income.length,
      expenseCount: expenses.length,
    });
  } catch (error) {
    console.error("Balance API error:", error);
    res.status(500).json({ error: "Failed to calculate balance" });
  }
});

export default router;

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

// Create new transaction
router.post("/transactions", authenticate, async (req, res) => {
  try {
    const transaction = await FinanceTransaction.create({
      ...req.body,
      createdBy: req.user.id,
      date: req.body.date || new Date().toISOString().split("T")[0],
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

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



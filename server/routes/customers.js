import express from "express";
import Customer from "../models/Customer.js";
import Motorcycle from "../models/Motorcycle.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/database.js";

const router = express.Router();

// Get all customers with purchase statistics
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("Customers API requested by user:", req.user.username);
    const { includeStats, budgetRange, city } = req.query;

    let customers;
    if (includeStats === "true") {
      customers = await Customer.findAllWithStats({ budgetRange, city });
    } else {
      customers = await Customer.findAll();
    }

    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error("Customers API error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get single customer with purchase history
router.get("/:id", authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get purchase history from contracts
    const purchaseHistory = await Customer.getPurchaseHistory(req.params.id);

    // Get purchase statistics
    const stats = await Customer.getPurchaseStats(req.params.id);

    res.json({
      ...customer,
      purchaseHistory,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Get customer purchase history
router.get("/:id/purchases", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const purchases = await Customer.getPurchaseHistory(req.params.id, {
      startDate,
      endDate,
      status,
    });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch purchase history" });
  }
});

// Get customer purchase statistics
router.get("/:id/stats", authenticate, async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const stats = await Customer.getPurchaseStats(req.params.id, period);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get budget range analysis
router.get("/analysis/budget-range", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    const end = endDate || new Date().toISOString().split("T")[0];

    const analysis = await Customer.getBudgetRangeAnalysis(start, end);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budget range analysis" });
  }
});

// Get average purchase by period
router.get("/analysis/average-purchase", authenticate, async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const analysis = await Customer.getAveragePurchaseByPeriod(period);
    res.json(analysis);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch average purchase analysis" });
  }
});

// Create new customer
router.post(
  "/",
  authenticate,
  authorize("admin", "sales", "secretary"),
  async (req, res) => {
    try {
      const customer = await Customer.create(req.body);
      res.status(201).json(customer);
    } catch (error) {
      if (error.code === "23505") {
        // PostgreSQL unique violation
        return res.status(400).json({ error: "ID number already exists" });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  }
);

// Update customer
router.put(
  "/:id",
  authenticate,
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const customer = await Customer.update(req.params.id, req.body);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  }
);

// Delete customer
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    // Check if customer has motorcycles
    const motorcycleCount = await Motorcycle.count({
      customerId: req.params.id,
    });
    if (motorcycleCount > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete customer with purchase history" });
    }

    const customer = await Customer.delete(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Search customers
router.get("/search/:query", authenticate, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const sql = `
      SELECT id, full_name as "fullName", phone, email, id_type as "idType", id_number as "idNumber",
             address, city, created_at as "createdAt", updated_at as "updatedAt"
      FROM customers
      WHERE full_name ILIKE $1 OR phone ILIKE $1 OR id_number ILIKE $1
      LIMIT 10
    `;
    const result = await query(sql, [`%${searchQuery}%`]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to search customers" });
  }
});

export default router;

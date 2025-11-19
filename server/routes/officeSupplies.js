import express from "express";
import OfficeSupply from "../models/OfficeSupply.js";
import { query } from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all office supplies
router.get(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const supplies = await OfficeSupply.findAll(req.query);
      res.json(supplies);
    } catch (error) {
      console.error("Error fetching office supplies:", error);
      res.status(500).json({ error: "Failed to fetch office supplies" });
    }
  }
);

// Get office supply by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const supply = await OfficeSupply.findById(req.params.id);
      if (!supply) {
        return res.status(404).json({ error: "Office supply not found" });
      }
      res.json(supply);
    } catch (error) {
      console.error("Error fetching office supply:", error);
      res.status(500).json({ error: "Failed to fetch office supply" });
    }
  }
);

// Create new office supply
router.post(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const supply = await OfficeSupply.create(req.body);
      res.status(201).json(supply);
    } catch (error) {
      console.error("Error creating office supply:", error);
      res.status(500).json({ error: "Failed to create office supply" });
    }
  }
);

// Update office supply
router.put(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const supply = await OfficeSupply.update(req.params.id, req.body);
      if (!supply) {
        return res.status(404).json({ error: "Office supply not found" });
      }
      res.json(supply);
    } catch (error) {
      console.error("Error updating office supply:", error);
      res.status(500).json({ error: "Failed to update office supply" });
    }
  }
);

// Record supply transaction (purchase, usage, etc.)
router.post(
  "/:id/transactions",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const {
        transactionType,
        quantity,
        unitCost,
        usedBy,
        department,
        purpose,
        supplier,
        invoiceNumber,
        notes,
      } = req.body;

      const supply = await OfficeSupply.findById(req.params.id);
      if (!supply) {
        return res.status(404).json({ error: "Office supply not found" });
      }

      const totalCost =
        (parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0);

      // Insert transaction
      const transactionSql = `
      INSERT INTO office_supply_transactions (
        supply_id, transaction_type, quantity, unit_cost, total_cost,
        used_by, department, purpose, supplier, invoice_number,
        recorded_by, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

      const transactionResult = await query(transactionSql, [
        req.params.id,
        transactionType,
        quantity,
        unitCost,
        totalCost,
        usedBy,
        department,
        purpose,
        supplier,
        invoiceNumber,
        req.user.id,
        notes,
      ]);

      // Update supply stock based on transaction type
      let newQuantity = parseFloat(supply.quantityInStock) || 0;
      if (transactionType === "purchase" || transactionType === "return") {
        newQuantity += parseFloat(quantity) || 0;
      } else if (transactionType === "usage") {
        newQuantity -= parseFloat(quantity) || 0;
      }

      // Update supply
      await OfficeSupply.update(req.params.id, {
        quantityInStock: Math.max(0, newQuantity),
        lastPurchasedDate:
          transactionType === "purchase"
            ? new Date().toISOString().split("T")[0]
            : supply.lastPurchasedDate,
        lastPurchasedCost:
          transactionType === "purchase" ? unitCost : supply.lastPurchasedCost,
      });

      res.status(201).json(transactionResult.rows[0]);
    } catch (error) {
      console.error("Error recording supply transaction:", error);
      res.status(500).json({ error: "Failed to record supply transaction" });
    }
  }
);

// Get supply transactions
router.get(
  "/:id/transactions",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const sql = `
      SELECT t.*, 
             u.full_name as user_name,
             s.item_name as supply_name
      FROM office_supply_transactions t
      LEFT JOIN users u ON t.used_by = u.id
      LEFT JOIN office_supplies s ON t.supply_id = s.id
      WHERE t.supply_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;
      const result = await query(sql, [req.params.id]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching supply transactions:", error);
      res.status(500).json({ error: "Failed to fetch supply transactions" });
    }
  }
);

// Delete office supply
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      await OfficeSupply.delete(req.params.id);
      res.json({ message: "Office supply deleted successfully" });
    } catch (error) {
      console.error("Error deleting office supply:", error);
      res.status(500).json({ error: "Failed to delete office supply" });
    }
  }
);

export default router;

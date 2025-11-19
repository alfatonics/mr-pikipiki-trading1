import express from "express";
import Repair from "../models/Repair.js";
import RepairBill from "../models/RepairBill.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/database.js";

const router = express.Router();

// Daily Repair Jobs Report
router.get(
  "/daily-jobs",
  authenticate,
  authorize("mechanic", "admin"),
  async (req, res) => {
    try {
      const { date, mechanicId } = req.query;
      const targetDate = date || new Date().toISOString().split("T")[0];
      const mechanic = mechanicId || req.user.id;

      const sql = `
      SELECT r.*, m.brand, m.model, m.chassis_number
      FROM repairs r
      LEFT JOIN motorcycles m ON r.motorcycle_id = m.id
      WHERE r.mechanic_id = $1
        AND DATE(r.start_date) = $2
      ORDER BY r.start_date DESC
    `;

      const result = await query(sql, [mechanic, targetDate]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching daily jobs:", error);
      res.status(500).json({ error: "Failed to fetch daily jobs" });
    }
  }
);

// Pending Jobs Report
router.get(
  "/pending-jobs",
  authenticate,
  authorize("mechanic", "admin"),
  async (req, res) => {
    try {
      const { mechanicId } = req.query;
      const mechanic = mechanicId || req.user.id;

      const repairs = await Repair.findAll({
        mechanicId: mechanic,
        status: "pending",
      });

      res.json(repairs);
    } catch (error) {
      console.error("Error fetching pending jobs:", error);
      res.status(500).json({ error: "Failed to fetch pending jobs" });
    }
  }
);

// Completed Jobs Report
router.get(
  "/completed-jobs",
  authenticate,
  authorize("mechanic", "admin"),
  async (req, res) => {
    try {
      const { mechanicId, dateFrom, dateTo } = req.query;
      const mechanic = mechanicId || req.user.id;

      let sql = `
      SELECT r.*, m.brand, m.model, m.chassis_number
      FROM repairs r
      LEFT JOIN motorcycles m ON r.motorcycle_id = m.id
      WHERE r.mechanic_id = $1 AND r.status = 'completed'
    `;
      const params = [mechanic];
      let paramCount = 2;

      if (dateFrom) {
        sql += ` AND DATE(r.completion_date) >= $${paramCount++}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        sql += ` AND DATE(r.completion_date) <= $${paramCount++}`;
        params.push(dateTo);
      }

      sql += ` ORDER BY r.completion_date DESC`;

      const result = await query(sql, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
      res.status(500).json({ error: "Failed to fetch completed jobs" });
    }
  }
);

// Bills Sent Report
router.get(
  "/bills-sent",
  authenticate,
  authorize("mechanic", "admin", "cashier"),
  async (req, res) => {
    try {
      const { mechanicId, dateFrom, dateTo } = req.query;
      const filters = {
        status: "sent_to_cashier",
      };

      if (mechanicId) {
        filters.mechanicId = mechanicId;
      } else if (req.user.role === "mechanic") {
        filters.mechanicId = req.user.id;
      }

      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const bills = await RepairBill.findAll(filters);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills sent:", error);
      res.status(500).json({ error: "Failed to fetch bills sent" });
    }
  }
);

// Payment Status Report
router.get(
  "/payment-status",
  authenticate,
  authorize("mechanic", "admin", "cashier"),
  async (req, res) => {
    try {
      const { mechanicId } = req.query;
      const filters = {};

      if (mechanicId) {
        filters.mechanicId = mechanicId;
      } else if (req.user.role === "mechanic") {
        filters.mechanicId = req.user.id;
      }

      const bills = await RepairBill.findAll(filters);

      const paid = bills.filter((b) => b.status === "paid");
      const awaiting = bills.filter(
        (b) => b.status === "sent_to_cashier" || b.status === "payment_approved"
      );

      res.json({
        paid: {
          count: paid.length,
          total: paid.reduce((sum, b) => sum + b.totalAmount, 0),
          bills: paid,
        },
        awaiting: {
          count: awaiting.length,
          total: awaiting.reduce((sum, b) => sum + b.totalAmount, 0),
          bills: awaiting,
        },
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      res.status(500).json({ error: "Failed to fetch payment status" });
    }
  }
);

// Spare Usage Report
router.get(
  "/spare-usage",
  authenticate,
  authorize("mechanic", "admin"),
  async (req, res) => {
    try {
      const { mechanicId, dateFrom, dateTo } = req.query;
      const mechanic = mechanicId || req.user.id;

      let sql = `
      SELECT 
        rsp.name,
        SUM(rsp.quantity) as total_quantity,
        SUM(rsp.cost * rsp.quantity) as total_cost,
        COUNT(DISTINCT rsp.repair_id) as used_in_repairs
      FROM repair_spare_parts rsp
      JOIN repairs r ON rsp.repair_id = r.id
      WHERE r.mechanic_id = $1
    `;
      const params = [mechanic];
      let paramCount = 2;

      if (dateFrom) {
        sql += ` AND DATE(r.start_date) >= $${paramCount++}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        sql += ` AND DATE(r.start_date) <= $${paramCount++}`;
        params.push(dateTo);
      }

      sql += `
      GROUP BY rsp.name
      ORDER BY total_cost DESC
    `;

      const result = await query(sql, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching spare usage:", error);
      res.status(500).json({ error: "Failed to fetch spare usage" });
    }
  }
);

export default router;

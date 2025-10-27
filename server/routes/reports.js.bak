import express from "express";
import Motorcycle from "../models/Motorcycle.js";
import Contract from "../models/Contract.js";
import Supplier from "../models/Supplier.js";
import Customer from "../models/Customer.js";
import Transport from "../models/Transport.js";
import Repair from "../models/Repair.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/database.js";

const router = express.Router();

// Sales report
router.get("/sales", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    let sql = `
      SELECT m.*, 
             s.name as "supplierName",
             c.full_name as "customerName", c.phone as "customerPhone"
      FROM motorcycles m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      LEFT JOIN customers c ON m.customer_id = c.id
      WHERE m.status = 'sold'
    `;

    const params = [];
    let paramCount = 1;

    if (startDate && endDate) {
      sql += ` AND m.sale_date >= $${paramCount} AND m.sale_date <= $${
        paramCount + 1
      }`;
      params.push(new Date(startDate), new Date(endDate));
      paramCount += 2;
    }

    sql += " ORDER BY m.sale_date DESC";

    const result = await query(sql, params);
    const sales = result.rows;

    const totalRevenue = sales.reduce(
      (sum, bike) => sum + (parseFloat(bike.selling_price) || 0),
      0
    );
    const totalProfit = sales.reduce(
      (sum, bike) =>
        sum +
        ((parseFloat(bike.selling_price) || 0) -
          (parseFloat(bike.purchase_price) || 0)),
      0
    );

    res.json({
      sales,
      summary: {
        total: sales.length,
        totalRevenue,
        totalProfit,
        averageProfit: sales.length > 0 ? totalProfit / sales.length : 0,
      },
    });
  } catch (error) {
    console.error("Sales report error:", error);
    res.status(500).json({ error: "Failed to generate sales report" });
  }
});

// Inventory report
router.get("/inventory", authenticate, async (req, res) => {
  try {
    const motorcycles = await Motorcycle.findAll();
    const statusCounts = await Motorcycle.countByStatus();

    const totalValue = motorcycles.reduce(
      (sum, bike) => sum + (parseFloat(bike.purchasePrice) || 0),
      0
    );
    const inStockValue = motorcycles
      .filter((bike) => bike.status === "in_stock")
      .reduce((sum, bike) => sum + (parseFloat(bike.purchasePrice) || 0), 0);

    res.json({
      motorcycles,
      summary: {
        total: motorcycles.length,
        totalValue,
        inStockValue,
        byStatus: statusCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate inventory report" });
  }
});

// Supplier performance report
router.get("/suppliers", authenticate, async (req, res) => {
  try {
    const sql = `
      SELECT s.*, 
             COUNT(m.id) as "totalSupplied",
             COUNT(CASE WHEN m.status = 'sold' THEN 1 END) as "sold",
             COUNT(CASE WHEN m.status = 'in_stock' THEN 1 END) as "inStock"
      FROM suppliers s
      LEFT JOIN motorcycles m ON s.id = m.supplier_id
      GROUP BY s.id
      ORDER BY "totalSupplied" DESC
    `;

    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate supplier report" });
  }
});

// Customer report
router.get("/customers", authenticate, async (req, res) => {
  try {
    const sql = `
      SELECT c.*,
             COUNT(m.id) as "totalPurchases",
             SUM(m.selling_price) as "totalSpent"
      FROM customers c
      LEFT JOIN motorcycles m ON c.id = m.customer_id
      GROUP BY c.id
      ORDER BY "totalPurchases" DESC
    `;

    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate customer report" });
  }
});

// Repairs report
router.get("/repairs", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = {};
    // Add date filtering if needed

    const repairs = await Repair.findAll(filter);

    const totalCost = repairs.reduce(
      (sum, repair) => sum + (parseFloat(repair.totalCost) || 0),
      0
    );
    const totalLabor = repairs.reduce(
      (sum, repair) => sum + (parseFloat(repair.laborCost) || 0),
      0
    );

    res.json({
      repairs,
      summary: {
        total: repairs.length,
        totalCost,
        totalLabor,
        averageCost: repairs.length > 0 ? totalCost / repairs.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate repairs report" });
  }
});

// Financial summary
router.get("/financial", authenticate, authorize("admin"), async (req, res) => {
  try {
    // Get sold motorcycles
    const soldBikes = await Motorcycle.findAll({ status: "sold" });
    const totalRevenue = soldBikes.reduce(
      (sum, bike) => sum + (parseFloat(bike.sellingPrice) || 0),
      0
    );
    const totalCost = soldBikes.reduce(
      (sum, bike) => sum + (parseFloat(bike.purchasePrice) || 0),
      0
    );
    const totalProfit = totalRevenue - totalCost;

    // Get all repairs
    const repairs = await Repair.findAll();
    const repairCosts = repairs.reduce(
      (sum, repair) => sum + (parseFloat(repair.totalCost) || 0),
      0
    );

    // Get transport costs
    const transports = await Transport.findAll();
    const transportCosts = transports.reduce(
      (sum, t) => sum + (parseFloat(t.transportCost) || 0),
      0
    );

    res.json({
      revenue: totalRevenue,
      costs: {
        purchases: totalCost,
        repairs: repairCosts,
        transport: transportCosts,
        total: totalCost + repairCosts + transportCosts,
      },
      profit: totalProfit - repairCosts - transportCosts,
      sales: {
        count: soldBikes.length,
        averagePrice:
          soldBikes.length > 0 ? totalRevenue / soldBikes.length : 0,
      },
    });
  } catch (error) {
    console.error("Financial report error:", error);
    res.status(500).json({ error: "Failed to generate financial report" });
  }
});

export default router;

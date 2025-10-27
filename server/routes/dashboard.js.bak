import express from "express";
import Motorcycle from "../models/Motorcycle.js";
import Contract from "../models/Contract.js";
import Supplier from "../models/Supplier.js";
import Customer from "../models/Customer.js";
import Transport from "../models/Transport.js";
import Repair from "../models/Repair.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Test endpoint
router.get("/test", authenticate, async (req, res) => {
  try {
    console.log("Dashboard test endpoint called by user:", req.user.username);
    res.json({
      message: "Dashboard API is working",
      user: req.user.username,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard test error:", error);
    res.status(500).json({ error: "Dashboard test failed" });
  }
});

// Debug endpoint
router.get("/debug", async (req, res) => {
  try {
    console.log("Dashboard debug endpoint called");

    const totalMotorcycles = await Motorcycle.count();
    const totalCustomers = await Customer.count();
    const totalSuppliers = await Supplier.count();

    res.json({
      message: "Database connection working",
      motorcycles: totalMotorcycles,
      customers: totalCustomers,
      suppliers: totalSuppliers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard debug error:", error);
    res
      .status(500)
      .json({ error: "Database connection failed", details: error.message });
  }
});

// Get dashboard statistics
router.get("/stats", authenticate, async (req, res) => {
  try {
    console.log("Dashboard stats requested by user:", req.user.username);

    // Get counts
    const totalMotorcycles = await Motorcycle.count();
    const inStock = await Motorcycle.count({ status: "in_stock" });
    const sold = await Motorcycle.count({ status: "sold" });
    const inRepair = await Motorcycle.count({ status: "in_repair" });
    const inTransit = await Motorcycle.count({ status: "in_transit" });
    const reserved = await Motorcycle.count({ status: "reserved" });

    const totalSuppliers = await Supplier.count();
    const activeSuppliers = await Supplier.count({ isActive: true });

    const totalCustomers = await Customer.count();
    const totalContracts = await Contract.count();
    const activeContracts = await Contract.count({ status: "active" });

    const totalTransports = await Transport.count();
    const pendingTransports = await Transport.count({ status: "pending" });

    const totalRepairs = await Repair.count();
    const pendingRepairs = await Repair.count({ status: "pending" });
    const inProgressRepairs = await Repair.count({ status: "in_progress" });

    // Get recent motorcycles
    const recentMotorcycles = await Motorcycle.findAll();
    const recent = recentMotorcycles.slice(0, 5);

    const stats = {
      motorcycles: {
        total: totalMotorcycles,
        inStock,
        sold,
        inRepair,
        inTransit,
        reserved,
        byStatus: [
          { status: "in_stock", count: inStock },
          { status: "sold", count: sold },
          { status: "in_repair", count: inRepair },
          { status: "in_transit", count: inTransit },
          { status: "reserved", count: reserved },
        ],
      },
      suppliers: {
        total: totalSuppliers,
        active: activeSuppliers,
      },
      customers: {
        total: totalCustomers,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
      },
      transport: {
        total: totalTransports,
        pending: pendingTransports,
      },
      repairs: {
        total: totalRepairs,
        pending: pendingRepairs,
        inProgress: inProgressRepairs,
      },
      recentMotorcycles: recent,
    };

    console.log("Dashboard stats compiled successfully");
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res
      .status(500)
      .json({
        error: "Failed to fetch dashboard statistics",
        details: error.message,
      });
  }
});

// Get inventory by status
router.get("/inventory", authenticate, async (req, res) => {
  try {
    const statusCounts = await Motorcycle.countByStatus();
    res.json(statusCounts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory data" });
  }
});

// Get sales summary
router.get("/sales-summary", authenticate, async (req, res) => {
  try {
    const soldMotorcycles = await Motorcycle.findAll({ status: "sold" });

    const totalSales = soldMotorcycles.length;
    const totalRevenue = soldMotorcycles.reduce(
      (sum, m) => sum + (parseFloat(m.sellingPrice) || 0),
      0
    );
    const averagePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    res.json({
      totalSales,
      totalRevenue,
      averagePrice,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales summary" });
  }
});

export default router;

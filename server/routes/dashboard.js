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

// Chart endpoints
router.get("/charts/monthly-sales", authenticate, async (req, res) => {
  try {
    // Get sold motorcycles from last 12 months
    const soldMotorcycles = await Motorcycle.findAll({ status: "sold" });
    
    // Group by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach(month => {
      monthlyData[month] = { month, sales: 0, revenue: 0 };
    });
    
    // Populate with actual data
    soldMotorcycles.forEach(motorcycle => {
      if (motorcycle.soldDate) {
        const date = new Date(motorcycle.soldDate);
        const month = months[date.getMonth()];
        monthlyData[month].sales += 1;
        monthlyData[month].revenue += parseFloat(motorcycle.sellingPrice) || 0;
      }
    });
    
    const chartData = Object.values(monthlyData);
    res.json(chartData);
  } catch (error) {
    console.error("Monthly sales chart error:", error);
    res.status(500).json({ error: "Failed to fetch monthly sales data" });
  }
});

router.get("/charts/inventory-status", authenticate, async (req, res) => {
  try {
    const inStock = await Motorcycle.count({ status: "in_stock" });
    const sold = await Motorcycle.count({ status: "sold" });
    const inRepair = await Motorcycle.count({ status: "in_repair" });
    const inTransit = await Motorcycle.count({ status: "in_transit" });
    const reserved = await Motorcycle.count({ status: "reserved" });
    
    const chartData = [
      { name: "In Stock", value: inStock },
      { name: "Sold", value: sold },
      { name: "In Repair", value: inRepair },
      { name: "In Transit", value: inTransit },
      { name: "Reserved", value: reserved },
    ];
    
    res.json(chartData);
  } catch (error) {
    console.error("Inventory status chart error:", error);
    res.status(500).json({ error: "Failed to fetch inventory status data" });
  }
});

router.get("/charts/top-suppliers", authenticate, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ isActive: true });
    
    // Get motorcycle count per supplier
    const supplierData = await Promise.all(
      suppliers.slice(0, 5).map(async (supplier) => {
        const count = await Motorcycle.count({ supplierId: supplier.id });
        return {
          name: supplier.name,
          motorcycles: count,
          rating: supplier.rating || 0,
        };
      })
    );
    
    res.json(supplierData);
  } catch (error) {
    console.error("Top suppliers chart error:", error);
    res.status(500).json({ error: "Failed to fetch top suppliers data" });
  }
});

router.get("/charts/repair-trends", authenticate, async (req, res) => {
  try {
    const repairs = await Repair.findAll();
    
    // Group by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach(month => {
      monthlyData[month] = { month, count: 0, cost: 0 };
    });
    
    repairs.forEach(repair => {
      if (repair.createdAt) {
        const date = new Date(repair.createdAt);
        const month = months[date.getMonth()];
        monthlyData[month].count += 1;
        monthlyData[month].cost += parseFloat(repair.cost) || 0;
      }
    });
    
    const chartData = Object.values(monthlyData);
    res.json(chartData);
  } catch (error) {
    console.error("Repair trends chart error:", error);
    res.status(500).json({ error: "Failed to fetch repair trends data" });
  }
});

export default router;

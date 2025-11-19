import express from "express";
import Motorcycle from "../models/Motorcycle.js";
import Contract from "../models/Contract.js";
import Supplier from "../models/Supplier.js";
import Customer from "../models/Customer.js";
import Transport from "../models/Transport.js";
import Repair from "../models/Repair.js";
import FinanceTransaction from "../models/FinanceTransaction.js";
import Meeting from "../models/Meeting.js";
import StaffAttendance from "../models/StaffAttendance.js";
import Document from "../models/Document.js";
import StaffTask from "../models/StaffTask.js";
import { authenticate } from "../middleware/auth.js";
import { query } from "../config/database.js";

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
  const startTime = Date.now();
  try {
    console.log("Dashboard stats requested by user:", req.user.username);

    // Run all independent count queries in parallel for better performance
    const [
      totalMotorcycles,
      inStock,
      sold,
      inRepair,
      inTransit,
      reserved,
      totalSuppliers,
      activeSuppliers,
      totalCustomers,
      totalContracts,
      activeContracts,
      totalTransports,
      pendingTransports,
      totalRepairs,
      pendingRepairs,
      inProgressRepairs,
      recentMotorcyclesAll,
    ] = await Promise.all([
      Motorcycle.count(),
      Motorcycle.count({ status: "in_stock" }),
      Motorcycle.count({ status: "sold" }),
      Motorcycle.count({ status: "in_repair" }),
      Motorcycle.count({ status: "in_transit" }),
      Motorcycle.count({ status: "reserved" }),
      Supplier.count(),
      Supplier.count({ isActive: true }),
      Customer.count(),
      Contract.count(),
      Contract.count({ status: "active" }),
      Transport.count(),
      Transport.count({ status: "pending" }),
      Repair.count(),
      Repair.count({ status: "pending" }),
      Repair.count({ status: "in_progress" }),
      Motorcycle.findAll(),
    ]);

    const recent = Array.isArray(recentMotorcyclesAll)
      ? recentMotorcyclesAll.slice(0, 5)
      : [];

    // Get monthly sales data
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Run all SQL queries in parallel for better performance
    const monthlySalesQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue
      FROM contracts
      WHERE type = 'sale' 
        AND EXTRACT(MONTH FROM date) = $1 
        AND EXTRACT(YEAR FROM date) = $2
        AND status = 'active'
    `;
    const monthlyPurchasesQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as expense
      FROM contracts
      WHERE type = 'purchase' 
        AND EXTRACT(MONTH FROM date) = $1 
        AND EXTRACT(YEAR FROM date) = $2
        AND status = 'active'
    `;
    const topSuppliersQuery = `
      SELECT s.id, s.name, s.company, s.rating,
             COUNT(m.id) as total_supplied
      FROM suppliers s
      LEFT JOIN motorcycles m ON s.id = m.supplier_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.company, s.rating
      ORDER BY total_supplied DESC
      LIMIT 5
    `;
    const recentSalesQuery = `
      SELECT m.id, m.brand, m.model, m.selling_price, m.sale_date,
             c.full_name as customer_name, c.phone as customer_phone
      FROM motorcycles m
      LEFT JOIN customers c ON m.customer_id = c.id
      WHERE m.status = 'sold' AND m.sale_date IS NOT NULL
      ORDER BY m.sale_date DESC
      LIMIT 5
    `;
    const repairExpensesQuery = `
      SELECT COALESCE(SUM(total_cost), 0) as total
      FROM repairs
      WHERE status = 'completed'
        AND EXTRACT(MONTH FROM completion_date) = $1
        AND EXTRACT(YEAR FROM completion_date) = $2
    `;

    // Run all independent SQL queries in parallel
    const [
      monthlySalesRes,
      lastMonthSalesRes,
      monthlyPurchasesRes,
      topSuppliersRes,
      recentSalesRes,
      repairExpensesRes,
      pendingApprovalsRes,
    ] = await Promise.all([
      query(monthlySalesQuery, [currentMonth, currentYear]),
      query(monthlySalesQuery, [lastMonth, lastMonthYear]),
      query(monthlyPurchasesQuery, [currentMonth, currentYear]),
      query(topSuppliersQuery),
      query(recentSalesQuery),
      query(repairExpensesQuery, [currentMonth, currentYear]),
      query(
        "SELECT COUNT(*) as count FROM approvals WHERE status IN ('pending_sales', 'pending_admin')"
      ),
    ]);

    const monthlySales = parseInt(monthlySalesRes.rows[0].count) || 0;
    const monthlyRevenue = parseFloat(monthlySalesRes.rows[0].revenue) || 0;
    const lastMonthSales = parseInt(lastMonthSalesRes.rows[0].count) || 0;
    const lastMonthRevenue = parseFloat(lastMonthSalesRes.rows[0].revenue) || 0;
    const monthlyPurchases = parseInt(monthlyPurchasesRes.rows[0].count) || 0;
    const monthlyPurchaseExpense =
      parseFloat(monthlyPurchasesRes.rows[0].expense) || 0;
    const monthlyProfit = monthlyRevenue - monthlyPurchaseExpense;

    const topSuppliers = topSuppliersRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      rating: row.rating,
      totalSupplied: parseInt(row.total_supplied) || 0,
    }));

    const recentSales = recentSalesRes.rows.map((row) => ({
      id: row.id,
      brand: row.brand,
      model: row.model,
      sellingPrice: parseFloat(row.selling_price) || 0,
      saleDate: row.sale_date,
      customer: row.customer_name
        ? { fullName: row.customer_name, phone: row.customer_phone }
        : null,
    }));

    const repairExpenses = parseFloat(repairExpensesRes.rows[0].total) || 0;
    const pendingApprovalsCount =
      parseInt(pendingApprovalsRes.rows[0].count) || 0;

    // Finance summary (this month) - with error handling
    let totalIncome = 0;
    let totalExpenses = 0;
    try {
      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0); // last day of month
      const dateFrom = monthStart.toISOString().split("T")[0];
      const dateTo = monthEnd.toISOString().split("T")[0];

      const financeSummary = await FinanceTransaction.getSummary({
        dateFrom,
        dateTo,
      });

      totalIncome = financeSummary
        .filter((s) => s.transactionType === "cash_in")
        .reduce((sum, s) => sum + s.total, 0);
      totalExpenses = financeSummary
        .filter((s) => s.transactionType === "cash_out")
        .reduce((sum, s) => sum + s.total, 0);
    } catch (financeError) {
      console.warn(
        "Finance summary error (table may not exist):",
        financeError.message
      );
      // Continue with default values (0)
    }

    // Secretary-specific stats - run queries in parallel
    let secretaryStats = {};
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const today = new Date().toISOString().split("T")[0];

      // Run all secretary queries in parallel
      const [
        contractsDraftedQuery,
        approvedContractsQuery,
        pendingStaffTasksResult,
        meetingsThisWeekQuery,
        reportsDueToday,
        documentsUploadedQuery,
      ] = await Promise.all([
        query(
          `SELECT COUNT(*) as count FROM contracts 
           WHERE EXTRACT(MONTH FROM created_at) = $1 
           AND EXTRACT(YEAR FROM created_at) = $2`,
          [currentMonth, currentYear]
        ),
        query(
          `SELECT COUNT(*) as count FROM contracts WHERE status = 'active'`
        ),
        StaffTask.count({ status: "pending" }),
        query(
          `SELECT COUNT(*) as count FROM meetings 
           WHERE scheduled_date >= $1 AND scheduled_date <= $2`,
          [weekStart.toISOString(), weekEnd.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM staff_tasks 
           WHERE due_date::date = $1 AND status NOT IN ('completed', 'cancelled')`,
          [today]
        ),
        query(
          `SELECT COUNT(*) as count FROM documents 
           WHERE EXTRACT(MONTH FROM created_at) = $1 
           AND EXTRACT(YEAR FROM created_at) = $2`,
          [currentMonth, currentYear]
        ),
      ]);

      secretaryStats = {
        contractsDraftedThisMonth:
          parseInt(contractsDraftedQuery.rows[0].count) || 0,
        approvedContracts: parseInt(approvedContractsQuery.rows[0].count) || 0,
        pendingStaffTasks: pendingStaffTasksResult || 0,
        meetingsThisWeek: parseInt(meetingsThisWeekQuery.rows[0].count) || 0,
        reportsDueToday: parseInt(reportsDueToday.rows[0].count) || 0,
        documentsUploadedThisMonth:
          parseInt(documentsUploadedQuery.rows[0].count) || 0,
      };
    } catch (secretaryError) {
      console.warn("Secretary stats error:", secretaryError.message);
      secretaryStats = {
        contractsDraftedThisMonth: 0,
        approvedContracts: 0,
        pendingStaffTasks: 0,
        meetingsThisWeek: 0,
        reportsDueToday: 0,
        documentsUploadedThisMonth: 0,
      };
    }

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
        monthly: 0, // Can be calculated if needed
      },
      monthly: {
        sales: monthlySales,
        revenue: monthlyRevenue,
        purchases: monthlyPurchases,
        purchaseExpense: monthlyPurchaseExpense,
        profit: monthlyProfit,
        repairExpenses: repairExpenses,
        income: totalIncome,
        expenses: totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        // Comparison with last month
        salesChange:
          lastMonthSales > 0
            ? ((monthlySales - lastMonthSales) / lastMonthSales) * 100
            : 0,
        revenueChange:
          lastMonthRevenue > 0
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0,
      },
      pending: {
        transports: pendingTransports,
        repairs: pendingRepairs,
        approvals: pendingApprovalsCount,
      },
      topSuppliers: topSuppliers,
      recentSales: recentSales,
      recentMotorcycles: recent,
      secretary: secretaryStats,
    };

    const duration = Date.now() - startTime;
    console.log(`Dashboard stats compiled successfully in ${duration}ms`);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to fetch dashboard statistics",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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

// Get monthly sales chart data
router.get("/charts/monthly-sales", authenticate, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const sql = `
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as revenue
      FROM contracts
      WHERE type = 'sale'
        AND EXTRACT(YEAR FROM date) = $1
        AND status = 'active'
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month ASC
    `;
    const result = await query(sql, [currentYear]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching monthly sales chart:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
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

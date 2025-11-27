import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool, { testConnection } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import motorcycleRoutes from "./routes/motorcycles.js";
import supplierRoutes from "./routes/suppliers.js";
import customerRoutes from "./routes/customers.js";
import contractRoutes from "./routes/contracts.js";
import transportRoutes from "./routes/transport.js";
import repairRoutes from "./routes/repairs.js";
import reportRoutes from "./routes/reports.js";
import dashboardRoutes from "./routes/dashboard.js";
import approvalRoutes from "./routes/approvals.js";
import inspectionRoutes from "./routes/inspections.js";
import financeRoutes from "./routes/finance.js";
import mechanicReportsRoutes from "./routes/mechanicReports.js";
import taskRoutes from "./routes/tasks.js";
import repairBillRoutes from "./routes/repairBills.js";
import messageRoutes from "./routes/messages.js";
import meetingRoutes from "./routes/meetings.js";
import attendanceRoutes from "./routes/attendance.js";
import documentRoutes from "./routes/documents.js";
import officeSupplyRoutes from "./routes/officeSupplies.js";
import staffTaskRoutes from "./routes/staffTasks.js";
import loanRoutes from "./routes/loans.js";
import ownershipTransferRoutes from "./routes/ownershipTransfers.js";

dotenv.config();

console.log("🔧 App.js loaded");
console.log("🌍 Environment variables loaded");
console.log("📁 Current working directory:", process.cwd());

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://mr-pikipiki-trading.vercel.app",
      "https://mr-pikipiki-trading-git-main-alfatonics.vercel.app",
      /\.vercel\.app$/,
      // Allow all Vercel preview deployments
      /^https:\/\/.*\.vercel\.app$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Mobile-Request",
      "Cache-Control",
      "Pragma",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    // Mobile-specific CORS settings
    maxAge: 86400, // 24 hours cache for preflight requests
  })
);
// Path rewriting middleware for Vercel rewrites
// Handle both query parameter method and custom header method
app.use((req, res, next) => {
  let newPath = null;

  // Method 1: Check custom header set by api/index.js handler (PRIORITY)
  if (req.headers["x-target-path"]) {
    newPath = req.headers["x-target-path"];
    console.log("🔄 Rewriting path from header:", req.url, "->", newPath);
  }
  // Method 2: Check if we have a path query parameter (from Vercel rewrite)
  // This handles both /api/index?path=... and /api/auth/login?path=...
  else if (req.query && req.query.path) {
    const pathParam = Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : req.query.path;
    newPath = `/api/${pathParam}`;
    console.log("🔄 Rewriting path from query:", req.url, "->", newPath);
  }
  // Method 3: Check if we're at /api/index (fallback)
  else if (
    req.url === "/api/index" ||
    req.path === "/api/index" ||
    req.url.startsWith("/api/index?")
  ) {
    // If we're at /api/index without path param, that's an error
    console.warn("⚠️ At /api/index but no path parameter found");
  }

  if (newPath) {
    // Rewrite the URL
    req.url = newPath;
    req.originalUrl = newPath;
    req.path = newPath;

    // Remove path from query if it exists
    if (req.query && req.query.path) {
      const newQuery = { ...req.query };
      delete newQuery.path;
      req.query = newQuery;
    }
  }

  next();
});

// CRITICAL: Method preservation middleware
// serverless-http sometimes changes POST to GET, so we need to preserve it
// Check headers and content-length to determine if it should be POST
app.use((req, res, next) => {
  // If method is GET but we have Content-Type and Content-Length indicating a body
  // This is likely a serverless-http bug where it changed POST to GET
  if (req.method === "GET") {
    const contentType = req.headers["content-type"] || "";
    const contentLength = req.headers["content-length"];

    // If we have JSON content type and content length > 0, it's likely a POST
    if (
      contentType.includes("application/json") &&
      contentLength &&
      parseInt(contentLength) > 0
    ) {
      console.log("🔧 Restoring method from GET to POST (has JSON body)");
      req.method = "POST";
    }
    // Also check for form data
    else if (
      contentType.includes("application/x-www-form-urlencoded") &&
      contentLength &&
      parseInt(contentLength) > 0
    ) {
      console.log("🔧 Restoring method from GET to POST (has form body)");
      req.method = "POST";
    }
  }
  next();
});

// Add debug logging middleware AFTER path rewriting
app.use((req, res, next) => {
  console.log("🔍 Incoming request:", req.method, req.url);
  console.log("📍 Original URL:", req.originalUrl);
  console.log("📍 Path:", req.path);
  console.log("📍 Base URL:", req.baseUrl);
  next();
});

// Increase body parser limits to handle large payloads (e.g., base64 images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection - PostgreSQL is connection pooled, no need for middleware
// Test connection on startup
testConnection().then((connected) => {
  if (connected) {
    console.log("✅ PostgreSQL connection pool ready");
  } else {
    console.error("❌ PostgreSQL connection failed");
  }
});

// Routes
console.log("🛣️ Registering API routes...");
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes registered");
app.use("/api/users", userRoutes);
console.log("✅ User routes registered");
app.use("/api/motorcycles", motorcycleRoutes);
console.log("✅ Motorcycle routes registered");
app.use("/api/suppliers", supplierRoutes);
console.log("✅ Supplier routes registered");
app.use("/api/customers", customerRoutes);
console.log("✅ Customer routes registered");
app.use("/api/contracts", contractRoutes);
console.log("✅ Contract routes registered");
app.use("/api/transport", transportRoutes);
console.log("✅ Transport routes registered");
app.use("/api/repairs", repairRoutes);
console.log("✅ Repair routes registered");
app.use("/api/reports", reportRoutes);
console.log("✅ Report routes registered");
app.use("/api/dashboard", dashboardRoutes);
console.log("✅ Dashboard routes registered");
app.use("/api/approvals", approvalRoutes);
console.log("✅ Approval routes registered");
app.use("/api/inspections", inspectionRoutes);
console.log("✅ Inspection routes registered");
app.use("/api/finance", financeRoutes);
console.log("✅ Finance routes registered");
app.use("/api/mechanic-reports", mechanicReportsRoutes);
console.log("✅ Mechanic reports routes registered");
app.use("/api/tasks", taskRoutes);
console.log("✅ Task routes registered");
app.use("/api/repair-bills", repairBillRoutes);
console.log("✅ Repair bills routes registered");
app.use("/api/messages", messageRoutes);
console.log("✅ Messages routes registered");
app.use("/api/meetings", meetingRoutes);
console.log("✅ Meetings routes registered");
app.use("/api/attendance", attendanceRoutes);
console.log("✅ Attendance routes registered");
app.use("/api/documents", documentRoutes);
console.log("✅ Documents routes registered");
app.use("/api/office-supplies", officeSupplyRoutes);
console.log("✅ Office supplies routes registered");
app.use("/api/staff-tasks", staffTaskRoutes);
console.log("✅ Staff tasks routes registered");
app.use("/api/loans", loanRoutes);
console.log("✅ Loans routes registered");
app.use("/api/ownership-transfers", ownershipTransferRoutes);
console.log("✅ Ownership transfer routes registered");
console.log("🎯 All API routes registered successfully");

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "MR PIKIPIKI TRADING API is running" });
});

// Test endpoint to verify database connection and user
app.get("/api/test-db", async (req, res) => {
  try {
    const { query } = await import("./config/database.js");

    // Test connection
    const timeResult = await query("SELECT NOW() as now");

    // Count users
    const countResult = await query("SELECT COUNT(*) as count FROM users");
    const userCount = parseInt(countResult.rows[0].count);

    // Find admin user
    const adminResult = await query(
      "SELECT username, role FROM users WHERE username = $1",
      ["admin"]
    );
    const adminUser = adminResult.rows[0];

    res.json({
      dbConnected: true,
      databaseType: "PostgreSQL (Neon)",
      databaseTime: timeResult.rows[0].now,
      userCount,
      adminExists: !!adminUser,
      adminUsername: adminUser?.username,
      adminRole: adminUser?.role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route for debugging 404 errors
app.use("*", (req, res) => {
  console.log("🚨 404 Error - Route not found");
  console.log("📍 Requested URL:", req.originalUrl);
  console.log("🔍 Request method:", req.method);
  console.log("📋 Available routes:");
  console.log("  - /api/health");
  console.log("  - /api/test-db");
  console.log("  - /api/auth/*");
  console.log("  - /api/users/*");
  console.log("  - /api/motorcycles/*");
  console.log("  - /api/suppliers/*");
  console.log("  - /api/customers/*");
  console.log("  - /api/contracts/*");
  console.log("  - /api/transport/*");
  console.log("  - /api/repairs/*");
  console.log("  - /api/reports/*");
  console.log("  - /api/dashboard/*");
  console.log("  - /api/approvals/*");

  res.status(404).json({
    error: "Route not found",
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: [
      "/api/health",
      "/api/test-db",
      "/api/auth/*",
      "/api/users/*",
      "/api/motorcycles/*",
      "/api/suppliers/*",
      "/api/customers/*",
      "/api/contracts/*",
      "/api/transport/*",
      "/api/repairs/*",
      "/api/reports/*",
      "/api/dashboard/*",
      "/api/approvals/*",
    ],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  console.error(err.stack);

  // Handle payload too large errors
  if (
    err.type === "entity.too.large" ||
    err.message?.includes("entity too large")
  ) {
    return res.status(413).json({
      error:
        "Request payload too large. Please reduce image sizes or remove unnecessary data.",
      limit: "50MB",
    });
  }

  res.status(500).json({
    error: "Something went wrong!",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;

import serverless from "serverless-http";
import app from "../server/app.js";

console.log("🚀 API handler module loaded");

// Wrap Express app with serverless-http
const handler = serverless(app, {
  binary: ["image/*", "application/pdf", "application/octet-stream"],
});

// Log when handler is created
console.log("✅ Serverless handler created");

export default async function (req, res) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    return res.status(200).end();
  }

  // Vercel catch-all route: /api/[...path].js
  // The path segments are in req.query.path as an array
  // Extract the original path from the catch-all parameter

  // Store original request properties before modification
  const originalUrl = req.url || "/";
  const originalPath = req.path || "/";
  const originalQuery = req.query || {};
  
  // Extract path from Vercel's catch-all parameter
  // req.query.path will be an array like ['auth', 'login'] for /api/auth/login
  let targetPath = null;
  
  if (req.query && req.query.path) {
    const pathArray = Array.isArray(req.query.path) 
      ? req.query.path 
      : [req.query.path];
    targetPath = `/api/${pathArray.join('/')}`;
    console.log("✅ Found path from catch-all parameter:", targetPath);
  }

  // Log all request details for debugging
  console.log("🔍 === VERCEL CATCH-ALL REQUEST DEBUG ===");
  console.log("🔍 Method:", req.method);
  console.log("🔍 URL:", originalUrl);
  console.log("🔍 Path:", originalPath);
  console.log("🔍 Query:", JSON.stringify(originalQuery));
  
  // Extract path from Vercel's catch-all parameter (priority method)
  // req.query.path will be an array like ['auth', 'login'] for /api/auth/login
  if (!targetPath && req.query && req.query.path) {
    const pathArray = Array.isArray(req.query.path) 
      ? req.query.path 
      : [req.query.path];
    targetPath = `/api/${pathArray.join('/')}`;
    console.log("✅ Found path from catch-all parameter:", targetPath);
  }
  
  // Fallback: Use URL if it's already a full API path
  if (!targetPath && originalUrl && originalUrl.startsWith("/api/") && originalUrl !== "/api") {
    targetPath = originalUrl.split("?")[0]; // Remove query string
    console.log("✅ Using original URL as path:", targetPath);
  }
  
  // Final fallback
  if (!targetPath) {
    targetPath = "/api/health";
    console.warn("⚠️ Could not determine path, using fallback:", targetPath);
  }

  // Ensure it starts with /api
  if (!targetPath.startsWith("/api")) {
    targetPath = `/api${targetPath}`;
  }

  // Remove query string from path for routing
  const pathWithoutQuery = targetPath.split("?")[0];

  // Update req properties for Express routing BEFORE serverless-http processes it
  req.url = targetPath;
  req.originalUrl = targetPath;
  req.path = pathWithoutQuery;

  // Preserve query parameters (except path) if any
  if (originalQuery && Object.keys(originalQuery).length > 0) {
    const newQuery = { ...originalQuery };
    delete newQuery.path;
    if (Object.keys(newQuery).length > 0) {
      req.query = newQuery;
    }
  }

  console.log("🔔 === ROUTING DECISION ===");
  console.log("🔔 Original URL:", originalUrl);
  console.log("🔔 Target Path:", targetPath);
  console.log("🔔 Final Path:", req.path);
  console.log("🔔 Method:", req.method);

  console.log("🔔 API request processed:", {
    method: req.method,
    originalUrl: originalUrl,
    targetPath: targetPath,
    finalPath: req.path,
    query: req.query,
    vercelPath: vercelPath,
    headers: {
      "content-type": req.headers["content-type"],
      "x-vercel-original-path": req.headers["x-vercel-original-path"],
      "x-forwarded-uri": req.headers["x-forwarded-uri"],
      "x-forwarded-path": req.headers["x-forwarded-path"],
      "x-vercel-rewrite": req.headers["x-vercel-rewrite"],
    },
  });

  // If we couldn't determine the original path and we're at /api/index, log warning
  if (targetPath === "/api/index" || targetPath === "/api") {
    console.warn(
      "⚠️ Could not determine original API path, using fallback:",
      targetPath
    );
  }

  try {
    // Call the serverless-http handler
    const result = await handler(req, res);
    console.log("✅ API handler completed:", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
    return result;
  } catch (error) {
    console.error("❌ API handler error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Internal server error", message: error.message });
    }
    throw error;
  }
}

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
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return res.status(200).end();
  }

  // TEST ENDPOINT: Return request details for debugging
  if (req.url === '/api/test' || req.path === '/api/test') {
    return res.json({
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      query: req.query,
      headers: req.headers,
      body: req.body
    });
  }

  // Vercel rewrites /api/* to /api/index
  // Extract the original path from headers or request URL
  
  // Store original request properties before modification
  const originalUrl = req.url || "/";
  const originalPath = req.path || "/";
  const originalQuery = req.query || {};

  // Log all request details for debugging
  console.log("🔍 === VERCEL REQUEST DEBUG ===");
  console.log("🔍 Method:", req.method);
  console.log("🔍 URL:", originalUrl);
  console.log("🔍 Path:", originalPath);
  console.log("🔍 Query:", JSON.stringify(originalQuery));
  console.log("🔍 Headers:", JSON.stringify(req.headers, null, 2));

  let targetPath = null;

  // Method 1: Check Vercel-specific headers (most reliable for rewrites)
  const vercelHeaders = {
    "x-vercel-original-path": req.headers["x-vercel-original-path"],
    "x-original-path": req.headers["x-original-path"],
    "x-vercel-rewrite": req.headers["x-vercel-rewrite"],
    "x-forwarded-uri": req.headers["x-forwarded-uri"],
    "x-forwarded-path": req.headers["x-forwarded-path"],
    "x-invoke-path": req.headers["x-invoke-path"],
    "x-rewrite-url": req.headers["x-rewrite-url"],
  };
  
  console.log("🔍 Vercel headers:", JSON.stringify(vercelHeaders, null, 2));
  
  for (const [key, value] of Object.entries(vercelHeaders)) {
    if (value && typeof value === 'string' && value.startsWith("/api/")) {
      targetPath = value;
      console.log(`✅ Found path from ${key}:`, targetPath);
      break;
    }
  }

  // Method 2: If we're at /api/index, try to get original path from URL
  // Vercel might pass it in the URL itself before rewrite
  if (!targetPath) {
    // Check if URL contains the original path (before rewrite)
    if (originalUrl && originalUrl.startsWith("/api/") && !originalUrl.includes("/api/index") && originalUrl !== "/api") {
      targetPath = originalUrl.split("?")[0]; // Remove query string
      console.log("✅ Using original URL as path:", targetPath);
    }
  }

  // Method 3: Try to extract from query parameter (if rewrite used ?path=)
  if (!targetPath) {
    let pathParam = null;
    
    // Try from parsed query object
    if (originalQuery && typeof originalQuery.path === 'string') {
      pathParam = originalQuery.path;
      console.log("✅ Found path from req.query.path:", pathParam);
    }
    // Try parsing from URL string
    else if (originalUrl && originalUrl.includes("?path=")) {
      try {
        const urlParts = originalUrl.split("?");
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          pathParam = params.get("path");
          console.log("✅ Found path from URL query string:", pathParam);
        }
      } catch (e) {
        console.error("❌ Error parsing URL:", e);
      }
    }
    
    if (pathParam) {
      targetPath = `/api/${pathParam}`;
    }
  }

  // If still no path found and we're at /api/index, this is a problem
  if (!targetPath) {
    const isApiIndex = originalUrl.includes("/api/index") || originalUrl === "/api" || originalPath.includes("/api/index");
    
    if (isApiIndex) {
      console.error("❌ CRITICAL: Could not determine original API path!");
      console.error("❌ Request details:", {
        url: originalUrl,
        path: originalPath,
        query: originalQuery,
        method: req.method,
        headers: vercelHeaders
      });
      
      // Return detailed error for debugging
      return res.status(500).json({ 
        error: "Internal routing error",
        message: "Could not determine the requested API endpoint from Vercel rewrite",
        debug: {
          url: originalUrl,
          path: originalPath,
          query: originalQuery,
          method: req.method,
          vercelHeaders: vercelHeaders
        }
      });
    }
    
    // Not at /api/index, use URL as-is
    targetPath = originalUrl || originalPath || "/api/health";
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

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
  // Vercel rewrites /api/* to /api/index?path=*
  // Extract the original path from query parameter or headers
  
  // Store original request properties before modification
  const originalUrl = req.url;
  const originalPath = req.path;
  const originalQuery = req.query;

  // Log all headers for debugging
  console.log("🔍 All request headers:", Object.keys(req.headers));
  console.log("🔍 Request URL:", originalUrl);
  console.log("🔍 Request path:", originalPath);
  console.log("🔍 Request query:", originalQuery);
  console.log("🔍 Request method:", req.method);

  let targetPath = null;

  // Method 1: Check Vercel headers (most reliable)
  const vercelPath = 
    req.headers["x-vercel-original-path"] ||
    req.headers["x-original-path"] ||
    req.headers["x-vercel-rewrite"] ||
    req.headers["x-forwarded-uri"] ||
    req.headers["x-forwarded-path"];
  
  if (vercelPath && vercelPath.startsWith("/api/")) {
    targetPath = vercelPath;
    console.log("✅ Found path from Vercel headers:", targetPath);
  }

  // Method 2: Extract from query parameter (from vercel.json rewrite)
  if (!targetPath) {
    let pathParam = null;
    
    // Try from parsed query object (if serverless-http already parsed it)
    if (originalQuery && typeof originalQuery.path === 'string') {
      pathParam = originalQuery.path;
      console.log("✅ Found path from req.query:", pathParam);
    }
    // Try parsing from URL string directly
    else if (originalUrl && originalUrl.includes("?path=")) {
      try {
        const urlParts = originalUrl.split("?");
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          pathParam = params.get("path");
          console.log("✅ Found path from URL parsing:", pathParam);
        }
      } catch (e) {
        console.error("❌ Error parsing URL:", e);
      }
    }
    
    if (pathParam) {
      targetPath = `/api/${pathParam}`;
    }
  }

  // Method 3: If URL is already the full path (not rewritten), use it
  if (!targetPath && originalUrl) {
    if (originalUrl.startsWith("/api/") && !originalUrl.includes("/api/index") && originalUrl !== "/api") {
      targetPath = originalUrl.split("?")[0]; // Remove query string
      console.log("✅ Using original URL as path:", targetPath);
    }
  }

  // Fallback: if we're at /api/index and can't determine path, return error
  if (!targetPath) {
    const currentUrl = originalUrl || originalPath || "/";
    if (currentUrl.includes("/api/index") || currentUrl === "/api" || currentUrl.includes("?path=")) {
      console.error("❌ Could not determine original API path from request:", {
        url: originalUrl,
        path: originalPath,
        query: originalQuery,
        headers: {
          "x-vercel-original-path": req.headers["x-vercel-original-path"],
          "x-forwarded-uri": req.headers["x-forwarded-uri"],
          "x-forwarded-path": req.headers["x-forwarded-path"],
        }
      });
      // Return 404 instead of 405 to indicate route not found
      return res.status(404).json({ 
        error: "API route not found",
        message: "Could not determine the requested API endpoint",
        debug: {
          url: originalUrl,
          path: originalPath,
          query: originalQuery
        }
      });
    }
    targetPath = currentUrl;
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

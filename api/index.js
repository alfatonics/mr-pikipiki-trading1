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
  try {
    // IMMEDIATE TEST: Return simple response to verify function is being called
    // Check both before and after path extraction
    const checkUrl = req.url || "";
    const checkPath = req.path || "";

    if (
      checkUrl.includes("/ping") ||
      checkPath.includes("/ping") ||
      checkUrl === "/api/ping" ||
      checkPath === "/api/ping"
    ) {
      return res.json({
        message: "Function is working!",
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
      });
    }
  } catch (error) {
    console.error("❌ Error in ping check:", error);
    return res.status(500).json({ error: error.message });
  }

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

  // Vercel rewrites /api/* to /api/index
  // Extract the original path from headers or query parameters

  // Store original request properties before modification
  const originalUrl = req.url || "/";
  const originalPath = req.path || "/";
  const originalQuery = req.query || {};
  const originalMethod = req.method; // Store original method early

  // Log all request details for debugging
  console.log("🔍 === VERCEL REQUEST DEBUG ===");
  console.log("🔍 Method:", req.method);
  console.log("🔍 URL:", originalUrl);
  console.log("🔍 Path:", originalPath);
  console.log("🔍 Query:", JSON.stringify(originalQuery));

  // Log only relevant headers to avoid too much output
  const relevantHeaders = {
    "x-vercel-original-path": req.headers["x-vercel-original-path"],
    "x-original-path": req.headers["x-original-path"],
    "x-forwarded-uri": req.headers["x-forwarded-uri"],
    "x-forwarded-path": req.headers["x-forwarded-path"],
    "x-vercel-rewrite": req.headers["x-vercel-rewrite"],
  };
  console.log("🔍 Relevant Headers:", JSON.stringify(relevantHeaders, null, 2));

  let targetPath = null;

  // Method 1: Extract from query parameter FIRST (rewrite passes ?path=)
  // This is the most reliable method when using rewrites with query params
  if (originalQuery && originalQuery.path) {
    const pathParam = Array.isArray(originalQuery.path)
      ? originalQuery.path.join("/")
      : originalQuery.path;
    targetPath = `/api/${pathParam}`;
    console.log("✅ Found path from query parameter:", targetPath);
  }

  // Method 2: Check Vercel headers for original path
  if (!targetPath) {
    const vercelPath =
      req.headers["x-vercel-original-path"] ||
      req.headers["x-original-path"] ||
      req.headers["x-forwarded-uri"] ||
      req.headers["x-forwarded-path"];

    if (vercelPath && vercelPath.startsWith("/api/")) {
      targetPath = vercelPath;
      console.log("✅ Found path from Vercel headers:", targetPath);
    }
  }

  // Method 3: Parse from URL if it contains path info
  if (!targetPath && originalUrl.includes("?path=")) {
    try {
      const urlParts = originalUrl.split("?");
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const pathParam = params.get("path");
        if (pathParam) {
          targetPath = `/api/${pathParam}`;
          console.log("✅ Found path from URL query string:", targetPath);
        }
      }
    } catch (e) {
      console.error("❌ Error parsing URL:", e);
    }
  }

  // Method 4: If URL is already the full path (not rewritten), use it
  if (
    !targetPath &&
    originalUrl &&
    originalUrl.startsWith("/api/") &&
    !originalUrl.includes("/api/index") &&
    originalUrl !== "/api"
  ) {
    targetPath = originalUrl.split("?")[0];
    console.log("✅ Using original URL as path:", targetPath);
  }

  // Final fallback - if we're at /api/index after rewrite, try to reconstruct
  if (!targetPath) {
    // If URL is /api/index or /api, this means we're at the rewrite destination
    // Try to get original path from the rewrite pattern
    // Vercel rewrite: /api/(.*) -> /api/index
    // The original path segment should be somewhere...

    if (
      originalUrl === "/api/index" ||
      originalUrl === "/api" ||
      originalUrl === "/"
    ) {
      // Check if we can get it from the request somehow
      // Sometimes Vercel passes it in a different way
      const allHeaders = Object.keys(req.headers).filter(
        (h) =>
          h.toLowerCase().includes("path") ||
          h.toLowerCase().includes("uri") ||
          h.toLowerCase().includes("original") ||
          h.toLowerCase().includes("rewrite")
      );

      console.error("❌ CRITICAL: Could not determine original API path!");
      console.error(
        "❌ All path-related headers:",
        allHeaders.map((h) => `${h}: ${req.headers[h]}`)
      );

      return res.status(500).json({
        error: "Internal routing error",
        message:
          "Could not determine the requested API endpoint from Vercel rewrite",
        debug: {
          url: originalUrl,
          path: originalPath,
          query: originalQuery,
          method: req.method,
          allHeaders: allHeaders.reduce((acc, h) => {
            acc[h] = req.headers[h];
            return acc;
          }, {}),
        },
      });
    }

    // Not at /api/index, use URL as-is (might be direct access)
    targetPath = originalUrl;
  }

  // Ensure it starts with /api
  if (!targetPath.startsWith("/api")) {
    targetPath = `/api${targetPath}`;
  }

  // DON'T modify req.url here - it breaks serverless-http response handling
  // Instead, pass the target path info to Express middleware via a custom header
  // Express middleware will handle the path rewriting
  if (targetPath) {
    const pathWithoutQuery = targetPath.split("?")[0];
    
    // Store target path in a custom header for Express middleware
    req.headers['x-target-path'] = pathWithoutQuery;
    
    console.log("🔧 Set target path in header:", pathWithoutQuery);
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
    // CRITICAL: Ensure method is preserved right before calling handler
    // serverless-http might have changed it, so set it again
    if (req.method !== originalMethod) {
      req.method = originalMethod;
      console.log("🔧 Restored method to:", req.method);
    }

    // Call the serverless-http handler
    // Important: Don't await - let it handle the response asynchronously
    // But we need to return the promise so Vercel knows the function is still running
    const handlerPromise = handler(req, res);

    // Log after a short delay to see if response was sent
    handlerPromise
      .then(() => {
        console.log("✅ Handler promise resolved:", {
          statusCode: res.statusCode,
          headersSent: res.headersSent,
          finished: res.finished,
        });
      })
      .catch((err) => {
        console.error("❌ Handler promise rejected:", err);
      });

    // Return the promise - Vercel will wait for it
    return handlerPromise;
  } catch (error) {
    console.error("❌ API handler error:", error);
    console.error("❌ Error stack:", error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
        type: error.name,
      });
    }
    // Don't throw - return the error response instead
    return;
  }
}

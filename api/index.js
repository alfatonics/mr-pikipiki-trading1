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
  // Vercel rewrites /api/* to /api/index
  // We need to extract the original path from the request
  // The original path should be in the URL that was requested, not the rewritten one

  // Get the original request URL from various possible sources
  let originalUrl = null;

  // Check Vercel-specific headers first
  originalUrl =
    req.headers["x-vercel-original-path"] ||
    req.headers["x-original-path"] ||
    req.headers["x-vercel-rewrite"] ||
    req.headers["x-forwarded-uri"] ||
    req.headers["x-forwarded-path"];

  // If not in headers, check if req.url contains the original path
  // When Vercel rewrites, sometimes the original is still in req.url
  if (!originalUrl) {
    const currentUrl = req.url || "/";
    // If it's not /api/index, it might be the original path
    if (
      currentUrl.startsWith("/api/") &&
      currentUrl !== "/api/index" &&
      currentUrl !== "/api"
    ) {
      originalUrl = currentUrl;
    }
  }

  // If we still don't have it, and we're at /api/index, try to get from query
  if (!originalUrl) {
    const currentUrl = req.url || "/";

    // Check if we're at the rewritten endpoint
    if (
      currentUrl === "/api/index" ||
      currentUrl === "/api" ||
      currentUrl.includes("/api/index") ||
      currentUrl.includes("?path=")
    ) {
      // Try query parameter first (if rewrite used ?path=)
      let pathParam = null;

      // Method 1: From parsed query object
      if (req.query && req.query.path) {
        pathParam = req.query.path;
      }
      // Method 2: Parse from URL string
      else if (currentUrl.includes("?path=")) {
        try {
          const urlParts = currentUrl.split("?");
          if (urlParts.length > 1) {
            const params = new URLSearchParams(urlParts[1]);
            pathParam = params.get("path");
          }
        } catch (e) {
          console.error("Error parsing URL:", e);
        }
      }

      if (pathParam) {
        originalUrl = `/api/${pathParam}`;
      }
    }
  }

  // Use originalUrl if found, otherwise fall back to req.url
  let targetPath = originalUrl || req.url || req.path || "/api/health";

  // Ensure it starts with /api
  if (!targetPath.startsWith("/api")) {
    targetPath = `/api${targetPath}`;
  }

  // Remove query string from path for routing
  const pathWithoutQuery = targetPath.split("?")[0];

  // Update req properties for Express routing
  // This must be done before passing to serverless-http
  req.url = targetPath;
  req.originalUrl = targetPath;
  req.path = pathWithoutQuery;

  console.log("🔔 API request received:", {
    method: req.method,
    originalRequestUrl: req.url,
    targetPath: targetPath,
    path: req.path,
    query: req.query,
    originalUrl: originalUrl,
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

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
  // Preserve the original URL path for Express routing
  // Vercel rewrites /api/* to /api, so we need to reconstruct the full path
  const originalPath = req.url || req.path || "/";
  
  // If the request came through rewrite, we need to get the original path
  // Check if there's a query parameter with the path
  const queryPath = req.query?.path;
  if (queryPath) {
    req.url = `/api/${queryPath}`;
    req.originalUrl = `/api/${queryPath}`;
  } else if (!originalPath.startsWith("/api")) {
    // If path doesn't start with /api, add it
    req.url = `/api${originalPath}`;
    req.originalUrl = `/api${originalPath}`;
  }

  console.log("🔔 API request received:", {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    query: req.query,
    path: req.path,
    headers: {
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
    },
  });

  try {
    // Call the serverless-http handler
    const result = await handler(req, res);
    console.log("✅ API handler completed:", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
    });
    return result;
  } catch (error) {
    console.error("❌ API handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
    throw error;
  }
}

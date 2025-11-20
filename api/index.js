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
  console.log("🔔 API request received:", {
    method: req.method,
    url: req.url,
    path: req.url,
    originalUrl: req.originalUrl,
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

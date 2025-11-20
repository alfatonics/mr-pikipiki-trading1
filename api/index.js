import app from "../server/app.js";

export default function handler(req, res) {
  const { method, url } = req;
  const contentType = req.headers["content-type"];

  console.log("🔔 API entry:", {
    method,
    url,
    contentType,
    contentLength: req.headers["content-length"],
  });

  res.on("finish", () => {
    console.log("✅ API response:", {
      method,
      url,
      statusCode: res.statusCode,
    });
  });

  return app(req, res);
}

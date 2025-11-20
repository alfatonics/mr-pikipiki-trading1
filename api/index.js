import serverless from "serverless-http";
import app from "../server/app.js";

// Wrap Express app for Vercel
const handler = serverless(app, {
  binary: ["image/*", "application/pdf", "application/octet-stream"],
});

export default handler;

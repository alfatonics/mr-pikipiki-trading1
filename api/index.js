// Vercel Serverless Function Entry Point
import app from '../server/app.js';

// Vercel requires serverless function handler format
export default async function handler(req, res) {
  // Let Express handle the request
  return app(req, res);
}


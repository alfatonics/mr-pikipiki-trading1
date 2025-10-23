// Vercel serverless function entry point
import app from '../server/app.js';

// Export the app for Vercel serverless functions
export default app;

// Also export as a named export for compatibility
export { app };


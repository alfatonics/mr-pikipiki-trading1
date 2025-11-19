import app from './app.js';
import serverless from 'serverless-http';

// Enhanced Vercel entry point with detailed logging
console.log('🚀 Vercel entry point loaded');
console.log('📁 Current directory:', process.cwd());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔑 JWT Secret exists:', !!process.env.JWT_SECRET);
console.log('💾 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Wrap Express app with serverless-http for Vercel
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  request(request, event, context) {
    // Preserve the original path from the rewrite
    if (event.path) {
      request.url = event.path + (request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '');
      request.originalUrl = event.path + (request.originalUrl.includes('?') ? request.originalUrl.substring(request.originalUrl.indexOf('?')) : '');
    }
    return request;
  }
});

export default handler;

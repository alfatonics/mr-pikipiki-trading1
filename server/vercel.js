import app from './app.js';

// Enhanced Vercel entry point with detailed logging
console.log('🚀 Vercel entry point loaded');
console.log('📁 Current directory:', process.cwd());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔑 JWT Secret exists:', !!process.env.JWT_SECRET);
console.log('💾 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📍 Original URL:', req.originalUrl);
  next();
});

// Add response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 ${new Date().toISOString()} - Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  next();
});

// Add error logging
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling middleware should be after all routes
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err);
  console.error('📍 Request URL:', req.url);
  console.error('📍 Request method:', req.method);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Vercel serverless function handler
export default async function handler(req, res) {
  console.log('🔧 Vercel handler called:', req.method, req.url);
  return app(req, res);
}

import app from './app.js';

// Enhanced Vercel entry point with detailed logging
console.log('🚀 Vercel entry point loaded');
console.log('📁 Current directory:', process.cwd());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('🔑 JWT Secret exists:', !!process.env.JWT_SECRET);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📍 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
  next();
});

// Add response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 ${new Date().toISOString()} - Response for ${req.method} ${req.url}`);
    console.log('📊 Response status:', res.statusCode);
    console.log('📄 Response data:', typeof data === 'string' ? data.substring(0, 200) + '...' : data);
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

export default app;

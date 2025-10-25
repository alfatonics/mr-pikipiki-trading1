import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import motorcycleRoutes from './routes/motorcycles.js';
import supplierRoutes from './routes/suppliers.js';
import customerRoutes from './routes/customers.js';
import contractRoutes from './routes/contracts.js';
import transportRoutes from './routes/transport.js';
import repairRoutes from './routes/repairs.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import approvalRoutes from './routes/approvals.js';

dotenv.config();

console.log('🔧 App.js loaded');
console.log('🌍 Environment variables loaded');
console.log('📁 Current working directory:', process.cwd());

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mr-pikipiki-trading.vercel.app',
    'https://mr-pikipiki-trading-git-main-alfatonics.vercel.app',
    /\.vercel\.app$/,
    // Allow all Vercel preview deployments
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Mobile-Request',
    'Cache-Control',
    'Pragma',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  // Mobile-specific CORS settings
  maxAge: 86400 // 24 hours cache for preflight requests
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
};

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
console.log('🛣️ Registering API routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');
app.use('/api/users', userRoutes);
console.log('✅ User routes registered');
app.use('/api/motorcycles', motorcycleRoutes);
console.log('✅ Motorcycle routes registered');
app.use('/api/suppliers', supplierRoutes);
console.log('✅ Supplier routes registered');
app.use('/api/customers', customerRoutes);
console.log('✅ Customer routes registered');
app.use('/api/contracts', contractRoutes);
console.log('✅ Contract routes registered');
app.use('/api/transport', transportRoutes);
console.log('✅ Transport routes registered');
app.use('/api/repairs', repairRoutes);
console.log('✅ Repair routes registered');
app.use('/api/reports', reportRoutes);
console.log('✅ Report routes registered');
app.use('/api/dashboard', dashboardRoutes);
console.log('✅ Dashboard routes registered');
app.use('/api/approvals', approvalRoutes);
console.log('✅ Approval routes registered');
console.log('🎯 All API routes registered successfully');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MR PIKIPIKI TRADING API is running' });
});

// Test endpoint to verify database connection and user
app.get('/api/test-db', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const userCount = await User.countDocuments();
    const adminUser = await User.findOne({ username: 'admin' });
    
    res.json({
      dbConnected: mongoose.connection.readyState === 1,
      databaseName: mongoose.connection.name,
      userCount,
      adminExists: !!adminUser,
      adminUsername: adminUser?.username,
      adminRole: adminUser?.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route for debugging 404 errors
app.use('*', (req, res) => {
  console.log('🚨 404 Error - Route not found');
  console.log('📍 Requested URL:', req.originalUrl);
  console.log('🔍 Request method:', req.method);
  console.log('📋 Available routes:');
  console.log('  - /api/health');
  console.log('  - /api/test-db');
  console.log('  - /api/auth/*');
  console.log('  - /api/users/*');
  console.log('  - /api/motorcycles/*');
  console.log('  - /api/suppliers/*');
  console.log('  - /api/customers/*');
  console.log('  - /api/contracts/*');
  console.log('  - /api/transport/*');
  console.log('  - /api/repairs/*');
  console.log('  - /api/reports/*');
  console.log('  - /api/dashboard/*');
  console.log('  - /api/approvals/*');
  
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: [
      '/api/health',
      '/api/test-db',
      '/api/auth/*',
      '/api/users/*',
      '/api/motorcycles/*',
      '/api/suppliers/*',
      '/api/customers/*',
      '/api/contracts/*',
      '/api/transport/*',
      '/api/repairs/*',
      '/api/reports/*',
      '/api/dashboard/*',
      '/api/approvals/*'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;


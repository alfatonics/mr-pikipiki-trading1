// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from '../server/routes/auth.js';
import userRoutes from '../server/routes/users.js';
import motorcycleRoutes from '../server/routes/motorcycles.js';
import supplierRoutes from '../server/routes/suppliers.js';
import customerRoutes from '../server/routes/customers.js';
import contractRoutes from '../server/routes/contracts.js';
import transportRoutes from '../server/routes/transport.js';
import repairRoutes from '../server/routes/repairs.js';
import reportRoutes from '../server/routes/reports.js';
import dashboardRoutes from '../server/routes/dashboard.js';
import approvalRoutes from '../server/routes/approvals.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mr-pikipiki-trading-cpr5.vercel.app',
    'https://mr-pikipiki-trading.vercel.app',
    /\.vercel\.app$/,
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
  maxAge: 86400
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/motorcycles', motorcycleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/approvals', approvalRoutes);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;


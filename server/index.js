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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



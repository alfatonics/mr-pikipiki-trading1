// Vercel serverless function for dashboard
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Motorcycle from '../../server/models/Motorcycle.js';
import Customer from '../../server/models/Customer.js';
import Supplier from '../../server/models/Supplier.js';
import Repair from '../../server/models/Repair.js';
import Transport from '../../server/models/Transport.js';

const app = express();
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get dashboard data
    const totalMotorcycles = await Motorcycle.countDocuments();
    const inStock = await Motorcycle.countDocuments({ status: 'inStock' });
    const sold = await Motorcycle.countDocuments({ status: 'sold' });
    const inRepair = await Motorcycle.countDocuments({ status: 'inRepair' });
    const inTransit = await Motorcycle.countDocuments({ status: 'inTransit' });
    
    const totalCustomers = await Customer.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const totalRepairs = await Repair.countDocuments();
    const pendingTransports = await Transport.countDocuments({ status: 'pending' });

    // Get top suppliers
    const topSuppliers = await Supplier.find()
      .sort({ rating: -1 })
      .limit(5)
      .select('name rating');

    const dashboardData = {
      motorcycles: {
        total: totalMotorcycles,
        inStock,
        sold,
        inRepair,
        inTransit
      },
      monthly: {
        sales: 0,
        revenue: 0,
        profit: 0,
        repairExpenses: 0
      },
      repairs: {
        total: totalRepairs,
        monthly: 0
      },
      topSuppliers,
      pending: {
        transports: pendingTransports,
        repairs: 0
      },
      totalCustomers,
      recentSales: []
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

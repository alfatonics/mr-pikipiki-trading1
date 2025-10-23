import express from 'express';
import Motorcycle from '../models/Motorcycle.js';
import Contract from '../models/Contract.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import Transport from '../models/Transport.js';
import Repair from '../models/Repair.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('Dashboard stats requested by user:', req.user.username);
    
    // Motorcycle statistics
    const totalMotorcycles = await Motorcycle.countDocuments();
    const inStock = await Motorcycle.countDocuments({ status: 'in_stock' });
    const sold = await Motorcycle.countDocuments({ status: 'sold' });
    const inRepair = await Motorcycle.countDocuments({ status: 'in_repair' });
    const inTransit = await Motorcycle.countDocuments({ status: 'in_transit' });
    
    console.log('Motorcycle counts:', { totalMotorcycles, inStock, sold, inRepair, inTransit });
    
    // Monthly sales
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlySales = await Motorcycle.countDocuments({
      status: 'sold',
      saleDate: { $gte: currentMonth }
    });
    
    const monthlyRevenue = await Motorcycle.aggregate([
      {
        $match: {
          status: 'sold',
          saleDate: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$sellingPrice' }
        }
      }
    ]);
    
    // Profit calculation (current month)
    const salesData = await Motorcycle.find({
      status: 'sold',
      saleDate: { $gte: currentMonth }
    });
    
    const monthlyProfit = salesData.reduce((sum, bike) => {
      return sum + ((bike.sellingPrice || 0) - (bike.purchasePrice || 0));
    }, 0);
    
    // Top suppliers
    const topSuppliers = await Supplier.find({ isActive: true })
      .sort('-totalSupplied')
      .limit(5)
      .select('name company totalSupplied rating');
    
    // Pending transports
    const pendingTransports = await Transport.countDocuments({ 
      status: { $in: ['pending', 'in_transit'] } 
    });
    
    // Active repairs
    const activeRepairs = await Repair.countDocuments({ 
      status: { $in: ['pending', 'in_progress'] } 
    });
    
    // Total repair expenses (this month)
    const monthlyRepairExpenses = await Repair.aggregate([
      {
        $match: {
          status: 'completed',
          completionDate: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCost' }
        }
      }
    ]);
    
    // Total repair expenses (all time)
    const totalRepairExpenses = await Repair.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCost' }
        }
      }
    ]);
    
    // Total customers
    const totalCustomers = await Customer.countDocuments();
    
    // Recent activities (last 10)
    const recentSales = await Motorcycle.find({ status: 'sold' })
      .populate('customer', 'fullName')
      .sort('-saleDate')
      .limit(5)
      .select('brand model saleDate sellingPrice customer');
    
    const response = {
      motorcycles: {
        total: totalMotorcycles,
        inStock,
        sold,
        inRepair,
        inTransit
      },
      monthly: {
        sales: monthlySales,
        revenue: monthlyRevenue[0]?.total || 0,
        profit: monthlyProfit,
        repairExpenses: monthlyRepairExpenses[0]?.total || 0
      },
      repairs: {
        total: totalRepairExpenses[0]?.total || 0,
        monthly: monthlyRepairExpenses[0]?.total || 0
      },
      topSuppliers,
      pending: {
        transports: pendingTransports,
        repairs: activeRepairs
      },
      totalCustomers,
      recentSales
    };
    
    console.log('Dashboard response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get monthly sales chart data
router.get('/charts/monthly-sales', authenticate, async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    
    const salesByMonth = await Motorcycle.aggregate([
      {
        $match: {
          status: 'sold',
          saleDate: {
            $gte: new Date(`${selectedYear}-01-01`),
            $lte: new Date(`${selectedYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$saleDate' },
          count: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Fill in missing months with zero
    const monthlyData = Array(12).fill(0).map((_, index) => {
      const monthData = salesByMonth.find(item => item._id === index + 1);
      return {
        month: index + 1,
        count: monthData?.count || 0,
        revenue: monthData?.revenue || 0
      };
    });
    
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly sales data' });
  }
});

// Get brand distribution
router.get('/charts/brand-distribution', authenticate, async (req, res) => {
  try {
    const distribution = await Motorcycle.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brand distribution' });
  }
});

export default router;



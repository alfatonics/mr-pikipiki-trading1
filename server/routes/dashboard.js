import express from 'express';
import Motorcycle from '../models/Motorcycle.js';
import Contract from '../models/Contract.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import Transport from '../models/Transport.js';
import Repair from '../models/Repair.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to check if API is working
router.get('/test', authenticate, async (req, res) => {
  try {
    console.log('Dashboard test endpoint called by user:', req.user.username);
    res.json({ 
      message: 'Dashboard API is working', 
      user: req.user.username,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard test error:', error);
    res.status(500).json({ error: 'Dashboard test failed' });
  }
});

// Debug endpoint to check database without authentication
router.get('/debug', async (req, res) => {
  try {
    console.log('Dashboard debug endpoint called');
    
    // Test database connection
    const totalMotorcycles = await Motorcycle.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    
    res.json({
      message: 'Database connection working',
      motorcycles: totalMotorcycles,
      customers: totalCustomers,
      suppliers: totalSuppliers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard debug error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('Dashboard stats requested by user:', req.user.username);
    
    // Get REAL motorcycle statistics from database
    const totalMotorcycles = await Motorcycle.countDocuments();
    
    // Get motorcycle counts by status using database aggregation
    const motorcycleStats = await Motorcycle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Initialize counters
    let inStock = 0, sold = 0, inRepair = 0, inTransit = 0, reserved = 0;
    
    // Process aggregation results
    motorcycleStats.forEach(stat => {
      const status = stat._id;
      const count = stat.count;
      
      if (!status || status === null || status === undefined) {
        inStock += count; // Treat null status as in stock
      } else {
        const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
        switch (normalizedStatus) {
          case 'in_stock':
          case 'in stock':
            inStock += count;
            break;
          case 'sold':
            sold += count;
            break;
          case 'in_repair':
          case 'in repair':
            inRepair += count;
            break;
          case 'in_transit':
          case 'in transit':
            inTransit += count;
            break;
          case 'reserved':
            reserved += count;
            break;
          default:
            inStock += count; // Treat unknown status as in stock
        }
      }
    });
    
    console.log('REAL Motorcycle counts from database:', { 
      total: totalMotorcycles, 
      inStock, 
      sold, 
      inRepair, 
      inTransit, 
      reserved
    });
    
    // Get actual monthly sales data from database
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const monthlySalesData = await Motorcycle.aggregate([
      {
        $match: {
          status: 'sold',
          saleDate: {
            $gte: currentMonth,
            $lt: nextMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' }
        }
      }
    ]);
    
    const monthlySales = monthlySalesData.length > 0 ? monthlySalesData[0].count : 0;
    const monthlyRevenue = monthlySalesData.length > 0 ? monthlySalesData[0].revenue : 0;
    const monthlyProfit = monthlyRevenue * 0.25; // 25% profit margin
    
    console.log('Monthly sales data:', { monthlySales, monthlyRevenue, monthlyProfit });
    
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
    
    // Get actual repair data from database
    const repairStats = await Repair.aggregate([
      {
        $group: {
          _id: null,
          totalRepairs: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          monthlyCost: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$startDate', currentMonth] },
                    { $lt: ['$startDate', nextMonth] }
                  ]
                },
                '$totalCost',
                0
              ]
            }
          }
        }
      }
    ]);
    
    const totalRepairs = repairStats.length > 0 ? repairStats[0].totalRepairs : 0;
    const totalRepairExpenses = repairStats.length > 0 ? repairStats[0].totalCost : 0;
    const monthlyRepairExpenses = repairStats.length > 0 ? repairStats[0].monthlyCost : 0;
    
    console.log('Repair stats:', { totalRepairs, totalRepairExpenses, monthlyRepairExpenses });
    const totalCustomers = await Customer.countDocuments();
    
    // Get actual recent sales data from database
    const recentSales = await Motorcycle.find({ 
      status: 'sold',
      saleDate: { $exists: true }
    })
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
        inTransit,
        reserved
      },
      monthly: {
        sales: monthlySales,
        revenue: monthlyRevenue,
        profit: monthlyProfit,
        repairExpenses: monthlyRepairExpenses
      },
      repairs: {
        total: totalRepairExpenses,
        monthly: monthlyRepairExpenses
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
    console.log('Motorcycles total:', response.motorcycles.total);
    console.log('Monthly sales:', response.monthly.sales);
    console.log('Total customers:', response.totalCustomers);
    
    // Add some debugging to see if the data is correct
    console.log('=== DASHBOARD DEBUG INFO ===');
    console.log('Motorcycles breakdown:', {
      total: response.motorcycles.total,
      inStock: response.motorcycles.inStock,
      sold: response.motorcycles.sold,
      inRepair: response.motorcycles.inRepair,
      inTransit: response.motorcycles.inTransit
    });
    console.log('Monthly data:', {
      sales: response.monthly.sales,
      revenue: response.monthly.revenue,
      profit: response.monthly.profit
    });
    console.log('Other data:', {
      totalCustomers: response.totalCustomers,
      pendingTransports: response.pending.transports,
      pendingRepairs: response.pending.repairs
    });
    console.log('=== END DEBUG INFO ===');
    
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



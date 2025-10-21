import express from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Motorcycle from '../models/Motorcycle.js';
import Contract from '../models/Contract.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import Transport from '../models/Transport.js';
import Repair from '../models/Repair.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Sales report
router.get('/sales', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const filter = { status: 'sold' };
    if (startDate && endDate) {
      filter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const sales = await Motorcycle.find(filter)
      .populate('customer', 'fullName phone')
      .populate('supplier', 'name')
      .sort('-saleDate');
    
    const totalRevenue = sales.reduce((sum, bike) => sum + (bike.sellingPrice || 0), 0);
    const totalProfit = sales.reduce((sum, bike) => sum + ((bike.sellingPrice || 0) - (bike.purchasePrice || 0)), 0);
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
      
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Brand', key: 'brand', width: 15 },
        { header: 'Model', key: 'model', width: 15 },
        { header: 'Chassis No', key: 'chassis', width: 20 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Purchase Price', key: 'purchase', width: 15 },
        { header: 'Selling Price', key: 'selling', width: 15 },
        { header: 'Profit', key: 'profit', width: 15 }
      ];
      
      sales.forEach(sale => {
        worksheet.addRow({
          date: new Date(sale.saleDate).toLocaleDateString(),
          brand: sale.brand,
          model: sale.model,
          chassis: sale.chassisNumber,
          customer: sale.customer?.fullName || 'N/A',
          purchase: sale.purchasePrice,
          selling: sale.sellingPrice,
          profit: (sale.sellingPrice || 0) - (sale.purchasePrice || 0)
        });
      });
      
      // Add summary row
      worksheet.addRow({});
      worksheet.addRow({
        date: 'TOTAL',
        purchase: sales.reduce((sum, s) => sum + s.purchasePrice, 0),
        selling: totalRevenue,
        profit: totalProfit
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({
        sales,
        summary: {
          totalSales: sales.length,
          totalRevenue,
          totalProfit
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

// Inventory report
router.get('/inventory', authenticate, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const inventory = await Motorcycle.find()
      .populate('supplier', 'name company')
      .populate('customer', 'fullName')
      .sort('-createdAt');
    
    const summary = {
      total: inventory.length,
      inStock: inventory.filter(m => m.status === 'in_stock').length,
      sold: inventory.filter(m => m.status === 'sold').length,
      inRepair: inventory.filter(m => m.status === 'in_repair').length,
      inTransit: inventory.filter(m => m.status === 'in_transit').length,
      totalValue: inventory.filter(m => m.status === 'in_stock').reduce((sum, m) => sum + m.purchasePrice, 0)
    };
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventory Report');
      
      worksheet.columns = [
        { header: 'Brand', key: 'brand', width: 15 },
        { header: 'Model', key: 'model', width: 15 },
        { header: 'Year', key: 'year', width: 10 },
        { header: 'Chassis No', key: 'chassis', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Supplier', key: 'supplier', width: 25 },
        { header: 'Purchase Price', key: 'price', width: 15 },
        { header: 'Purchase Date', key: 'date', width: 15 }
      ];
      
      inventory.forEach(bike => {
        worksheet.addRow({
          brand: bike.brand,
          model: bike.model,
          year: bike.year,
          chassis: bike.chassisNumber,
          status: bike.status,
          supplier: bike.supplier?.name || 'N/A',
          price: bike.purchasePrice,
          date: new Date(bike.purchaseDate).toLocaleDateString()
        });
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ inventory, summary });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

// Supplier performance report
router.get('/suppliers', authenticate, async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    
    const supplierPerformance = await Promise.all(
      suppliers.map(async (supplier) => {
        const motorcycles = await Motorcycle.find({ supplier: supplier._id });
        const sold = motorcycles.filter(m => m.status === 'sold').length;
        const inStock = motorcycles.filter(m => m.status === 'in_stock').length;
        
        return {
          supplier: supplier.name,
          company: supplier.company,
          totalSupplied: motorcycles.length,
          sold,
          inStock,
          rating: supplier.rating,
          phone: supplier.phone
        };
      })
    );
    
    res.json(supplierPerformance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate supplier report' });
  }
});

// Transport performance report
router.get('/transport', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transports = await Transport.find(filter)
      .populate('driver', 'fullName')
      .populate('motorcycle', 'brand model')
      .populate('customer', 'fullName');
    
    const summary = {
      total: transports.length,
      pending: transports.filter(t => t.status === 'pending').length,
      inTransit: transports.filter(t => t.status === 'in_transit').length,
      delivered: transports.filter(t => t.status === 'delivered').length,
      cancelled: transports.filter(t => t.status === 'cancelled').length,
      totalCost: transports.reduce((sum, t) => sum + (t.transportCost || 0), 0)
    };
    
    res.json({ transports, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate transport report' });
  }
});

// Repair costs report
router.get('/repairs', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const repairs = await Repair.find(filter)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('mechanic', 'fullName')
      .sort('-startDate');
    
    const summary = {
      totalRepairs: repairs.length,
      completed: repairs.filter(r => r.status === 'completed').length,
      inProgress: repairs.filter(r => r.status === 'in_progress').length,
      totalCost: repairs.reduce((sum, r) => sum + r.totalCost, 0),
      totalLabor: repairs.reduce((sum, r) => sum + (r.laborCost || 0), 0)
    };
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Repairs Report');
      
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Motorcycle', key: 'motorcycle', width: 20 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Mechanic', key: 'mechanic', width: 20 },
        { header: 'Labor Cost', key: 'labor', width: 15 },
        { header: 'Total Cost', key: 'total', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      repairs.forEach(repair => {
        worksheet.addRow({
          date: new Date(repair.startDate).toLocaleDateString(),
          motorcycle: `${repair.motorcycle.brand} ${repair.motorcycle.model}`,
          type: repair.repairType,
          mechanic: repair.mechanic.fullName,
          labor: repair.laborCost,
          total: repair.totalCost,
          status: repair.status
        });
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=repairs-report.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ repairs, summary });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate repairs report' });
  }
});

// Profit report
router.get('/profit', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { status: 'sold' };
    if (startDate && endDate) {
      filter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const sales = await Motorcycle.find(filter);
    
    // Get repair costs for sold motorcycles
    const motorcycleIds = sales.map(s => s._id);
    const repairs = await Repair.find({ 
      motorcycle: { $in: motorcycleIds },
      status: 'completed'
    });
    
    const totalRevenue = sales.reduce((sum, bike) => sum + (bike.sellingPrice || 0), 0);
    const totalPurchaseCost = sales.reduce((sum, bike) => sum + (bike.purchasePrice || 0), 0);
    const totalRepairCost = repairs.reduce((sum, repair) => sum + repair.totalCost, 0);
    
    const grossProfit = totalRevenue - totalPurchaseCost;
    const netProfit = grossProfit - totalRepairCost;
    
    res.json({
      period: { startDate, endDate },
      totalRevenue,
      totalPurchaseCost,
      totalRepairCost,
      grossProfit,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
      totalSales: sales.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate profit report' });
  }
});

export default router;



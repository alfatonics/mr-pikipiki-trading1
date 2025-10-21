import express from 'express';
import Motorcycle from '../models/Motorcycle.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all motorcycles
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, brand, supplier } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (brand) filter.brand = brand;
    if (supplier) filter.supplier = supplier;
    
    const motorcycles = await Motorcycle.find(filter)
      .populate('supplier', 'name company')
      .populate('customer', 'fullName phone')
      .sort('-createdAt');
    
    res.json(motorcycles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch motorcycles' });
  }
});

// Get single motorcycle
router.get('/:id', authenticate, async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findById(req.params.id)
      .populate('supplier')
      .populate('customer');
    
    if (!motorcycle) {
      return res.status(404).json({ error: 'Motorcycle not found' });
    }
    
    res.json(motorcycle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch motorcycle' });
  }
});

// Create new motorcycle
router.post('/', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const motorcycle = new Motorcycle(req.body);
    await motorcycle.save();
    
    const populated = await Motorcycle.findById(motorcycle._id)
      .populate('supplier', 'name company');
    
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Chassis number already exists' });
    }
    res.status(500).json({ error: 'Failed to create motorcycle' });
  }
});

// Update motorcycle
router.put('/:id', authenticate, authorize('admin', 'sales', 'registration'), async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier customer');
    
    if (!motorcycle) {
      return res.status(404).json({ error: 'Motorcycle not found' });
    }
    
    res.json(motorcycle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update motorcycle' });
  }
});

// Delete motorcycle
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findByIdAndDelete(req.params.id);
    
    if (!motorcycle) {
      return res.status(404).json({ error: 'Motorcycle not found' });
    }
    
    res.json({ message: 'Motorcycle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete motorcycle' });
  }
});

// Get motorcycle statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = await Motorcycle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;



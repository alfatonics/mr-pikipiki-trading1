import express from 'express';
import Transport from '../models/Transport.js';
import Motorcycle from '../models/Motorcycle.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all transport records
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, driver } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (driver) filter.driver = driver;
    
    const transports = await Transport.find(filter)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('customer', 'fullName phone address')
      .populate('driver', 'fullName phone')
      .sort('-scheduledDate');
    
    res.json(transports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transport records' });
  }
});

// Get single transport record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id)
      .populate('motorcycle')
      .populate('customer')
      .populate('driver', 'fullName phone');
    
    if (!transport) {
      return res.status(404).json({ error: 'Transport record not found' });
    }
    
    res.json(transport);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transport record' });
  }
});

// Create new transport record
router.post('/', authenticate, authorize('admin', 'transport', 'sales'), async (req, res) => {
  try {
    const transport = new Transport(req.body);
    await transport.save();
    
    // Update motorcycle status to in_transit
    await Motorcycle.findByIdAndUpdate(req.body.motorcycle, {
      status: 'in_transit'
    });
    
    const populated = await Transport.findById(transport._id)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('customer', 'fullName phone address')
      .populate('driver', 'fullName phone');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transport record' });
  }
});

// Update transport record
router.put('/:id', authenticate, authorize('admin', 'transport'), async (req, res) => {
  try {
    const transport = await Transport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('motorcycle customer driver');
    
    if (!transport) {
      return res.status(404).json({ error: 'Transport record not found' });
    }
    
    // Update motorcycle status based on transport status
    if (req.body.status === 'delivered') {
      await Motorcycle.findByIdAndUpdate(transport.motorcycle._id, {
        status: 'sold'
      });
    }
    
    res.json(transport);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transport record' });
  }
});

// Mark as delivered
router.post('/:id/deliver', authenticate, authorize('admin', 'transport'), async (req, res) => {
  try {
    const transport = await Transport.findByIdAndUpdate(
      req.params.id,
      {
        status: 'delivered',
        actualDeliveryDate: new Date(),
        customerSignature: req.body.signature
      },
      { new: true }
    ).populate('motorcycle customer driver');
    
    if (!transport) {
      return res.status(404).json({ error: 'Transport record not found' });
    }
    
    // Update motorcycle status
    await Motorcycle.findByIdAndUpdate(transport.motorcycle._id, {
      status: 'sold'
    });
    
    res.json(transport);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as delivered' });
  }
});

// Delete transport record
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const transport = await Transport.findByIdAndDelete(req.params.id);
    
    if (!transport) {
      return res.status(404).json({ error: 'Transport record not found' });
    }
    
    res.json({ message: 'Transport record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transport record' });
  }
});

export default router;



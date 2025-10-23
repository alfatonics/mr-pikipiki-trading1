import express from 'express';
import Customer from '../models/Customer.js';
import Motorcycle from '../models/Motorcycle.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Customers API requested by user:', req.user.username);
    const customers = await Customer.find().sort('-createdAt');
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Customers API error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer with purchase history
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get motorcycles purchased by this customer
    const motorcycles = await Motorcycle.find({ customer: req.params.id })
      .populate('supplier', 'name company');
    
    res.json({
      ...customer.toObject(),
      purchases: motorcycles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'ID number already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Check if customer has motorcycles
    const hasMotorcycles = await Motorcycle.exists({ customer: req.params.id });
    if (hasMotorcycles) {
      return res.status(400).json({ error: 'Cannot delete customer with purchase history' });
    }
    
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Search customers
router.get('/search/:query', authenticate, async (req, res) => {
  try {
    const query = req.params.query;
    const customers = await Customer.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { idNumber: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

export default router;



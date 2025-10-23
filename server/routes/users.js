import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    console.log('Updating user:', req.params.id, 'with data:', { ...updateData, password: password ? '[PROVIDED]' : '[NOT PROVIDED]' });
    
    // If password is provided and not empty, hash it before updating
    if (password && password.trim() !== '') {
      console.log('Hashing new password...');
      updateData.password = await bcrypt.hash(password, 10);
    } else {
      console.log('No password provided, keeping existing password');
    }
    
    // Use findByIdAndUpdate with proper options
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query' // This helps with validation
      }
    ).select('-password');
    
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User updated successfully:', user.username);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `Validation failed: ${errors.join(', ')}` });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get users by role
router.get('/by-role/:role', authenticate, async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role, isActive: true })
      .select('fullName username role')
      .sort('fullName');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;



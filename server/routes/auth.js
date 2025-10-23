import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login with mobile debugging
router.post('/login', async (req, res) => {
  try {
    console.log('=== MOBILE LOGIN REQUEST ===');
    console.log('User Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    console.log('X-Mobile-Request:', req.headers['x-mobile-request']);
    console.log('Request IP:', req.ip);
    console.log('Request body:', { username: req.body.username, password: '[HIDDEN]' });
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user || !user.isActive) {
      console.log('User not found or inactive:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', username, 'Role:', user.role);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('=== MOBILE LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('User Agent:', req.headers['user-agent']);
    console.error('Origin:', req.headers.origin);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Verify token
router.get('/verify', authenticate, async (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName,
      role: req.user.role,
      email: req.user.email
    }
  });
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;



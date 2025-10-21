import express from 'express';
import Repair from '../models/Repair.js';
import Motorcycle from '../models/Motorcycle.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all repairs
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, mechanic, motorcycle } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (mechanic) filter.mechanic = mechanic;
    if (motorcycle) filter.motorcycle = motorcycle;
    
    const repairs = await Repair.find(filter)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('mechanic', 'fullName')
      .sort('-startDate');
    
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repairs' });
  }
});

// Get single repair
router.get('/:id', authenticate, async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate('motorcycle')
      .populate('mechanic', 'fullName phone');
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair record not found' });
    }
    
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repair record' });
  }
});

// Create new repair
router.post('/', authenticate, authorize('admin', 'mechanic'), async (req, res) => {
  try {
    console.log('Creating repair with data:', req.body);

    // Validate required fields
    if (!req.body.motorcycle || !req.body.mechanic) {
      return res.status(400).json({ error: 'Motorcycle and Mechanic are required' });
    }

    // Check if motorcycle exists
    const motorcycle = await Motorcycle.findById(req.body.motorcycle);
    if (!motorcycle) {
      return res.status(404).json({ error: 'Motorcycle not found' });
    }

    // Create repair record
    const repair = new Repair(req.body);
    await repair.save();
    
    console.log('Repair created successfully:', repair._id);

    // Update motorcycle status to in_repair
    await Motorcycle.findByIdAndUpdate(req.body.motorcycle, {
      status: 'in_repair'
    });
    
    console.log('Motorcycle status updated to in_repair');

    const populated = await Repair.findById(repair._id)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('mechanic', 'fullName');
    
    console.log('Repair populated and ready to send');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating repair record:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    res.status(500).json({ error: 'Failed to create repair record: ' + error.message });
  }
});

// Update repair
router.put('/:id', authenticate, authorize('admin', 'mechanic'), async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('motorcycle mechanic');
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair record not found' });
    }
    
    // Update motorcycle status if repair is completed
    if (req.body.status === 'completed') {
      await Motorcycle.findByIdAndUpdate(repair.motorcycle._id, {
        status: 'in_stock'
      });
    }
    
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update repair record' });
  }
});

// Complete repair
router.post('/:id/complete', authenticate, authorize('admin', 'mechanic'), async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completionDate: new Date()
      },
      { new: true }
    ).populate('motorcycle mechanic');
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair record not found' });
    }
    
    // Update motorcycle status back to in_stock
    await Motorcycle.findByIdAndUpdate(repair.motorcycle._id, {
      status: 'in_stock'
    });
    
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete repair' });
  }
});

// Start work on repair
router.post('/:id/start-work', authenticate, authorize('admin', 'mechanic'), async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair not found' });
    }
    
    if (repair.status !== 'pending') {
      return res.status(400).json({ error: 'Can only start pending repairs' });
    }
    
    repair.status = 'in_progress';
    await repair.save();
    
    const populated = await Repair.findById(repair._id)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('mechanic', 'fullName');
    
    console.log('Repair started:', repair._id);
    res.json(populated);
  } catch (error) {
    console.error('Error starting repair:', error);
    res.status(500).json({ error: 'Failed to start repair: ' + error.message });
  }
});

// Register repair details (parts, labor, costs)
router.post('/:id/register-details', authenticate, authorize('admin', 'mechanic'), async (req, res) => {
  try {
    const { spareParts, laborCost, laborHours, workDescription, issuesFound, recommendations } = req.body;
    
    const repair = await Repair.findById(req.params.id)
      .populate('motorcycle', 'brand model chassisNumber')
      .populate('mechanic', 'fullName');
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair not found' });
    }
    
    if (repair.status !== 'in_progress') {
      return res.status(400).json({ error: 'Can only register details for in-progress repairs' });
    }
    
    // Create approval request for repair details
    const Approval = (await import('../models/Approval.js')).default;
    
    const approvalData = {
      approvalType: 'repair_edit',
      entityType: 'Repair',
      entityId: repair._id,
      proposedData: {
        spareParts,
        laborCost: parseFloat(laborCost),
        laborHours: parseFloat(laborHours),
        workDescription,
        issuesFound,
        recommendations,
        detailsRegistered: true
      },
      originalData: {
        spareParts: repair.spareParts,
        laborCost: repair.laborCost,
        laborHours: repair.laborHours
      },
      description: `Repair details for ${repair.motorcycle.brand} ${repair.motorcycle.model} - Labor: ${laborHours}hrs, Cost: ${laborCost} TZS`,
      priority: parseFloat(laborCost) > 500000 ? 'high' : 'medium',
      requestedBy: req.user._id
    };
    
    const approval = new Approval(approvalData);
    await approval.save();
    
    // Update repair status
    repair.status = 'awaiting_details_approval';
    repair.detailsApprovalId = approval._id;
    await repair.save();
    
    console.log('Repair details submitted for approval:', repair._id);
    
    res.json({
      message: 'Repair details submitted for approval',
      approval,
      repair
    });
  } catch (error) {
    console.error('Error registering repair details:', error);
    res.status(500).json({ error: 'Failed to register repair details: ' + error.message });
  }
});

// Delete repair
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair record not found' });
    }
    
    res.json({ message: 'Repair record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete repair record' });
  }
});

// Get repair costs summary
router.get('/stats/costs', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: 'completed' };
    
    if (startDate && endDate) {
      filter.completionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const repairs = await Repair.find(filter);
    
    const totalCost = repairs.reduce((sum, repair) => sum + repair.totalCost, 0);
    const totalLabor = repairs.reduce((sum, repair) => sum + (repair.laborCost || 0), 0);
    const totalParts = totalCost - totalLabor;
    
    res.json({
      totalRepairs: repairs.length,
      totalCost,
      totalLabor,
      totalParts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repair costs' });
  }
});

export default router;



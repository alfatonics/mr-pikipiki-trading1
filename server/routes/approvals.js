import express from 'express';
import Approval from '../models/Approval.js';
import Contract from '../models/Contract.js';
import Motorcycle from '../models/Motorcycle.js';
import Repair from '../models/Repair.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get my approval requests (for any user)
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { requestedBy: req.user._id };
    
    // Filter by status
    if (status) {
      // Handle comma-separated statuses
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }
    
    const requests = await Approval.find(filter)
      .populate('salesApprovedBy', 'fullName username')
      .populate('adminApprovedBy', 'fullName username')
      .populate('rejectedBy', 'fullName username')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

// Get all approval requests (admin/sales only)
router.get('/', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    
    // Filter by status
    if (status) {
      filter.status = status;
    } else {
      // By default, show pending approvals
      filter.status = { $in: ['pending_sales', 'pending_admin'] };
    }
    
    // Filter by type
    if (type) filter.approvalType = type;
    
    // Sales role can only see pending_sales
    if (req.user.role === 'sales' && !status) {
      filter.status = 'pending_sales';
    }
    
    const approvals = await Approval.find(filter)
      .populate('requestedBy', 'fullName username role')
      .populate('salesApprovedBy', 'fullName username')
      .populate('adminApprovedBy', 'fullName username')
      .populate('rejectedBy', 'fullName username')
      .sort('-createdAt');
    
    res.json(approvals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// Get single approval request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id)
      .populate('requestedBy', 'fullName username role email phone')
      .populate('salesApprovedBy', 'fullName username')
      .populate('adminApprovedBy', 'fullName username')
      .populate('rejectedBy', 'fullName username');
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }
    
    res.json(approval);
  } catch (error) {
    console.error('Error fetching approval:', error);
    res.status(500).json({ error: 'Failed to fetch approval request' });
  }
});

// Create new approval request
router.post('/', authenticate, async (req, res) => {
  try {
    const approvalData = {
      ...req.body,
      requestedBy: req.user._id,
      status: 'pending_sales' // Always starts with sales approval
    };
    
    const approval = new Approval(approvalData);
    await approval.save();
    
    const populated = await Approval.findById(approval._id)
      .populate('requestedBy', 'fullName username role');
    
    console.log('Approval request created:', approval._id);
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating approval request:', error);
    res.status(500).json({ error: 'Failed to create approval request: ' + error.message });
  }
});

// Sales approval
router.post('/:id/sales-approve', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { comments } = req.body;
    
    const approval = await Approval.findById(req.params.id);
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }
    
    if (approval.status !== 'pending_sales') {
      return res.status(400).json({ error: 'This approval is not pending sales review' });
    }
    
    // Update approval status
    approval.status = 'pending_admin';
    approval.salesApprovedBy = req.user._id;
    approval.salesApprovedAt = new Date();
    approval.salesComments = comments;
    
    await approval.save();
    
    const populated = await Approval.findById(approval._id)
      .populate('requestedBy', 'fullName username role')
      .populate('salesApprovedBy', 'fullName username')
      .populate('adminApprovedBy', 'fullName username');
    
    console.log('Sales approved:', approval._id);
    res.json(populated);
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Admin final approval (executes the change)
router.post('/:id/admin-approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { comments } = req.body;
    
    const approval = await Approval.findById(req.params.id);
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }
    
    if (approval.status !== 'pending_admin') {
      return res.status(400).json({ error: 'This approval is not pending admin review' });
    }
    
    // Update approval status
    approval.status = 'approved';
    approval.adminApprovedBy = req.user._id;
    approval.adminApprovedAt = new Date();
    approval.adminComments = comments;
    
    await approval.save();
    
    // Execute the approved change
    await executeApprovedChange(approval);
    
    const populated = await Approval.findById(approval._id)
      .populate('requestedBy', 'fullName username role')
      .populate('salesApprovedBy', 'fullName username')
      .populate('adminApprovedBy', 'fullName username');
    
    console.log('Admin approved and executed:', approval._id);
    res.json(populated);
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request: ' + error.message });
  }
});

// Reject approval request
router.post('/:id/reject', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const approval = await Approval.findById(req.params.id);
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }
    
    if (approval.status === 'approved' || approval.status === 'rejected') {
      return res.status(400).json({ error: 'This approval has already been processed' });
    }
    
    // Check authorization - sales can only reject pending_sales
    if (req.user.role === 'sales' && approval.status !== 'pending_sales') {
      return res.status(403).json({ error: 'You can only reject requests pending sales approval' });
    }
    
    approval.status = 'rejected';
    approval.rejectedBy = req.user._id;
    approval.rejectedAt = new Date();
    approval.rejectionReason = reason;
    
    await approval.save();
    
    const populated = await Approval.findById(approval._id)
      .populate('requestedBy', 'fullName username role')
      .populate('rejectedBy', 'fullName username');
    
    console.log('Approval rejected:', approval._id);
    res.json(populated);
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Get pending approvals count (for notifications)
router.get('/stats/pending-count', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const filter = {};
    
    if (req.user.role === 'sales') {
      filter.status = 'pending_sales';
    } else if (req.user.role === 'admin') {
      filter.status = 'pending_admin';
    }
    
    const count = await Approval.countDocuments(filter);
    
    res.json({ count });
  } catch (error) {
    console.error('Error counting pending approvals:', error);
    res.status(500).json({ error: 'Failed to count pending approvals' });
  }
});

// Helper function to execute approved changes
async function executeApprovedChange(approval) {
  try {
    switch (approval.approvalType) {
      case 'sales_contract':
      case 'purchase_contract':
        // Create the contract
        const contract = new Contract(approval.proposedData);
        await contract.save();
        
        // Update motorcycle status
        if (approval.proposedData.motorcycle) {
          const statusUpdate = approval.approvalType === 'sales_contract' ? 'sold' : 'in_stock';
          await Motorcycle.findByIdAndUpdate(approval.proposedData.motorcycle, {
            status: statusUpdate
          });
        }
        
        console.log('Contract created from approval:', contract._id);
        break;
        
      case 'motorcycle_price_change':
      case 'motorcycle_edit':
        // Update motorcycle
        await Motorcycle.findByIdAndUpdate(
          approval.entityId,
          approval.proposedData,
          { runValidators: true }
        );
        
        console.log('Motorcycle updated from approval:', approval.entityId);
        break;
        
      case 'contract_edit':
        // Update contract
        await Contract.findByIdAndUpdate(
          approval.entityId,
          approval.proposedData,
          { runValidators: true }
        );
        
        console.log('Contract updated from approval:', approval.entityId);
        break;
        
      case 'contract_delete':
        // Delete contract
        await Contract.findByIdAndDelete(approval.entityId);
        
        console.log('Contract deleted from approval:', approval.entityId);
        break;
        
      case 'repair_create':
        // Create the repair
        const repair = new Repair(approval.proposedData);
        await repair.save();
        
        // Update motorcycle status to in_repair
        if (approval.proposedData.motorcycle) {
          await Motorcycle.findByIdAndUpdate(approval.proposedData.motorcycle, {
            status: 'in_repair'
          });
        }
        
        console.log('Repair created from approval:', repair._id);
        break;
        
      case 'repair_edit':
        // Update repair with approved details
        const updatedRepair = await Repair.findByIdAndUpdate(
          approval.entityId,
          {
            ...approval.proposedData,
            status: 'details_approved' // Ready for completion
          },
          { new: true, runValidators: true }
        );
        
        console.log('Repair details approved:', approval.entityId);
        break;
        
      case 'repair_complete':
        // Complete repair
        await Repair.findByIdAndUpdate(
          approval.entityId,
          {
            status: 'completed',
            completionDate: new Date()
          }
        );
        
        // Get repair to update motorcycle
        const completedRepair = await Repair.findById(approval.entityId);
        if (completedRepair && completedRepair.motorcycle) {
          await Motorcycle.findByIdAndUpdate(completedRepair.motorcycle, {
            status: 'in_stock'
          });
        }
        
        console.log('Repair completed from approval:', approval.entityId);
        break;
        
      default:
        throw new Error('Unknown approval type: ' + approval.approvalType);
    }
  } catch (error) {
    console.error('Error executing approved change:', error);
    throw error;
  }
}

export default router;


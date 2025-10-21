import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  // Type of approval request
  approvalType: {
    type: String,
    enum: [
      'sales_contract',
      'purchase_contract', 
      'motorcycle_price_change',
      'motorcycle_edit',
      'contract_edit',
      'contract_delete',
      'repair_create',
      'repair_edit',
      'repair_complete'
    ],
    required: true
  },
  
  // What is being changed
  entityType: {
    type: String,
    enum: ['Contract', 'Motorcycle', 'Supplier', 'Customer', 'Repair'],
    required: true
  },
  
  // Reference to the entity (if editing existing)
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  
  // The data being proposed
  proposedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Original data (for edits)
  originalData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Current approval status
  status: {
    type: String,
    enum: ['pending_sales', 'pending_admin', 'approved', 'rejected'],
    default: 'pending_sales'
  },
  
  // Who requested this change
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Sales approval
  salesApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  salesApprovedAt: {
    type: Date
  },
  salesComments: {
    type: String
  },
  
  // Admin approval
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminApprovedAt: {
    type: Date
  },
  adminComments: {
    type: String
  },
  
  // Rejection info
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Description of the change
  description: {
    type: String,
    required: true
  },
  
  // Additional notes
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
approvalSchema.index({ status: 1, createdAt: -1 });
approvalSchema.index({ requestedBy: 1, status: 1 });
approvalSchema.index({ approvalType: 1, status: 1 });

export default mongoose.model('Approval', approvalSchema);


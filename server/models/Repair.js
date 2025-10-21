import mongoose from 'mongoose';

const repairSchema = new mongoose.Schema({
  motorcycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorcycle',
    required: true
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  repairType: {
    type: String,
    enum: ['routine_maintenance', 'engine_repair', 'body_repair', 'electrical', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'awaiting_details_approval', 'details_approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  spareParts: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  laborCost: {
    type: Number,
    default: 0
  },
  laborHours: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  // New fields for repair details workflow
  detailsRegistered: {
    type: Boolean,
    default: false
  },
  detailsApprovalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Approval'
  },
  workDescription: {
    type: String // Detailed description of work done
  },
  issuesFound: {
    type: String // Issues discovered during repair
  },
  recommendations: {
    type: String // Recommendations for future
  }
}, {
  timestamps: true
});

// Calculate total cost before saving
repairSchema.pre('save', function(next) {
  if (this.spareParts && this.spareParts.length > 0) {
    const partsTotal = this.spareParts.reduce((sum, part) => sum + (part.cost || 0), 0);
    this.totalCost = partsTotal + (this.laborCost || 0);
  } else {
    this.totalCost = this.laborCost || 0;
  }
  next();
});

export default mongoose.model('Repair', repairSchema);



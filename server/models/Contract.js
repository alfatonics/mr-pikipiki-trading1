import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['purchase', 'sale'],
    required: true
  },
  motorcycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorcycle',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'partyModel',
    required: true
  },
  partyModel: {
    type: String,
    enum: ['Supplier', 'Customer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'installment'],
    required: true
  },
  installmentDetails: {
    downPayment: Number,
    monthlyPayment: Number,
    duration: Number, // in months
    startDate: Date
  },
  terms: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  printedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  printedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Contract', contractSchema);



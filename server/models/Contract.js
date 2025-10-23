import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  // Contract Identification
  contractNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'service', 'maintenance'],
    required: true
  },
  
  // Parties Information
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
  
  // Contract Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'TZS',
    enum: ['TZS', 'USD', 'EUR']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'installment', 'cheque'],
    required: true
  },
  installmentDetails: {
    downPayment: Number,
    monthlyPayment: Number,
    duration: Number, // in months
    startDate: Date,
    interestRate: Number,
    totalAmount: Number
  },
  
  // Legal Terms and Conditions
  terms: {
    type: String,
    required: true
  },
  warranties: [{
    description: String,
    duration: Number, // in months
    conditions: String
  }],
  penalties: [{
    description: String,
    amount: Number,
    conditions: String
  }],
  
  // Contract Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'completed', 'cancelled', 'breached'],
    default: 'draft'
  },
  
  // Signatures and Legal Compliance
  signatures: {
    partySignature: {
      signed: { type: Boolean, default: false },
      signedAt: Date,
      signatureImage: String, // Base64 or file path
      witnessName: String,
      witnessSignature: String
    },
    companySignature: {
      signed: { type: Boolean, default: false },
      signedAt: Date,
      signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      signatureImage: String,
      stampImage: String
    }
  },
  
  // Document Management
  documents: [{
    type: {
      type: String,
      enum: ['signed_contract', 'id_copy', 'receipt', 'warranty', 'other'],
      required: true
    },
    filename: String,
    originalName: String,
    filePath: String,
    uploadedAt: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String
  }],
  
  // Print and Physical Handling
  printHistory: [{
    printedAt: Date,
    printedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    printCount: Number,
    reason: String
  }],
  
  // Legal and Compliance
  legalCompliance: {
    gdprCompliant: { type: Boolean, default: false },
    dataRetentionPeriod: Number, // in years
    courtAdmissible: { type: Boolean, default: true },
    notarized: { type: Boolean, default: false },
    notarizedAt: Date,
    notaryName: String,
    notaryStamp: String
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificationHistory: [{
    modifiedAt: Date,
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changes: String,
    reason: String
  }],
  
  // Additional Information
  notes: String,
  internalNotes: String, // For internal use only
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better performance
contractSchema.index({ contractNumber: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ type: 1 });
contractSchema.index({ 'signatures.partySignature.signed': 1 });
contractSchema.index({ 'signatures.companySignature.signed': 1 });
contractSchema.index({ createdAt: -1 });

// Virtual for contract age
contractSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for completion status
contractSchema.virtual('isFullyExecuted').get(function() {
  return this.signatures.partySignature.signed && this.signatures.companySignature.signed;
});

// Method to check if contract is legally binding
contractSchema.methods.isLegallyBinding = function() {
  return this.isFullyExecuted && this.status === 'active';
};

// Method to get contract summary
contractSchema.methods.getSummary = function() {
  return {
    contractNumber: this.contractNumber,
    type: this.type,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    isFullyExecuted: this.isFullyExecuted,
    ageInDays: this.ageInDays
  };
};

export default mongoose.model('Contract', contractSchema);
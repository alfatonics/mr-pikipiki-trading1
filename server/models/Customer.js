import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  idType: {
    type: String,
    enum: ['NIDA', 'Passport', 'Driving License', 'Voter ID'],
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    default: 'Dar es Salaam'
  },
  region: {
    type: String
  },
  occupation: {
    type: String
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  // Sales/Pricing Information
  budgetRange: {
    type: String,
    enum: ['under-500k', '500k-1m', '1m-2m', '2m-5m', '5m-10m', 'over-10m'],
    default: ''
  },
  preferredCurrency: {
    type: String,
    enum: ['TZS', 'USD', 'EUR'],
    default: 'TZS'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'installment', 'credit', 'lease'],
    default: 'cash'
  },
  salesNotes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema);



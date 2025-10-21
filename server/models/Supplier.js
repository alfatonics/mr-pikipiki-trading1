import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
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
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    default: 'Dar es Salaam'
  },
  country: {
    type: String,
    default: 'Tanzania'
  },
  taxId: {
    type: String,
    trim: true
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  totalSupplied: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Supplier', supplierSchema);



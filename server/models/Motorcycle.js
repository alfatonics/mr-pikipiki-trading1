import mongoose from 'mongoose';

const motorcycleSchema = new mongoose.Schema({
  chassisNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  engineNumber: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['in_stock', 'sold', 'in_repair', 'in_transit', 'reserved'],
    default: 'in_stock'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  saleDate: {
    type: Date
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Motorcycle', motorcycleSchema);



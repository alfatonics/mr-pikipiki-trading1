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
  }
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema);



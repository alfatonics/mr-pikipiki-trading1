import mongoose from 'mongoose';

const transportSchema = new mongoose.Schema({
  motorcycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorcycle',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  deliveryLocation: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  transportCost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  customerSignature: {
    type: String // Can store signature image path or data
  }
}, {
  timestamps: true
});

export default mongoose.model('Transport', transportSchema);



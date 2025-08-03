import mongoose from 'mongoose';
const { Schema } = mongoose;

const paymentSchema = new Schema({
  requestId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  seekerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  platformFee: {
    type: Number,
    required: true,
    min: [0, 'Platform fee cannot be negative']
  },
  providerAmount: {
    type: Number,
    required: true,
    min: [0, 'Provider amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'agreed', 'completed', 'disputed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'cod', 'bank_transfer', 'cash', 'vodafone_cash', 'meeza', 'fawry'],
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'manual', 'vodafone_cash_api', 'meeza_api', 'fawry_api'],
    default: 'manual'
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  verificationDate: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ requestId: 1 });
paymentSchema.index({ seekerId: 1, status: 1 });
paymentSchema.index({ providerId: 1, status: 1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate provider amount
paymentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('platformFee') || this.isNew) {
    this.providerAmount = this.amount - this.platformFee;
  }
  next();
});

// Validation for amounts
paymentSchema.pre('save', function(next) {
  if (this.amount < this.platformFee) {
    return next(new Error('Platform fee cannot exceed total amount'));
  }
  if (this.providerAmount < 0) {
    return next(new Error('Provider amount cannot be negative'));
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment; 
import mongoose from 'mongoose';
const { Schema } = mongoose;

const offerSchema = new Schema({
  requestId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  timeline: {
    startDate: { type: Date, required: true },
    duration: { type: String, required: true } // e.g., "2 hours", "1 day", "3 days"
  },
  scopeOfWork: {
    type: String,
    required: true,
    maxlength: 1000
  },
  materialsIncluded: [{ type: String }],
  warranty: {
    type: String,
    default: 'No warranty'
  },
  paymentSchedule: {
    deposit: { type: Number, default: 0, min: 0 },
    milestone: { type: Number, default: 0, min: 0 },
    final: { type: Number, default: 0, min: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 48 hours from creation
      const date = new Date();
      date.setHours(date.getHours() + 48);
      return date;
    }
  }
}, {
  timestamps: true
});

// Indexes
offerSchema.index({ requestId: 1, status: 1 });
offerSchema.index({ providerId: 1, status: 1 });
offerSchema.index({ expiresAt: 1 });
offerSchema.index({ createdAt: -1 });

// Virtual for checking if offer is expired
offerSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Pre-save middleware to update status if expired
offerSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

// Validation for payment schedule
offerSchema.pre('save', function(next) {
  const total = this.paymentSchedule.deposit + this.paymentSchedule.milestone + this.paymentSchedule.final;
  if (total > this.price) {
    return next(new Error('Payment schedule total cannot exceed offer price'));
  }
  next();
});

const Offer = mongoose.model('Offer', offerSchema);
export default Offer; 
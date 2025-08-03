import mongoose from 'mongoose';
const { Schema } = mongoose;

const reviewSchema = new Schema({
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
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  photos: [{ type: String }], // URLs to review photos
  isVerified: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    enum: ['inappropriate', 'fake', 'spam', 'other'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ requestId: 1 }, { unique: true }); // One review per request
reviewSchema.index({ providerId: 1, rating: -1 });
reviewSchema.index({ seekerId: 1, createdAt: -1 });
reviewSchema.index({ isVerified: 1, createdAt: -1 });

// Validation to ensure one review per request
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingReview = await mongoose.model('Review').findOne({ requestId: this.requestId });
    if (existingReview) {
      return next(new Error('Review already exists for this request'));
    }
  }
  next();
});

// Method to mark review as helpful
reviewSchema.methods.markHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// Method to report review
reviewSchema.methods.report = function(reason) {
  this.reported = true;
  this.reportReason = reason;
  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);
export default Review; 
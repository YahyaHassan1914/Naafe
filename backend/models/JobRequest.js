import mongoose from 'mongoose';
const { Schema } = mongoose;

const serviceRequestSchema = new Schema({
  seekerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    validate: {
      validator: async function(categoryName) {
        const Category = mongoose.model('Category');
        const category = await Category.findOne({ name: categoryName, isActive: true });
        return category !== null;
      },
      message: 'Category does not exist or is not active'
    }
  },
  subcategory: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['asap', 'this_week', 'flexible'],
    default: 'flexible'
  },
  location: {
    governorate: { type: String, required: true },
    city: { type: String, required: true }
    // Private location - not shared publicly
  },
  images: [{
    url: { type: String, required: true },
    filename: { type: String, required: true },
    fileType: String,
    fileSize: Number
  }],
  answers: [{ type: String }], // Dynamic questions based on category
  status: {
    type: String,
    enum: ['open', 'negotiating', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(userId) {
        if (!userId) return true; // Allow null/undefined
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        return user && user.role === 'provider';
      },
      message: 'Assigned user must be a provider'
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 7 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  completionProof: {
    images: [String],
    description: String,
    completedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
serviceRequestSchema.index({ seekerId: 1, status: 1 });
serviceRequestSchema.index({ category: 1, subcategory: 1, status: 1 });
serviceRequestSchema.index({ 'location.governorate': 1, 'location.city': 1 });
serviceRequestSchema.index({ expiresAt: 1 });
serviceRequestSchema.index({ createdAt: -1 });

// Virtual for checking if request is expired
serviceRequestSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Pre-save middleware to update status if expired
serviceRequestSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'open') {
    this.status = 'cancelled';
  }
  next();
});

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest; 
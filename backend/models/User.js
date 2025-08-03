import mongoose from 'mongoose';
const { Schema } = mongoose;

// --- Egypt-Specific Verification Schema ---
const verificationSchema = new Schema({
  status: {
    type: String,
    enum: ['none', 'basic', 'skill', 'approved'],
    default: 'none'
  },
  basicVerification: {
    idCard: { type: String }, // URL to uploaded ID card
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  skillVerification: {
    portfolio: [{ type: String }], // URLs to portfolio images/videos
    experience: { type: String }, // Years of experience description
    learningMethod: { type: String, enum: ['apprenticeship', 'self_taught', 'family_business', 'formal_education'] },
    references: [{ type: String }], // Previous client testimonials
    practicalTest: { type: String }, // URL to practical demonstration
    verifiedAt: { type: Date }
  },
  categorySpecific: {
    tools: [{ type: String }], // Photos of professional tools
    safetyKnowledge: { type: String }, // Safety assessment
    workSamples: [{ type: String }], // Before/after photos
    verifiedAt: { type: Date }
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  auditTrail: [
    {
      action: { type: String, enum: ['submitted', 'basic_approved', 'skill_approved', 'rejected', 'blocked'], required: true },
      by: { type: Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date, default: Date.now },
      explanation: String,
    },
  ],
}, { _id: false });

const seekerProfileSchema = new Schema({
  totalJobsPosted: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
  preferredPaymentMethods: [{ type: String, enum: ['cod', 'bank_transfer', 'cash', 'vodafone_cash', 'meeza', 'fawry', 'stripe'] }],
  communicationStyle: { type: String, enum: ['text', 'voice', 'both'], default: 'text' }
}, { _id: false });

const providerProfileSchema = new Schema({
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  totalJobsCompleted: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
  skills: [{ 
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    verified: { type: Boolean, default: false }
  }],
  workingDays: { type: [String], default: [] }, // ['monday', 'tuesday', etc.]
  startTime: { type: String, default: '' },     // "09:00"
  endTime: { type: String, default: '' },       // "17:00"
  pricingRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  responseTime: { type: Number, default: 0 }, // Average response time in minutes
  completionRate: { type: Number, default: 100, min: 0, max: 100 } // Percentage
}, { _id: false });

const subscriptionSchema = new Schema({
  status: {
    type: String,
    enum: ['inactive', 'active', 'canceled', 'past_due', 'unpaid'],
    default: 'inactive'
  },
  planName: {
    type: String,
    default: null
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters long']
    },
    name: {
        first: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, 'First name must be at least 2 characters']
        },
        last: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters']
        }
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        match: [/^(\+20|0)?1[0125][0-9]{8}$/, 'Please enter a valid Egyptian phone number']
    },
    avatarUrl: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['seeker', 'provider', 'admin'],
        default: 'seeker'
    },
    verificationStatus: {
        type: String,
        enum: ['none', 'basic', 'skill', 'approved'],
        default: 'none'
    },
    isPremium: {
        type: Boolean,
        default: false,
        description: 'Whether the user has premium status'
    },
    isTopRated: {
        type: Boolean,
        default: false,
        description: 'Whether the user is top-rated (computed based on rating and job count)'
    },
    verification: { type: verificationSchema, default: undefined },
    seekerProfile: { type: seekerProfileSchema, default: () => ({}) },
    providerProfile: { type: providerProfileSchema, default: () => ({}) },
    subscription: { type: subscriptionSchema, default: () => ({}) },
    createdAt: {
      type: Date,
      default: Date.now
    },
    profile: {
        bio: {
            type: String,
            maxlength: 200,
            trim: true
        },
        location: {
            governorate: { type: String, default: '' },
            city: { type: String, default: '' },
            street: { type: String, default: '' },
            apartmentNumber: { type: String, default: '' },
            additionalInformation: { type: String, default: '' }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedReason: String,
    lastLoginAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    settings: {
        type: Schema.Types.Mixed,
        default: {}
    },
    portfolio: {
        type: [String],
        default: []
    },
    savedServices: [{
        type: Schema.Types.ObjectId,
        ref: 'ServiceRequest'
    }]
}, {
    timestamps: true
});

// Indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ verificationStatus: 1, role: 1 });
userSchema.index({ 'providerProfile.rating': -1, 'providerProfile.totalJobsCompleted': -1 });

userSchema.virtual('fullName').get(function () {
    return `${this.name.first} ${this.name.last}`;
});

// Virtual field to check if provider is verified
userSchema.virtual('isProviderVerified').get(function () {
  return this.role === 'provider' && this.verificationStatus === 'approved';
});

// Method to compute and update isTopRated status
userSchema.methods.updateTopRatedStatus = function() {
  if (this.role === 'provider' && this.providerProfile) {
    const { rating, reviewCount, totalJobsCompleted } = this.providerProfile;
    const isVerified = this.isProviderVerified;
    
    // Top-rated criteria: rating >= 4.8, reviewCount > 10, totalJobsCompleted > 30, and verified
    this.isTopRated = rating >= 4.8 && reviewCount > 10 && totalJobsCompleted > 30 && isVerified;
  } else {
    this.isTopRated = false;
  }
  return this.isTopRated;
};

// Pre-save middleware to update isTopRated status
userSchema.pre('save', function(next) {
  if (this.isModified('providerProfile.rating') || 
      this.isModified('providerProfile.reviewCount') || 
      this.isModified('providerProfile.totalJobsCompleted') ||
      this.isModified('verificationStatus')) {
    this.updateTopRatedStatus();
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
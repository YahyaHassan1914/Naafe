import mongoose from 'mongoose';
const { Schema } = mongoose;

const verificationSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['id_card', 'sms', 'manual'],
    default: null
  },
  documents: [{
    type: {
      type: String,
      enum: ['id_card', 'business_license', 'certificate', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    notes: String
  }],
  verifiedAt: Date,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String
}, { _id: false });

const seekerProfileSchema = new Schema({
  totalJobsPosted: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 }
}, { _id: false });

const providerProfileSchema = new Schema({
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  totalJobsCompleted: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
  verification: { type: verificationSchema, default: () => ({}) },
  skills: { type: [String], default: [] } // Added skills array
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
        match: [/^(\+20|0)?1[0125][0-9]{8}$/, 'Please enter a valid Egyptian phone number']
    },
    avatarUrl: {
        type: String,
        default: null
    },
    roles: {
        type: [String],
        enum: ['admin', 'seeker', 'provider'],
        default: ['seeker']
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
    seekerProfile: { type: seekerProfileSchema, default: () => ({}) },
    providerProfile: { type: providerProfileSchema, default: () => ({}) },
    profile: {
        bio: {
            type: String,
            maxlength: 1000,
            trim: true
        },
        location: {
            government: { type: String, default: '' },
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
    settings: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// All user types (seeker, provider, admin) are managed via the roles array and their respective subdocuments.

// Remove geolocation index
// userSchema.index({ 'profile.location': '2dsphere' });
userSchema.index({ roles: 1, isActive: 1 });
userSchema.index({ 'providerProfile.verification.status': 1, roles: 1 });

userSchema.virtual('fullName').get(function () {
    return `${this.name.first} ${this.name.last}`;
});

// Virtual field to check if provider is verified
userSchema.virtual('isProviderVerified').get(function () {
  return this.providerProfile && this.providerProfile.verification && this.providerProfile.verification.status === 'verified';
});

// Method to compute and update isTopRated status
userSchema.methods.updateTopRatedStatus = function() {
  if (this.roles.includes('provider') && this.providerProfile) {
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
      this.isModified('providerProfile.verification.status')) {
    this.updateTopRatedStatus();
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Subcategory schema
const subcategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Subcategory name must be at least 2 characters'],
    maxlength: [100, 'Subcategory name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for subcategory name within the category
subcategorySchema.index({ name: 1 });

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Add subcategories array
  subcategories: [subcategorySchema]

}, {
  timestamps: true
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category; 
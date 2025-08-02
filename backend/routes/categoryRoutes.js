import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { validateCreateCategory, validateUpdateCategory, validateCategoryId, validateSubcategoryId } from '../validation/categoryValidation.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', validateCategoryId, categoryController.getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, requireRole(['admin']), validateCreateCategory, categoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, requireRole(['admin']), validateCategoryId, validateUpdateCategory, categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), validateCategoryId, categoryController.deleteCategory);

/**
 * @route   PATCH /api/categories/:id/toggle
 * @desc    Toggle category status
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle', authenticateToken, requireRole(['admin']), validateCategoryId, categoryController.toggleCategoryStatus);

// Subcategory routes
/**
 * @route   GET /api/categories/:categoryId/subcategories/:subcategoryId
 * @desc    Get subcategory by ID
 * @access  Public
 */
router.get('/:categoryId/subcategories/:subcategoryId', validateSubcategoryId, categoryController.getSubcategoryById);

/**
 * @route   POST /api/categories/:categoryId/subcategories
 * @desc    Add subcategory to a category
 * @access  Private (Admin only)
 */
router.post('/:categoryId/subcategories', authenticateToken, requireRole(['admin']), validateCategoryId, validateCreateCategory, categoryController.addSubcategory);

/**
 * @route   PUT /api/categories/:categoryId/subcategories/:subcategoryId
 * @desc    Update subcategory
 * @access  Private (Admin only)
 */
router.put('/:categoryId/subcategories/:subcategoryId', authenticateToken, requireRole(['admin']), validateSubcategoryId, validateUpdateCategory, categoryController.updateSubcategory);

/**
 * @route   DELETE /api/categories/:categoryId/subcategories/:subcategoryId
 * @desc    Delete subcategory
 * @access  Private (Admin only)
 */
router.delete('/:categoryId/subcategories/:subcategoryId', authenticateToken, requireRole(['admin']), validateSubcategoryId, categoryController.deleteSubcategory);

/**
 * @route   PATCH /api/categories/:categoryId/subcategories/:subcategoryId/toggle
 * @desc    Toggle subcategory status
 * @access  Private (Admin only)
 */
router.patch('/:categoryId/subcategories/:subcategoryId/toggle', authenticateToken, requireRole(['admin']), validateSubcategoryId, categoryController.toggleSubcategoryStatus);

export default router; 
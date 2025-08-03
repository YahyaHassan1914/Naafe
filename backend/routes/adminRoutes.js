import express from 'express';
import adminController from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview
 * @access  Private (Admin only)
 * @returns {object} Dashboard statistics and overview
 */
router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboardOverview);

/**
 * @route   GET /api/admin/stats
 * @desc    Get detailed platform statistics
 * @access  Private (Admin only)
 * @query   {string} [period] - Time period (today, week, month, year)
 * @returns {object} Platform statistics
 */
router.get('/stats', authenticateToken, requireAdmin, adminController.getPlatformStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 * @query   {string} [role] - Filter by role (seeker, provider, admin)
 * @query   {string} [status] - Filter by status (active, blocked, pending)
 * @query   {string} [verification] - Filter by verification status
 * @query   {string} [search] - Search by name or email
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated users list
 */
router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get detailed user information
 * @access  Private (Admin only)
 * @param   {string} userId - User ID
 * @returns {object} User details with activity history
 */
router.get('/users/:userId', authenticateToken, requireAdmin, adminController.getUserDetails);

/**
 * @route   PATCH /api/admin/users/:userId
 * @desc    Update user information
 * @access  Private (Admin only)
 * @param   {string} userId - User ID
 * @body    {object} updateData - User update data
 * @returns {object} Updated user information
 */
router.patch('/users/:userId', authenticateToken, requireAdmin, adminController.updateUser);

/**
 * @route   POST /api/admin/users/:userId/block
 * @desc    Block a user
 * @access  Private (Admin only)
 * @param   {string} userId - User ID
 * @body    {string} reason - Block reason
 * @returns {object} Block confirmation
 */
router.post('/users/:userId/block', authenticateToken, requireAdmin, adminController.blockUser);

/**
 * @route   POST /api/admin/users/:userId/unblock
 * @desc    Unblock a user
 * @access  Private (Admin only)
 * @param   {string} userId - User ID
 * @returns {object} Unblock confirmation
 */
router.post('/users/:userId/unblock', authenticateToken, requireAdmin, adminController.unblockUser);

/**
 * @route   GET /api/admin/service-requests
 * @desc    Get all service requests with filtering
 * @access  Private (Admin only)
 * @query   {string} [status] - Filter by status
 * @query   {string} [category] - Filter by category
 * @query   {string} [urgency] - Filter by urgency
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated service requests
 */
router.get('/service-requests', authenticateToken, requireAdmin, adminController.getServiceRequests);

/**
 * @route   GET /api/admin/offers
 * @desc    Get all offers with filtering
 * @access  Private (Admin only)
 * @query   {string} [status] - Filter by status
 * @query   {string} [category] - Filter by category
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated offers
 */
router.get('/offers', authenticateToken, requireAdmin, adminController.getOffers);

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments with filtering
 * @access  Private (Admin only)
 * @query   {string} [status] - Filter by status
 * @query   {string} [paymentMethod] - Filter by payment method
 * @query   {string} [period] - Time period filter
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated payments
 */
router.get('/payments', authenticateToken, requireAdmin, adminController.getPayments);

/**
 * @route   GET /api/admin/reviews
 * @desc    Get all reviews with filtering
 * @access  Private (Admin only)
 * @query   {number} [rating] - Filter by rating
 * @query   {boolean} [isVerified] - Filter by verification status
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated reviews
 */
router.get('/reviews', authenticateToken, requireAdmin, adminController.getReviews);

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all notifications with filtering
 * @access  Private (Admin only)
 * @query   {string} [type] - Filter by notification type
 * @query   {boolean} [isRead] - Filter by read status
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated notifications
 */
router.get('/notifications', authenticateToken, requireAdmin, adminController.getNotifications);

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent platform activity
 * @access  Private (Admin only)
 * @query   {string} [type] - Filter by activity type
 * @query   {number} [limit] - Number of activities to return
 * @returns {object} Recent activity log
 */
router.get('/activity', authenticateToken, requireAdmin, adminController.getRecentActivity);

/**
 * @route   GET /api/admin/charts/user-growth
 * @desc    Get user growth chart data
 * @access  Private (Admin only)
 * @query   {string} [period] - Time period (week, month, year)
 * @returns {object} User growth data
 */
router.get('/charts/user-growth', authenticateToken, requireAdmin, adminController.getUserGrowthData);

/**
 * @route   GET /api/admin/charts/service-categories
 * @desc    Get service categories chart data
 * @access  Private (Admin only)
 * @returns {object} Service categories data
 */
router.get('/charts/service-categories', authenticateToken, requireAdmin, adminController.getServiceCategoriesData);

/**
 * @route   GET /api/admin/charts/revenue
 * @desc    Get revenue chart data
 * @access  Private (Admin only)
 * @query   {string} [period] - Time period (week, month, year)
 * @returns {object} Revenue data
 */
router.get('/charts/revenue', authenticateToken, requireAdmin, adminController.getRevenueData);

/**
 * @route   GET /api/admin/charts/verification-status
 * @desc    Get verification status chart data
 * @access  Private (Admin only)
 * @returns {object} Verification status data
 */
router.get('/charts/verification-status', authenticateToken, requireAdmin, adminController.getVerificationStatusData);

/**
 * @route   POST /api/admin/send-notification
 * @desc    Send notification to users
 * @access  Private (Admin only)
 * @body    {Array} userIds - Array of user IDs
 * @body    {string} title - Notification title
 * @body    {string} message - Notification message
 * @body    {string} [type] - Notification type
 * @returns {object} Notification sending confirmation
 */
router.post('/send-notification', authenticateToken, requireAdmin, adminController.sendNotification);

/**
 * @route   GET /api/admin/reports
 * @desc    Get platform reports
 * @access  Private (Admin only)
 * @query   {string} [type] - Report type (users, services, payments, etc.)
 * @query   {string} [format] - Report format (json, csv)
 * @query   {string} [period] - Time period
 * @returns {object} Platform report data
 */
router.get('/reports', authenticateToken, requireAdmin, adminController.getReports);

export default router; 
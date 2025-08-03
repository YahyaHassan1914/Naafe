import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with filtering and pagination
 * @access  Private
 * @query   {string} [type] - Filter by notification type
 * @query   {boolean} [isRead] - Filter by read status
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated notifications
 */
router.get('/', authenticateToken, notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 * @returns {object} Unread notification count
 */
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/:notificationId
 * @desc    Get a specific notification by ID
 * @access  Private
 * @param   {string} notificationId - Notification ID
 * @returns {object} Notification details
 */
router.get('/:notificationId', authenticateToken, notificationController.getNotificationById);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private
 * @param   {string} notificationId - Notification ID
 * @returns {object} Updated notification
 */
router.patch('/:notificationId/read', authenticateToken, notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/:notificationId/unread
 * @desc    Mark a notification as unread
 * @access  Private
 * @param   {string} notificationId - Notification ID
 * @returns {object} Updated notification
 */
router.patch('/:notificationId/unread', authenticateToken, notificationController.markAsUnread);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 * @returns {object} Update confirmation
 */
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 * @param   {string} notificationId - Notification ID
 * @returns {object} Deletion confirmation
 */
router.delete('/:notificationId', authenticateToken, notificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications/clear-read
 * @desc    Delete all read notifications
 * @access  Private
 * @returns {object} Deletion confirmation
 */
router.delete('/clear-read', authenticateToken, notificationController.clearReadNotifications);

/**
 * @route   POST /api/notifications/settings
 * @desc    Update notification settings
 * @access  Private
 * @body    {object} settings - Notification settings
 * @returns {object} Updated settings
 */
router.post('/settings', authenticateToken, notificationController.updateNotificationSettings);

/**
 * @route   GET /api/notifications/settings
 * @desc    Get user's notification settings
 * @access  Private
 * @returns {object} Notification settings
 */
router.get('/settings', authenticateToken, notificationController.getNotificationSettings);

export default router; 
import express from 'express';
import verificationController from '../controllers/verificationController.js';
import { authenticateToken, requireProvider, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/verification/request
 * @desc    Request provider verification
 * @access  Private (Provider only)
 * @body    {string} category - Service category
 * @body    {string} subcategory - Service subcategory
 * @body    {string} experience - Years of experience
 * @body    {string} skills - Skills description
 * @body    {string} portfolio - Portfolio/work examples
 * @body    {string} references - References/contacts
 * @returns {object} Verification request details
 */
router.post('/request', authenticateToken, requireProvider, verificationController.requestVerification);

/**
 * @route   POST /api/verification/upload
 * @desc    Upload verification documents
 * @access  Private (Provider only)
 * @body    {Array} documents - Array of document URLs
 * @body    {string} documentType - Type of documents (id_card, portfolio, references, etc.)
 * @returns {object} Upload confirmation
 */
router.post('/upload', authenticateToken, requireProvider, verificationController.uploadDocuments);

/**
 * @route   GET /api/verification/status
 * @desc    Get verification status for current user
 * @access  Private
 * @returns {object} Verification status and details
 */
router.get('/status', authenticateToken, verificationController.getVerificationStatus);

/**
 * @route   POST /api/verification/schedule-interview
 * @desc    Schedule verification interview
 * @access  Private (Provider only)
 * @body    {Date} preferredDate - Preferred interview date
 * @body    {string} preferredTime - Preferred time slot
 * @body    {string} notes - Additional notes
 * @returns {object} Interview scheduling confirmation
 */
router.post('/schedule-interview', authenticateToken, requireProvider, verificationController.scheduleInterview);

/**
 * @route   GET /api/verification/all
 * @desc    Get all verification requests (Admin only)
 * @access  Private (Admin only)
 * @query   {string} [status] - Filter by status
 * @query   {string} [category] - Filter by category
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated verification requests
 */
router.get('/all', authenticateToken, requireAdmin, verificationController.getAllVerifications);

/**
 * @route   GET /api/verification/pending
 * @desc    Get pending verification requests (Admin only)
 * @access  Private (Admin only)
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated pending verification requests
 */
router.get('/pending', authenticateToken, requireAdmin, verificationController.getPendingVerifications);

/**
 * @route   POST /api/verification/:userId/approve
 * @desc    Approve provider verification (Admin only)
 * @access  Private (Admin only)
 * @param   {string} userId - User ID to approve
 * @body    {string} [notes] - Approval notes
 * @body    {string} [verificationLevel] - Verification level (basic, skill, approved)
 * @returns {object} Approval confirmation
 */
router.post('/:userId/approve', authenticateToken, requireAdmin, verificationController.approveVerification);

/**
 * @route   POST /api/verification/:userId/reject
 * @desc    Reject provider verification (Admin only)
 * @access  Private (Admin only)
 * @param   {string} userId - User ID to reject
 * @body    {string} reason - Rejection reason
 * @body    {string} [suggestions] - Improvement suggestions
 * @returns {object} Rejection confirmation
 */
router.post('/:userId/reject', authenticateToken, requireAdmin, verificationController.rejectVerification);

/**
 * @route   POST /api/verification/:userId/block
 * @desc    Block user (Admin only)
 * @access  Private (Admin only)
 * @param   {string} userId - User ID to block
 * @body    {string} reason - Block reason
 * @returns {object} Block confirmation
 */
router.post('/:userId/block', authenticateToken, requireAdmin, verificationController.blockUser);

/**
 * @route   POST /api/verification/:userId/unblock
 * @desc    Unblock user (Admin only)
 * @access  Private (Admin only)
 * @param   {string} userId - User ID to unblock
 * @returns {object} Unblock confirmation
 */
router.post('/:userId/unblock', authenticateToken, requireAdmin, verificationController.unblockUser);

/**
 * @route   POST /api/verification/:userId/conduct-interview
 * @desc    Conduct verification interview (Admin only)
 * @access  Private (Admin only)
 * @param   {string} userId - User ID for interview
 * @body    {string} interviewNotes - Interview notes
 * @body    {string} assessment - Skills assessment
 * @body    {string} recommendation - Approval recommendation
 * @returns {object} Interview results
 */
router.post('/:userId/conduct-interview', authenticateToken, requireAdmin, verificationController.conductInterview);

export default router; 
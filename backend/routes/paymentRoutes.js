import express from 'express';
import { 
  handleWebhook, 
  getPaymentDetails, 
  checkPaymentStatus, 
  createPayment,
  updatePaymentStatus,
  requestRefund,
  getMyTransactions,
  getUnifiedTransactions
} from '../controllers/paymentController.js';
import { authenticateToken, requireSeeker, requireProvider, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/payment/create
 * @desc    Create a new payment for a service
 * @access  Private (Seeker only)
 * @body    {string} requestId - Service request ID
 * @body    {string} offerId - Offer ID
 * @body    {number} amount - Payment amount
 * @body    {string} paymentMethod - Payment method (stripe, cod, bank_transfer, etc.)
 * @returns {object} Payment details
 */
router.post('/create', authenticateToken, requireSeeker, createPayment);

/**
 * @route   POST /api/payment/webhook
 * @desc    Handle payment webhooks (Stripe, etc.)
 * @access  Public (no auth required)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

/**
 * @route   GET /api/payment/:paymentId
 * @desc    Get payment details by ID
 * @access  Private (Payment participants only)
 * @param   {string} paymentId - Payment ID
 * @returns {object} Payment details
 */
router.get('/:paymentId', authenticateToken, getPaymentDetails);

/**
 * @route   PATCH /api/payment/:paymentId/status
 * @desc    Update payment status (for manual payments)
 * @access  Private (Admin only)
 * @param   {string} paymentId - Payment ID
 * @body    {string} status - New status
 * @body    {string} [verificationNotes] - Admin notes
 * @returns {object} Updated payment
 */
router.patch('/:paymentId/status', authenticateToken, requireAdmin, updatePaymentStatus);

/**
 * @route   POST /api/payment/:paymentId/refund
 * @desc    Request a refund for a payment
 * @access  Private (Payment participants only)
 * @param   {string} paymentId - Payment ID
 * @body    {string} reason - Refund reason
 * @body    {number} [amount] - Refund amount (default: full amount)
 * @returns {object} Refund request details
 */
router.post('/:paymentId/refund', authenticateToken, requestRefund);

/**
 * @route   GET /api/payment/my-transactions
 * @desc    Get all transactions for the current user
 * @access  Private
 * @query   {string} [status] - Filter by payment status
 * @query   {string} [paymentMethod] - Filter by payment method
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated transactions
 */
router.get('/my-transactions', authenticateToken, getMyTransactions);

/**
 * @route   GET /api/payment/transactions
 * @desc    Get all transactions (Admin only)
 * @access  Private (Admin only)
 * @query   {string} [status] - Filter by payment status
 * @query   {string} [paymentMethod] - Filter by payment method
 * @query   {string} [userId] - Filter by user ID
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated transactions
 */
router.get('/transactions', authenticateToken, requireAdmin, getUnifiedTransactions);

export default router; 
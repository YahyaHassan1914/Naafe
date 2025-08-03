import express from 'express';
import { 
  handleWebhook, 
  getPaymentDetails, 
  checkPaymentStatus, 
  createEscrowPayment,
  releaseFundsFromEscrow,
  requestCancellation,
  getMyTransactions,
  getUnifiedTransactions
} from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
// Removed adService import - feature no longer exists

const router = express.Router();

// Create escrow payment session
router.post('/create-escrow-payment', authenticateToken, requireRole(['seeker']), createEscrowPayment);

// Removed promotion checkout route - feature no longer exists

// Webhook endpoint (no auth required, Stripe handles verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Get payment details by session ID (protected route)
router.get('/details/:sessionId', authenticateToken, getPaymentDetails);

// Check payment status by conversation ID (protected route)
router.get('/check-status/:conversationId', authenticateToken, checkPaymentStatus);

// Release funds from escrow
router.post('/release-funds/:paymentId', authenticateToken, requireRole(['seeker']), releaseFundsFromEscrow);

// Request service cancellation
router.post('/cancel-service/:offerId', authenticateToken, requireRole(['seeker', 'provider']), requestCancellation);

// Get all transactions for the current user
router.get('/my-transactions', authenticateToken, getMyTransactions);

// Unified transactions: service, subscription, refund
router.get('/transactions', authenticateToken, getUnifiedTransactions);

export default router; 
import express from 'express';
import verificationController from '../controllers/verificationController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// User routes (require authentication)
router.post('/request', authenticateToken, verificationController.requestVerification);
router.post('/upload', authenticateToken, verificationController.uploadDocuments);
router.get('/status', authenticateToken, verificationController.getVerificationStatus);

// Admin routes (require admin role)
router.get('/pending', authenticateToken, requireRole(['admin']), verificationController.getPendingVerifications);
router.post('/:userId/approve', authenticateToken, requireRole(['admin']), verificationController.approveVerification);
router.post('/:userId/reject', authenticateToken, requireRole(['admin']), verificationController.rejectVerification);

export default router; 
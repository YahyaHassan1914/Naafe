import express from 'express';
import jobRequestController from '../controllers/jobRequestController.js';
import { 
  validateCreateJobRequest, 
  validateUpdateJobRequest, 
  validateJobRequestId,
  validateJobRequestQuery,
  validateCompleteJobRequest,
  validateOfferId
} from '../validation/jobRequestValidation.js';
import { authenticateToken, requireSeeker, requireProvider, requireAdmin } from '../middlewares/auth.middleware.js';
import { 
  createOfferValidation, 
  handleValidationErrors as offerValidationErrors 
} from '../validation/offerValidation.js';
import offerController from '../controllers/offerController.js';

const router = express.Router();

/**
 * @route   POST /api/requests
 * @desc    Create a new service request
 * @access  Private (Seeker only)
 */
router.post('/', 
  authenticateToken, 
  requireSeeker, 
  validateCreateJobRequest, 
  jobRequestController.createJobRequest
);

/**
 * @route   GET /api/requests
 * @desc    Get all service requests with filtering
 * @access  Public
 */
router.get('/', validateJobRequestQuery, jobRequestController.getAllJobRequests);

/**
 * @route   GET /api/requests/:id
 * @desc    Get service request by ID
 * @access  Public
 */
router.get('/:id', validateJobRequestId, jobRequestController.getJobRequestById);

/**
 * @route   PATCH /api/requests/:id
 * @desc    Update service request
 * @access  Private (Seeker who created it or Admin)
 */
router.patch('/:id', 
  authenticateToken, 
  validateJobRequestId, 
  validateUpdateJobRequest, 
  jobRequestController.updateJobRequest
);

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete service request
 * @access  Private (Seeker who created it or Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  validateJobRequestId, 
  jobRequestController.deleteJobRequest
);

/**
 * @route   POST /api/requests/:id/offers
 * @desc    Create an offer for a specific service request
 * @access  Private (Providers only)
 * @param   {string} id - ID of the service request
 * @body    {object} price - Price object with amount and currency
 * @body    {string} [message] - Optional message from provider
 * @body    {number} [estimatedTimeDays] - Estimated completion time in days
 * @returns {object} Created offer with populated provider and service request details
 */
router.post('/:id/offers', 
  authenticateToken, 
  requireProvider, 
  validateJobRequestId,
  createOfferValidation,
  offerValidationErrors,
  offerController.createOffer
);

/**
 * @route   GET /api/requests/:id/offers
 * @desc    Get all offers for a specific service request
 * @access  Private (Service request owner or Admin)
 * @param   {string} id - ID of the service request
 * @query   {string} [status] - Filter by offer status
 * @returns {object} Array of offers with populated provider details
 */
router.get('/:id/offers', 
  authenticateToken, 
  validateJobRequestId,
  jobRequestController.getOffersForJobRequest
);

/**
 * @route   GET /api/requests/:id/recommendations
 * @desc    Get provider recommendations for a service request
 * @access  Private (Service request owner)
 * @param   {string} id - ID of the service request
 * @returns {object} Array of recommended providers
 */
router.get('/:id/recommendations', 
  authenticateToken, 
  validateJobRequestId,
  jobRequestController.getProviderRecommendations
);

/**
 * @route   POST /api/requests/:id/complete
 * @desc    Mark service request as completed
 * @access  Private (Service request owner or assigned provider)
 * @param   {string} id - ID of the service request
 * @body    {object} completionProof - Proof of completion
 * @returns {object} Updated service request
 */
router.post('/:id/complete', 
  authenticateToken, 
  validateJobRequestId,
  validateCompleteJobRequest,
  jobRequestController.completeJobRequest
);

/**
 * @route   POST /api/requests/:id/cancel
 * @desc    Cancel a service request
 * @access  Private (Service request owner or assigned provider)
 * @param   {string} id - ID of the service request
 * @body    {string} reason - Reason for cancellation
 * @returns {object} Cancellation details
 */
router.post('/:id/cancel', 
  authenticateToken, 
  validateJobRequestId,
  jobRequestController.cancelJobRequest
);

export default router; 
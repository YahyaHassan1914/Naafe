import express from 'express';
const router = express.Router();
import offerController from '../controllers/offerController.js';
import { authenticateToken, requireSeeker, requireProvider, requireVerified } from '../middlewares/auth.middleware.js';
import { 
  updateOfferValidation, 
  offerIdValidation, 
  handleValidationErrors 
} from '../validation/offerValidation.js';

/**
 * @route   GET /api/offers
 * @desc    Retrieve all offers (with filtering)
 * @access  Private (Providers can see their own offers, Seekers can see offers on their requests)
 * @query   {string} [status] - Filter by offer status (pending, accepted, rejected, withdrawn)
 * @query   {string} [requestId] - Filter by service request ID
 * @query   {string} [providerId] - Filter by provider ID
 * @returns {object} Array of offers with populated details
 */
router.get('/', 
  authenticateToken, 
  offerController.getAllOffers
);

/**
 * @route   GET /api/offers/:offerId
 * @desc    Get a specific offer by ID
 * @access  Private (Offer owner, service request owner, or admin)
 * @param   {string} offerId - ID of the offer
 * @returns {object} Offer details with populated provider and service request information
 */
router.get('/:offerId', 
  authenticateToken, 
  offerIdValidation,
  handleValidationErrors,
  offerController.getOfferById
);

/**
 * @route   POST /api/offers
 * @desc    Create a new offer for a service request
 * @access  Private (Verified providers only)
 * @body    {string} requestId - Service request ID
 * @body    {number} price - Offer price
 * @body    {string} timeline - Estimated timeline
 * @body    {string} scopeOfWork - Detailed scope of work
 * @body    {boolean} materialsIncluded - Whether materials are included
 * @body    {string} warranty - Warranty information
 * @body    {string} paymentSchedule - Payment schedule details
 * @returns {object} Created offer with populated details
 */
router.post('/', 
  authenticateToken, 
  requireProvider,
  requireVerified,
  offerController.createOffer
);

/**
 * @route   PATCH /api/offers/:offerId
 * @desc    Update an offer (only pending offers can be updated)
 * @access  Private (Offer owner only)
 * @param   {string} offerId - ID of the offer to update
 * @body    {number} [price] - Updated price
 * @body    {string} [timeline] - Updated timeline
 * @body    {string} [scopeOfWork] - Updated scope of work
 * @body    {boolean} [materialsIncluded] - Updated materials inclusion
 * @body    {string} [warranty] - Updated warranty information
 * @body    {string} [paymentSchedule] - Updated payment schedule
 * @returns {object} Updated offer with populated details
 */
router.patch('/:offerId', 
  authenticateToken, 
  requireProvider, 
  offerIdValidation,
  updateOfferValidation,
  handleValidationErrors,
  offerController.updateOffer
);

/**
 * @route   POST /api/offers/:offerId/accept
 * @desc    Accept an offer (only service request owner can accept)
 * @access  Private (Service request owner only)
 * @param   {string} offerId - ID of the offer to accept
 * @returns {object} Accepted offer with updated status
 */
router.post('/:offerId/accept', 
  authenticateToken, 
  requireSeeker,
  offerIdValidation,
  handleValidationErrors,
  offerController.acceptOffer
);

/**
 * @route   POST /api/offers/:offerId/reject
 * @desc    Reject an offer (only service request owner can reject)
 * @access  Private (Service request owner only)
 * @param   {string} offerId - ID of the offer to reject
 * @returns {object} Rejected offer with updated status
 */
router.post('/:offerId/reject', 
  authenticateToken, 
  requireSeeker,
  offerIdValidation,
  handleValidationErrors,
  offerController.rejectOffer
);

/**
 * @route   DELETE /api/offers/:offerId
 * @desc    Delete/withdraw an offer (only pending offers can be deleted)
 * @access  Private (Offer owner only)
 * @param   {string} offerId - ID of the offer to delete
 * @returns {object} Success message confirming offer deletion
 */
router.delete('/:offerId', 
  authenticateToken, 
  requireProvider, 
  offerIdValidation,
  handleValidationErrors,
  offerController.deleteOffer
);

/**
 * @route   POST /api/offers/:offerId/negotiate
 * @desc    Start negotiation on an offer
 * @access  Private (Service request owner or offer owner)
 * @param   {string} offerId - ID of the offer
 * @body    {string} message - Negotiation message
 * @body    {number} [counterPrice] - Counter offer price
 * @returns {object} Updated offer with negotiation details
 */
router.post('/:offerId/negotiate', 
  authenticateToken, 
  offerIdValidation,
  handleValidationErrors,
  offerController.negotiateOffer
);

/**
 * @route   GET /api/offers/:offerId/negotiation-history
 * @desc    Get negotiation history for an offer
 * @access  Private (Offer participants only)
 * @param   {string} offerId - ID of the offer
 * @returns {object} Array of negotiation messages
 */
router.get('/:offerId/negotiation-history', 
  authenticateToken, 
  offerIdValidation,
  handleValidationErrors,
  offerController.getNegotiationHistory
);

export default router; 
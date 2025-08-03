import express from 'express';
import reviewController from '../controllers/reviewController.js';
import { authenticateToken, requireSeeker, requireProvider, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (Seeker only - can only review providers)
 * @body    {string} requestId - Service request ID
 * @body    {string} providerId - Provider ID being reviewed
 * @body    {number} rating - Rating (1-5)
 * @body    {string} review - Review text
 * @body    {Array} [photos] - Review photos URLs
 * @returns {object} Created review
 */
router.post('/', authenticateToken, requireSeeker, reviewController.createReview);

/**
 * @route   GET /api/reviews/request/:requestId
 * @desc    Get reviews for a specific service request
 * @access  Public
 * @param   {string} requestId - Service request ID
 * @returns {object} Reviews for the request
 */
router.get('/request/:requestId', reviewController.getRequestReviews);

/**
 * @route   GET /api/reviews/provider/:providerId
 * @desc    Get all reviews for a provider
 * @access  Public
 * @param   {string} providerId - Provider ID
 * @query   {number} [rating] - Filter by rating
 * @query   {boolean} [isVerified] - Filter by verification status
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated provider reviews
 */
router.get('/provider/:providerId', reviewController.getProviderReviews);

/**
 * @route   GET /api/reviews/seeker/:seekerId
 * @desc    Get all reviews by a seeker
 * @access  Private (Seeker can see their own reviews)
 * @param   {string} seekerId - Seeker ID
 * @query   {number} [page] - Page number
 * @query   {number} [limit] - Items per page
 * @returns {object} Paginated seeker reviews
 */
router.get('/seeker/:seekerId', authenticateToken, reviewController.getSeekerReviews);

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get a specific review by ID
 * @access  Public
 * @param   {string} reviewId - Review ID
 * @returns {object} Review details
 */
router.get('/:reviewId', reviewController.getReviewById);

/**
 * @route   PATCH /api/reviews/:reviewId
 * @desc    Update a review (only by the reviewer)
 * @access  Private (Review owner only)
 * @param   {string} reviewId - Review ID
 * @body    {number} [rating] - Updated rating
 * @body    {string} [review] - Updated review text
 * @body    {Array} [photos] - Updated photos
 * @returns {object} Updated review
 */
router.patch('/:reviewId', authenticateToken, reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review (only by the reviewer or admin)
 * @access  Private (Review owner or admin only)
 * @param   {string} reviewId - Review ID
 * @returns {object} Deletion confirmation
 */
router.delete('/:reviewId', authenticateToken, reviewController.deleteReview);

/**
 * @route   POST /api/reviews/:reviewId/helpful
 * @desc    Mark a review as helpful
 * @access  Private
 * @param   {string} reviewId - Review ID
 * @returns {object} Helpful count update
 */
router.post('/:reviewId/helpful', authenticateToken, reviewController.markHelpful);

/**
 * @route   POST /api/reviews/:reviewId/report
 * @desc    Report a review
 * @access  Private
 * @param   {string} reviewId - Review ID
 * @body    {string} reason - Report reason
 * @returns {object} Report confirmation
 */
router.post('/:reviewId/report', authenticateToken, reviewController.reportReview);

/**
 * @route   GET /api/reviews/stats/provider/:providerId
 * @desc    Get review statistics for a provider
 * @access  Public
 * @param   {string} providerId - Provider ID
 * @returns {object} Review statistics
 */
router.get('/stats/provider/:providerId', reviewController.getProviderReviewStats);

/**
 * @route   GET /api/reviews/recent
 * @desc    Get recent reviews across the platform
 * @access  Public
 * @query   {number} [limit] - Number of reviews to return
 * @returns {object} Recent reviews
 */
router.get('/recent', reviewController.getRecentReviews);

/**
 * @route   GET /api/reviews/top-rated
 * @desc    Get top-rated providers
 * @access  Public
 * @query   {string} [category] - Filter by category
 * @query   {number} [limit] - Number of providers to return
 * @returns {object} Top-rated providers
 */
router.get('/top-rated', reviewController.getTopRatedProviders);

export default router; 
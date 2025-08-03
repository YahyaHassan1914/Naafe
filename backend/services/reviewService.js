import Review from '../models/Review.js';
import User from '../models/User.js';
import ServiceRequest from '../models/JobRequest.js';
import Payment from '../models/Payment.js';
import { logger } from '../middlewares/logging.middleware.js';

class ReviewService {
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @param {string} seekerId - Seeker ID creating the review
   * @returns {Object} Created review
   */
  async createReview(reviewData, seekerId) {
    try {
      logger.info(`Seeker ${seekerId} creating review for provider ${reviewData.providerId}`);

      // Validate that the seeker exists and is a seeker
      const seeker = await User.findById(seekerId);
      if (!seeker || seeker.role !== 'seeker') {
        throw new Error('Only seekers can create reviews');
      }

      // Validate that the provider exists and is verified
      const provider = await User.findById(reviewData.providerId);
      if (!provider || provider.role !== 'provider') {
        throw new Error('Provider not found');
      }

      if (provider.verificationStatus !== 'approved') {
        throw new Error('Can only review verified providers');
      }

      // Validate that the service request exists and belongs to the seeker
      const serviceRequest = await ServiceRequest.findById(reviewData.requestId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      if (serviceRequest.seekerId.toString() !== seekerId.toString()) {
        throw new Error('Can only review your own service requests');
      }

      // Check if service is completed (payment completed)
      const payment = await Payment.findOne({ 
        requestId: reviewData.requestId,
        status: 'completed'
      });

      if (!payment) {
        throw new Error('Can only review completed services');
      }

      // Check if review already exists for this request
      const existingReview = await Review.findOne({ requestId: reviewData.requestId });
      if (existingReview) {
        throw new Error('Review already exists for this service request');
      }

      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Create the review
      const review = new Review({
        requestId: reviewData.requestId,
        seekerId: seekerId,
        providerId: reviewData.providerId,
        rating: reviewData.rating,
        review: reviewData.review,
        photos: reviewData.photos || [],
        isVerified: true, // Reviews from completed payments are verified
        helpfulCount: 0,
        reportReason: null
      });

      await review.save();
      logger.info(`Review created successfully: ${review._id}`);

      // Update provider's rating statistics
      await this.updateProviderRatingStats(reviewData.providerId);

      // Populate review with user information
      await review.populate([
        { path: 'seekerId', select: 'name avatarUrl' },
        { path: 'providerId', select: 'name avatarUrl' },
        { path: 'requestId', select: 'category subcategory description' }
      ]);

      return review;
    } catch (error) {
      logger.error(`Error creating review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews for a specific service request
   * @param {string} requestId - Service request ID
   * @returns {Object} Reviews for the request
   */
  async getRequestReviews(requestId) {
    try {
      const reviews = await Review.find({ requestId })
        .populate('seekerId', 'name avatarUrl')
        .populate('providerId', 'name avatarUrl')
        .sort({ createdAt: -1 });

      return {
        reviews,
        count: reviews.length
      };
    } catch (error) {
      logger.error(`Error getting request reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all reviews for a provider
   * @param {string} providerId - Provider ID
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated provider reviews
   */
  async getProviderReviews(providerId, filters = {}) {
    try {
      const {
        rating,
        isVerified,
        page = 1,
        limit = 20
      } = filters;

      let query = { providerId };

      // Apply filters
      if (rating) {
        query.rating = parseInt(rating);
      }

      if (isVerified !== undefined) {
        query.isVerified = isVerified;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('seekerId', 'name avatarUrl')
          .populate('requestId', 'category subcategory description')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments(query)
      ]);

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting provider reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all reviews by a seeker
   * @param {string} seekerId - Seeker ID
   * @param {Object} pagination - Pagination options
   * @returns {Object} Paginated seeker reviews
   */
  async getSeekerReviews(seekerId, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [reviews, total] = await Promise.all([
        Review.find({ seekerId })
          .populate('providerId', 'name avatarUrl')
          .populate('requestId', 'category subcategory description')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments({ seekerId })
      ]);

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting seeker reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific review by ID
   * @param {string} reviewId - Review ID
   * @returns {Object} Review details
   */
  async getReviewById(reviewId) {
    try {
      const review = await Review.findById(reviewId)
        .populate('seekerId', 'name avatarUrl')
        .populate('providerId', 'name avatarUrl')
        .populate('requestId', 'category subcategory description');

      if (!review) {
        throw new Error('Review not found');
      }

      return review;
    } catch (error) {
      logger.error(`Error getting review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Updated review
   */
  async updateReview(reviewId, updateData, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check authorization (only reviewer can update)
      if (review.seekerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized to update this review');
      }

      // Validate rating if provided
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Update allowed fields
      const allowedUpdates = ['rating', 'review', 'photos'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        updates,
        { new: true, runValidators: true }
      ).populate([
        { path: 'seekerId', select: 'name avatarUrl' },
        { path: 'providerId', select: 'name avatarUrl' },
        { path: 'requestId', select: 'category subcategory description' }
      ]);

      // Update provider's rating statistics if rating changed
      if (updateData.rating) {
        await this.updateProviderRatingStats(review.providerId.toString());
      }

      logger.info(`Review updated: ${reviewId}`);
      return updatedReview;
    } catch (error) {
      logger.error(`Error updating review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Deletion confirmation
   */
  async deleteReview(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check authorization (reviewer or admin can delete)
      const user = await User.findById(userId);
      const isReviewer = review.seekerId.toString() === userId.toString();
      const isAdmin = user && user.role === 'admin';

      if (!isReviewer && !isAdmin) {
        throw new Error('Unauthorized to delete this review');
      }

      await Review.findByIdAndDelete(reviewId);

      // Update provider's rating statistics
      await this.updateProviderRatingStats(review.providerId.toString());

      logger.info(`Review deleted: ${reviewId}`);
      return { message: 'Review deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark a review as helpful
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Object} Helpful count update
   */
  async markHelpful(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if user already marked this review as helpful
      if (review.helpfulUsers && review.helpfulUsers.includes(userId)) {
        // Remove helpful vote
        review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId);
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      } else {
        // Add helpful vote
        if (!review.helpfulUsers) {
          review.helpfulUsers = [];
        }
        review.helpfulUsers.push(userId);
        review.helpfulCount += 1;
      }

      await review.save();
      logger.info(`Review helpful count updated: ${reviewId}`);

      return {
        helpfulCount: review.helpfulCount,
        isHelpful: review.helpfulUsers.includes(userId)
      };
    } catch (error) {
      logger.error(`Error marking review helpful: ${error.message}`);
      throw error;
    }
  }

  /**
   * Report a review
   * @param {string} reviewId - Review ID
   * @param {Object} reportData - Report data
   * @param {string} userId - User ID
   * @returns {Object} Report confirmation
   */
  async reportReview(reviewId, reportData, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if user already reported this review
      if (review.reportedBy && review.reportedBy.includes(userId)) {
        throw new Error('You have already reported this review');
      }

      // Add report
      if (!review.reportedBy) {
        review.reportedBy = [];
      }
      review.reportedBy.push(userId);
      review.reportReason = reportData.reason;

      await review.save();
      logger.info(`Review reported: ${reviewId} by user: ${userId}`);

      return { message: 'Review reported successfully' };
    } catch (error) {
      logger.error(`Error reporting review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get review statistics for a provider
   * @param {string} providerId - Provider ID
   * @returns {Object} Review statistics
   */
  async getProviderReviewStats(providerId) {
    try {
      const reviews = await Review.find({ providerId });

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedReviews: 0,
          recentReviews: 0
        };
      }

      // Calculate statistics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      const verifiedReviews = reviews.filter(review => review.isVerified).length;

      // Recent reviews (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReviews = reviews.filter(review => review.createdAt >= thirtyDaysAgo).length;

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        verifiedReviews,
        recentReviews
      };
    } catch (error) {
      logger.error(`Error getting provider review stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent reviews across the platform
   * @param {Object} filters - Filter options
   * @returns {Object} Recent reviews
   */
  async getRecentReviews(filters = {}) {
    try {
      const { limit = 10 } = filters;

      const reviews = await Review.find()
        .populate('seekerId', 'name avatarUrl')
        .populate('providerId', 'name avatarUrl')
        .populate('requestId', 'category subcategory description')
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        reviews,
        count: reviews.length
      };
    } catch (error) {
      logger.error(`Error getting recent reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get top-rated providers
   * @param {Object} filters - Filter options
   * @returns {Object} Top-rated providers
   */
  async getTopRatedProviders(filters = {}) {
    try {
      const { category, limit = 10 } = filters;

      // Aggregate to get average ratings
      let matchStage = {};
      if (category) {
        // Match reviews for services in the specified category
        const serviceRequests = await ServiceRequest.find({ category }).select('_id');
        const requestIds = serviceRequests.map(req => req._id);
        matchStage.requestId = { $in: requestIds };
      }

      const topProviders = await Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$providerId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            verifiedReviews: {
              $sum: { $cond: ['$isVerified', 1, 0] }
            }
          }
        },
        {
          $match: {
            totalReviews: { $gte: 3 } // Minimum 3 reviews to be considered
          }
        },
        {
          $sort: { averageRating: -1, totalReviews: -1 }
        },
        { $limit: limit }
      ]);

      // Populate provider information
      const providerIds = topProviders.map(item => item._id);
      const providers = await User.find({ _id: { $in: providerIds } })
        .select('name avatarUrl verificationStatus providerProfile');

      // Combine data
      const result = topProviders.map(item => {
        const provider = providers.find(p => p._id.toString() === item._id.toString());
        return {
          provider: provider || null,
          averageRating: Math.round(item.averageRating * 10) / 10,
          totalReviews: item.totalReviews,
          verifiedReviews: item.verifiedReviews
        };
      });

      return {
        providers: result,
        count: result.length
      };
    } catch (error) {
      logger.error(`Error getting top-rated providers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update provider's rating statistics
   * @param {string} providerId - Provider ID
   */
  async updateProviderRatingStats(providerId) {
    try {
      const reviews = await Review.find({ providerId });
      
      if (reviews.length === 0) {
        await User.findByIdAndUpdate(providerId, {
          'providerProfile.rating': 0,
          'providerProfile.totalReviews': 0
        });
        return;
      }

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      const verifiedReviews = reviews.filter(review => review.isVerified).length;

      await User.findByIdAndUpdate(providerId, {
        'providerProfile.rating': Math.round(averageRating * 10) / 10,
        'providerProfile.totalReviews': reviews.length,
        'providerProfile.verifiedReviews': verifiedReviews
      });

      logger.info(`Provider rating stats updated: ${providerId}`);
    } catch (error) {
      logger.error(`Error updating provider rating stats: ${error.message}`);
    }
  }
}

export default new ReviewService(); 
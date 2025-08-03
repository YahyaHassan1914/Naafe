import { api, ApiResponse, PaginatedResponse } from './api';

// Types for review data
export interface Review {
  _id: string;
  requestId: string;
  seekerId: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    avatarUrl?: string;
  };
  providerId: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    avatarUrl?: string;
  };
  rating: number;
  review: string;
  photos?: string[];
  isVerified: boolean;
  helpfulCount: number;
  reportReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  requestId: string;
  providerId: string;
  rating: number;
  review: string;
  photos?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  review?: string;
  photos?: string[];
}

export interface ReviewFilters {
  rating?: number;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
  verifiedReviews: number;
  recentReviews: Review[];
}

export interface TopRatedProvider {
  _id: string;
  name: {
    first: string;
    last: string;
  };
  avatarUrl?: string;
  averageRating: number;
  totalReviews: number;
  verifiedReviews: number;
}

// Review service functions
export const reviewService = {
  /**
   * Create a new review
   */
  async createReview(data: CreateReviewRequest): Promise<ApiResponse<Review>> {
    return api.reviews.create(data);
  },

  /**
   * Get reviews for a specific service request
   */
  async getRequestReviews(requestId: string): Promise<ApiResponse<Review[]>> {
    return api.reviews.getRequestReviews(requestId);
  },

  /**
   * Get all reviews for a provider
   */
  async getProviderReviews(
    providerId: string, 
    filters?: ReviewFilters
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    return api.reviews.getProviderReviews(providerId, filters);
  },

  /**
   * Get all reviews by a seeker
   */
  async getSeekerReviews(
    seekerId: string, 
    filters?: ReviewFilters
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    return api.reviews.getSeekerReviews(seekerId, filters);
  },

  /**
   * Get a specific review by ID
   */
  async getReviewById(reviewId: string): Promise<ApiResponse<Review>> {
    return api.reviews.getById(reviewId);
  },

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string, 
    data: UpdateReviewRequest
  ): Promise<ApiResponse<Review>> {
    return api.reviews.update(reviewId, data);
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<ApiResponse<void>> {
    return api.reviews.delete(reviewId);
  },

  /**
   * Mark a review as helpful
   */
  async markHelpful(reviewId: string): Promise<ApiResponse<{ helpfulCount: number }>> {
    return api.reviews.markHelpful(reviewId);
  },

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reason: string): Promise<ApiResponse<void>> {
    return api.reviews.report(reviewId, { reason });
  },

  /**
   * Get review statistics for a provider
   */
  async getProviderReviewStats(providerId: string): Promise<ApiResponse<ReviewStats>> {
    return api.reviews.getProviderStats(providerId);
  },

  /**
   * Get recent reviews across the platform
   */
  async getRecentReviews(limit?: number): Promise<ApiResponse<Review[]>> {
    return api.reviews.getRecent({ limit });
  },

  /**
   * Get top-rated providers
   */
  async getTopRatedProviders(
    category?: string, 
    limit?: number
  ): Promise<ApiResponse<TopRatedProvider[]>> {
    return api.reviews.getTopRated({ category, limit });
  },
};

// Legacy functions for backward compatibility
export const createReview = async (
  data: CreateReviewRequest
): Promise<ApiResponse<Review>> => {
  return reviewService.createReview(data);
};

export const getUserReviews = async (
  userId: string,
  role?: 'provider' | 'seeker',
  filters?: ReviewFilters
): Promise<ApiResponse<PaginatedResponse<Review>>> => {
  if (role === 'provider') {
    return reviewService.getProviderReviews(userId, filters);
  } else if (role === 'seeker') {
    return reviewService.getSeekerReviews(userId, filters);
  } else {
    // Default to provider reviews if no role specified
    return reviewService.getProviderReviews(userId, filters);
  }
};

export default reviewService; 
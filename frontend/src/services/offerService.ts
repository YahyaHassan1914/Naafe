import { api, ApiResponse, PaginatedResponse } from './api';

// Types for offer data
export interface Offer {
  _id: string;
  requestId: {
    _id: string;
    category: string;
    subcategory: string;
    description: string;
    urgency: string;
    location: {
      governorate: string;
      city: string;
    };
    seekerId: {
      _id: string;
      name: {
        first: string;
        last: string;
      };
    };
  };
  providerId: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    email: string;
    avatarUrl?: string;
    providerProfile?: {
      rating: number;
      totalJobsCompleted: number;
    };
  };
  price: number;
  timeline: {
    startDate: string;
    duration: string;
  };
  scopeOfWork: string;
  materialsIncluded: string[];
  warranty: string;
  paymentSchedule: {
    deposit: number;
    milestone: number;
    final: number;
  };
  status: 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  negotiations: Array<{
    userId: {
      _id: string;
      name: {
        first: string;
        last: string;
      };
    };
    message: string;
    counterPrice?: number;
    timestamp: string;
  }>;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferData {
  requestId: string;
  price: number;
  timeline: {
    startDate: string;
    duration: string;
  };
  scopeOfWork: string;
  materialsIncluded?: string[];
  warranty?: string;
  paymentSchedule?: {
    deposit: number;
    milestone: number;
    final: number;
  };
}

export interface UpdateOfferData {
  price?: number;
  timeline?: {
    startDate: string;
    duration: string;
  };
  scopeOfWork?: string;
  materialsIncluded?: string[];
  warranty?: string;
  paymentSchedule?: {
    deposit: number;
    milestone: number;
    final: number;
  };
}

export interface NegotiationData {
  message: string;
  counterPrice?: number;
}

export interface OfferFilters {
  requestId?: string;
  providerId?: string;
  status?: Offer['status'];
  page?: number;
  limit?: number;
}

// Offer service functions
export const offerService = {
  /**
   * Create a new offer
   */
  async createOffer(data: CreateOfferData): Promise<ApiResponse<Offer>> {
    return api.offers.create(data);
  },

  /**
   * Get all offers with filtering and pagination
   */
  async getAllOffers(filters?: OfferFilters): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    return api.offers.getAll(filters);
  },

  /**
   * Get offer by ID
   */
  async getOfferById(offerId: string): Promise<ApiResponse<Offer>> {
    return api.offers.getById(offerId);
  },

  /**
   * Update offer
   */
  async updateOffer(offerId: string, data: UpdateOfferData): Promise<ApiResponse<Offer>> {
    return api.offers.update(offerId, data);
  },

  /**
   * Delete offer
   */
  async deleteOffer(offerId: string): Promise<ApiResponse<void>> {
    return api.offers.delete(offerId);
  },

  /**
   * Accept offer
   */
  async acceptOffer(offerId: string): Promise<ApiResponse<Offer>> {
    return api.offers.accept(offerId);
  },

  /**
   * Reject offer
   */
  async rejectOffer(offerId: string): Promise<ApiResponse<Offer>> {
    return api.offers.reject(offerId);
  },

  /**
   * Negotiate on offer
   */
  async negotiateOffer(offerId: string, data: NegotiationData): Promise<ApiResponse<Offer>> {
    return api.offers.negotiate(offerId, data);
  },

  /**
   * Get negotiation history
   */
  async getNegotiationHistory(offerId: string): Promise<ApiResponse<Offer['negotiations']>> {
    return api.offers.getNegotiationHistory(offerId);
  },

  /**
   * Get status display name
   */
  getStatusName(status: Offer['status']): string {
    const statusNames: Record<Offer['status'], string> = {
      pending: 'في الانتظار',
      negotiating: 'قيد التفاوض',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      expired: 'منتهي الصلاحية'
    };
    return statusNames[status] || status;
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status: Offer['status']): string {
    const statusColors: Record<Offer['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      negotiating: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Check if offer is expired
   */
  isExpired(offer: Offer): boolean {
    return new Date(offer.expiresAt) < new Date();
  },

  /**
   * Get time until expiration
   */
  getTimeUntilExpiration(offer: Offer): {
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const expiration = new Date(offer.expiresAt);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) {
      return {
        hours: 0,
        minutes: 0,
        isExpired: true
      };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours,
      minutes,
      isExpired: false
    };
  },

  /**
   * Format expiration time for display
   */
  formatExpirationTime(offer: Offer): string {
    const timeUntil = this.getTimeUntilExpiration(offer);
    
    if (timeUntil.isExpired) {
      return 'منتهي الصلاحية';
    }
    
    if (timeUntil.hours > 0) {
      return `${timeUntil.hours} ساعة و ${timeUntil.minutes} دقيقة متبقية`;
    } else {
      return `${timeUntil.minutes} دقيقة متبقية`;
    }
  },

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price);
  },

  /**
   * Calculate total payment schedule
   */
  calculateTotalPayment(paymentSchedule: Offer['paymentSchedule']): number {
    return paymentSchedule.deposit + paymentSchedule.milestone + paymentSchedule.final;
  },

  /**
   * Check if payment schedule is valid
   */
  isPaymentScheduleValid(paymentSchedule: Offer['paymentSchedule'], totalPrice: number): boolean {
    const total = this.calculateTotalPayment(paymentSchedule);
    return total <= totalPrice;
  },

  /**
   * Check if user can edit offer
   */
  canEdit(offer: Offer, userId: string): boolean {
    return offer.providerId._id === userId && offer.status === 'pending';
  },

  /**
   * Check if user can delete offer
   */
  canDelete(offer: Offer, userId: string): boolean {
    return offer.providerId._id === userId && offer.status === 'pending';
  },

  /**
   * Check if user can accept offer
   */
  canAccept(offer: Offer, userId: string): boolean {
    return offer.requestId.seekerId._id === userId && offer.status === 'pending';
  },

  /**
   * Check if user can reject offer
   */
  canReject(offer: Offer, userId: string): boolean {
    return offer.requestId.seekerId._id === userId && offer.status === 'pending';
  },

  /**
   * Check if user can negotiate on offer
   */
  canNegotiate(offer: Offer, userId: string): boolean {
    const isProvider = offer.providerId._id === userId;
    const isSeeker = offer.requestId.seekerId._id === userId;
    return (isProvider || isSeeker) && offer.status === 'pending';
  },

  /**
   * Get offer statistics for a provider
   */
  async getOfferStats(providerId: string): Promise<{
    total: number;
    pending: number;
    negotiating: number;
    accepted: number;
    rejected: number;
    expired: number;
    totalEarnings: number;
  }> {
    try {
      const response = await this.getAllOffers({ providerId, limit: 1000 });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch offer data');
      }

      const offers = response.data.data;
      
      const stats = {
        total: offers.length,
        pending: offers.filter(o => o.status === 'pending').length,
        negotiating: offers.filter(o => o.status === 'negotiating').length,
        accepted: offers.filter(o => o.status === 'accepted').length,
        rejected: offers.filter(o => o.status === 'rejected').length,
        expired: offers.filter(o => o.status === 'expired').length,
        totalEarnings: offers
          .filter(o => o.status === 'accepted')
          .reduce((sum, o) => sum + o.price, 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting offer stats:', error);
      return {
        total: 0,
        pending: 0,
        negotiating: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        totalEarnings: 0
      };
    }
  },

  /**
   * Get offer statistics for a seeker
   */
  async getSeekerOfferStats(seekerId: string): Promise<{
    total: number;
    pending: number;
    negotiating: number;
    accepted: number;
    rejected: number;
    expired: number;
    totalSpent: number;
  }> {
    try {
      // Get all service requests for the seeker
      const { default: serviceRequestService } = await import('./serviceRequestService');
      const requestsResponse = await serviceRequestService.getMyServiceRequests({ limit: 1000 });
      
      if (!requestsResponse.success || !requestsResponse.data) {
        throw new Error('Failed to fetch service request data');
      }

      const requests = requestsResponse.data.data;
      const requestIds = requests.map(r => r._id);
      
      // Get all offers for these requests
      const offers: Offer[] = [];
      for (const requestId of requestIds) {
        const offersResponse = await this.getAllOffers({ requestId, limit: 1000 });
        if (offersResponse.success && offersResponse.data) {
          offers.push(...offersResponse.data.data);
        }
      }
      
      const stats = {
        total: offers.length,
        pending: offers.filter(o => o.status === 'pending').length,
        negotiating: offers.filter(o => o.status === 'negotiating').length,
        accepted: offers.filter(o => o.status === 'accepted').length,
        rejected: offers.filter(o => o.status === 'rejected').length,
        expired: offers.filter(o => o.status === 'expired').length,
        totalSpent: offers
          .filter(o => o.status === 'accepted')
          .reduce((sum, o) => sum + o.price, 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting seeker offer stats:', error);
      return {
        total: 0,
        pending: 0,
        negotiating: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        totalSpent: 0
      };
    }
  },
};

export default offerService; 
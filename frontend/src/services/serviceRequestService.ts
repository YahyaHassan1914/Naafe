import { api, ApiResponse, PaginatedResponse } from './api';

// Types for service request data
export interface ServiceRequest {
  _id: string;
  seekerId: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    avatarUrl?: string;
    createdAt: string;
  };
  category: string;
  subcategory: string;
  description: string;
  urgency: 'flexible' | 'urgent' | 'very_urgent';
  location: {
    governorate: string;
    city: string;
  };
  images: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
  answers: Array<{
    question: string;
    answer: string;
  }>;
  status: 'open' | 'negotiating' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    avatarUrl?: string;
    providerProfile?: {
      rating: number;
      totalJobsCompleted: number;
    };
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestData {
  category: string;
  subcategory: string;
  description: string;
  urgency?: 'flexible' | 'urgent' | 'very_urgent';
  location: {
    governorate: string;
    city: string;
  };
  images?: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
  answers?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface UpdateServiceRequestData {
  description?: string;
  urgency?: 'flexible' | 'urgent' | 'very_urgent';
  images?: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
  answers?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ServiceRequestFilters {
  category?: string;
  subcategory?: string;
  status?: ServiceRequest['status'];
  urgency?: ServiceRequest['urgency'];
  governorate?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
  includeAll?: boolean;
}

export interface ProviderRecommendation {
  _id: string;
  name: {
    first: string;
    last: string;
  };
  email: string;
  avatarUrl?: string;
  providerProfile: {
    skills: Array<{
      category: string;
      subcategory: string;
    }>;
    rating: number;
    totalJobsCompleted: number;
  };
}

// Service request service functions
export const serviceRequestService = {
  /**
   * Create a new service request
   */
  async createServiceRequest(data: CreateServiceRequestData): Promise<ApiResponse<ServiceRequest>> {
    return api.serviceRequests.create(data);
  },

  /**
   * Get all service requests with filtering and pagination
   */
  async getAllServiceRequests(
    filters?: ServiceRequestFilters
  ): Promise<ApiResponse<PaginatedResponse<ServiceRequest>>> {
    return api.serviceRequests.getAll(filters);
  },

  /**
   * Get service request by ID
   */
  async getServiceRequestById(requestId: string): Promise<ApiResponse<ServiceRequest>> {
    return api.serviceRequests.getById(requestId);
  },

  /**
   * Update service request
   */
  async updateServiceRequest(
    requestId: string, 
    data: UpdateServiceRequestData
  ): Promise<ApiResponse<ServiceRequest>> {
    return api.serviceRequests.update(requestId, data);
  },

  /**
   * Delete service request
   */
  async deleteServiceRequest(requestId: string): Promise<ApiResponse<void>> {
    return api.serviceRequests.delete(requestId);
  },

  /**
   * Get user's service requests
   */
  async getMyServiceRequests(
    filters?: ServiceRequestFilters
  ): Promise<ApiResponse<PaginatedResponse<ServiceRequest>>> {
    return api.serviceRequests.getMyRequests(filters);
  },

  /**
   * Get provider recommendations for a service request
   */
  async getProviderRecommendations(requestId: string): Promise<ApiResponse<ProviderRecommendation[]>> {
    return api.serviceRequests.getRecommendations(requestId);
  },

  /**
   * Cancel service request
   */
  async cancelServiceRequest(requestId: string, reason: string): Promise<ApiResponse<void>> {
    return api.serviceRequests.cancel(requestId, reason);
  },

  /**
   * Upload images for service request
   */
  async uploadImages(files: File[], onProgress?: (progress: number) => void): Promise<Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>> {
    const uploadedImages = [];
    
    for (const file of files) {
      try {
        const response = await api.users.uploadAvatar(file, onProgress);
        if (response.success && response.data) {
          uploadedImages.push({
            url: response.data.avatarUrl,
            filename: file.name,
            fileType: file.type,
            fileSize: file.size
          });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    
    return uploadedImages;
  },

  /**
   * Get urgency display name
   */
  getUrgencyName(urgency: ServiceRequest['urgency']): string {
    const urgencyNames: Record<ServiceRequest['urgency'], string> = {
      flexible: 'مرن',
      urgent: 'عاجل',
      very_urgent: 'عاجل جداً'
    };
    return urgencyNames[urgency] || urgency;
  },

  /**
   * Get status display name
   */
  getStatusName(status: ServiceRequest['status']): string {
    const statusNames: Record<ServiceRequest['status'], string> = {
      open: 'مفتوح',
      negotiating: 'قيد التفاوض',
      assigned: 'تم التعيين',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };
    return statusNames[status] || status;
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status: ServiceRequest['status']): string {
    const statusColors: Record<ServiceRequest['status'], string> = {
      open: 'bg-green-100 text-green-800',
      negotiating: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Check if service request is expired
   */
  isExpired(request: ServiceRequest): boolean {
    return new Date(request.expiresAt) < new Date();
  },

  /**
   * Get time until expiration
   */
  getTimeUntilExpiration(request: ServiceRequest): {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const expiration = new Date(request.expiresAt);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        isExpired: true
      };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      days,
      hours,
      minutes,
      isExpired: false
    };
  },

  /**
   * Format expiration time for display
   */
  formatExpirationTime(request: ServiceRequest): string {
    const timeUntil = this.getTimeUntilExpiration(request);
    
    if (timeUntil.isExpired) {
      return 'منتهي الصلاحية';
    }
    
    if (timeUntil.days > 0) {
      return `${timeUntil.days} يوم متبقي`;
    } else if (timeUntil.hours > 0) {
      return `${timeUntil.hours} ساعة متبقية`;
    } else {
      return `${timeUntil.minutes} دقيقة متبقية`;
    }
  },

  /**
   * Check if user can edit service request
   */
  canEdit(request: ServiceRequest, userId: string): boolean {
    return request.seekerId._id === userId && request.status === 'open';
  },

  /**
   * Check if user can cancel service request
   */
  canCancel(request: ServiceRequest, userId: string): boolean {
    return (
      request.seekerId._id === userId || 
      request.assignedTo?._id === userId
    ) && request.status !== 'completed' && request.status !== 'cancelled';
  },

  /**
   * Get service request statistics
   */
  async getServiceRequestStats(userId: string): Promise<{
    total: number;
    open: number;
    negotiating: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const response = await this.getMyServiceRequests({ limit: 1000 });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch service request data');
      }

      const requests = response.data.data;
      
      const stats = {
        total: requests.length,
        open: requests.filter(r => r.status === 'open').length,
        negotiating: requests.filter(r => r.status === 'negotiating').length,
        assigned: requests.filter(r => r.status === 'assigned').length,
        inProgress: requests.filter(r => r.status === 'in_progress').length,
        completed: requests.filter(r => r.status === 'completed').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting service request stats:', error);
      return {
        total: 0,
        open: 0,
        negotiating: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
      };
    }
  },
};

export default serviceRequestService; 
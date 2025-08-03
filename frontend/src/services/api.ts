// Base API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Create headers with authentication
  private createHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      throw new ApiError(
        response.status,
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || errorData.message || 'حدث خطأ غير متوقع',
        errorData
      );
    }

    const data = await response.json();
    return data;
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.createHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.createHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.createHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.createHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.createHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Upload file
  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            reject(new ApiError(xhr.status, 'PARSE_ERROR', 'فشل في تحليل الاستجابة'));
          }
        } else {
          reject(new ApiError(xhr.status, 'UPLOAD_ERROR', 'فشل في رفع الملف'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'NETWORK_ERROR', 'خطأ في الشبكة'));
      });

      const token = this.getAuthToken();
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Utility functions for common API operations
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<ApiResponse>('/auth/login', credentials),
    
    register: (userData: any) =>
      apiClient.post<ApiResponse>('/auth/register', userData),
    
    refreshToken: () =>
      apiClient.post<ApiResponse>('/auth/refresh-token'),
    
    forgotPassword: (email: string) =>
      apiClient.post<ApiResponse>('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, password: string) =>
      apiClient.post<ApiResponse>('/auth/reset-password', { token, password }),
    
    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post<ApiResponse>('/auth/change-password', { currentPassword, newPassword }),
    
    getCurrentUser: () =>
      apiClient.get<ApiResponse>('/auth/me'),
  },

  // Users
  users: {
    getProfile: () =>
      apiClient.get<ApiResponse>('/users/profile'),
    
    updateProfile: (data: any) =>
      apiClient.patch<ApiResponse>('/users/profile', data),
    
    uploadAvatar: (file: File, onProgress?: (progress: number) => void) =>
      apiClient.upload<ApiResponse>('/users/avatar', file, onProgress),
  },

  // Service Requests
  serviceRequests: {
    create: (data: any) =>
      apiClient.post<ApiResponse>('/requests', data),
    
    getAll: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/requests', params),
    
    getById: (id: string) =>
      apiClient.get<ApiResponse>(`/requests/${id}`),
    
    update: (id: string, data: any) =>
      apiClient.patch<ApiResponse>(`/requests/${id}`, data),
    
    delete: (id: string) =>
      apiClient.delete<ApiResponse>(`/requests/${id}`),
    
    getMyRequests: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/requests/my-requests', params),
    
    getRecommendations: (id: string) =>
      apiClient.get<ApiResponse>(`/requests/${id}/recommendations`),
    
    cancel: (id: string, reason: string) =>
      apiClient.post<ApiResponse>(`/requests/${id}/cancel`, { reason }),
  },

  // Offers
  offers: {
    create: (data: any) =>
      apiClient.post<ApiResponse>('/offers', data),
    
    getAll: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/offers', params),
    
    getById: (id: string) =>
      apiClient.get<ApiResponse>(`/offers/${id}`),
    
    update: (id: string, data: any) =>
      apiClient.patch<ApiResponse>(`/offers/${id}`, data),
    
    delete: (id: string) =>
      apiClient.delete<ApiResponse>(`/offers/${id}`),
    
    accept: (id: string) =>
      apiClient.post<ApiResponse>(`/offers/${id}/accept`),
    
    reject: (id: string) =>
      apiClient.post<ApiResponse>(`/offers/${id}/reject`),
    
    negotiate: (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/offers/${id}/negotiate`, data),
    
    getNegotiationHistory: (id: string) =>
      apiClient.get<ApiResponse>(`/offers/${id}/negotiation-history`),
  },

  // Payments
  payments: {
    create: (data: any) =>
      apiClient.post<ApiResponse>('/payment/create', data),
    
    getById: (id: string) =>
      apiClient.get<ApiResponse>(`/payment/${id}`),
    
    updateStatus: (id: string, data: any) =>
      apiClient.patch<ApiResponse>(`/payment/${id}/status`, data),
    
    requestRefund: (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/payment/${id}/refund`, data),
    
    getMyTransactions: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/payment/my-transactions', params),
  },

  // Reviews
  reviews: {
    create: (data: any) =>
      apiClient.post<ApiResponse>('/reviews', data),
    
    getRequestReviews: (requestId: string) =>
      apiClient.get<ApiResponse>(`/reviews/request/${requestId}`),
    
    getProviderReviews: (providerId: string, params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>(`/reviews/provider/${providerId}`, params),
    
    getSeekerReviews: (seekerId: string, params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>(`/reviews/seeker/${seekerId}`, params),
    
    getById: (id: string) =>
      apiClient.get<ApiResponse>(`/reviews/${id}`),
    
    update: (id: string, data: any) =>
      apiClient.patch<ApiResponse>(`/reviews/${id}`, data),
    
    delete: (id: string) =>
      apiClient.delete<ApiResponse>(`/reviews/${id}`),
    
    markHelpful: (id: string) =>
      apiClient.post<ApiResponse>(`/reviews/${id}/helpful`),
    
    report: (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/reviews/${id}/report`, data),
    
    getProviderStats: (providerId: string) =>
      apiClient.get<ApiResponse>(`/reviews/stats/provider/${providerId}`),
    
    getRecent: (params?: any) =>
      apiClient.get<ApiResponse>(`/reviews/recent`, params),
    
    getTopRated: (params?: any) =>
      apiClient.get<ApiResponse>(`/reviews/top-rated`, params),
  },

  // Notifications
  notifications: {
    getAll: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/notifications', params),
    
    getUnreadCount: () =>
      apiClient.get<ApiResponse>('/notifications/unread-count'),
    
    getById: (id: string) =>
      apiClient.get<ApiResponse>(`/notifications/${id}`),
    
    markAsRead: (id: string) =>
      apiClient.patch<ApiResponse>(`/notifications/${id}/read`),
    
    markAsUnread: (id: string) =>
      apiClient.patch<ApiResponse>(`/notifications/${id}/unread`),
    
    markAllAsRead: () =>
      apiClient.patch<ApiResponse>('/notifications/read-all'),
    
    delete: (id: string) =>
      apiClient.delete<ApiResponse>(`/notifications/${id}`),
    
    clearRead: () =>
      apiClient.delete<ApiResponse>('/notifications/clear-read'),
    
    getSettings: () =>
      apiClient.get<ApiResponse>('/notifications/settings'),
    
    updateSettings: (settings: any) =>
      apiClient.post<ApiResponse>('/notifications/settings', settings),
  },

  // Verification
  verification: {
    request: (data: any) =>
      apiClient.post<ApiResponse>('/verification/request', data),
    
    uploadDocuments: (data: any) =>
      apiClient.post<ApiResponse>('/verification/upload', data),
    
    getStatus: () =>
      apiClient.get<ApiResponse>('/verification/status'),
    
    scheduleInterview: (data: any) =>
      apiClient.post<ApiResponse>('/verification/schedule-interview', data),
  },

  // Admin
  admin: {
    getDashboard: () =>
      apiClient.get<ApiResponse>('/admin/dashboard'),
    
    getStats: (params?: any) =>
      apiClient.get<ApiResponse>('/admin/stats', params),
    
    getUsers: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/users', params),
    
    getUserDetails: (id: string) =>
      apiClient.get<ApiResponse>(`/admin/users/${id}`),
    
    updateUser: (id: string, data: any) =>
      apiClient.patch<ApiResponse>(`/admin/users/${id}`, data),
    
    blockUser: (id: string, data: any) =>
      apiClient.post<ApiResponse>(`/admin/users/${id}/block`, data),
    
    unblockUser: (id: string) =>
      apiClient.post<ApiResponse>(`/admin/users/${id}/unblock`),
    
    getServiceRequests: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/service-requests', params),
    
    getOffers: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/offers', params),
    
    getPayments: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/payments', params),
    
    getReviews: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/reviews', params),
    
    getNotifications: (params?: any) =>
      apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/notifications', params),
    
    getActivity: (params?: any) =>
      apiClient.get<ApiResponse>('/admin/activity', params),
    
    sendNotification: (data: any) =>
      apiClient.post<ApiResponse>('/admin/send-notification', data),
    
    getReports: (params?: any) =>
      apiClient.get<ApiResponse>('/admin/reports', params),
  },
};

export default api; 
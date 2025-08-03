import { api, ApiResponse } from './api';

// Types for authentication
export interface User {
  _id: string;
  email: string;
  name: {
    first: string;
    last: string;
  };
  phone: string;
  role: 'seeker' | 'provider' | 'admin';
  verificationStatus: 'none' | 'basic' | 'skill' | 'approved';
  isActive: boolean;
  isBlocked: boolean;
  avatarUrl?: string;
  seekerProfile?: {
    preferences: string[];
    totalRequests: number;
    completedRequests: number;
  };
  providerProfile?: {
    skills: Array<{
      category: string;
      subcategory: string;
      experience: string;
    }>;
    rating: number;
    totalReviews: number;
    totalJobsCompleted: number;
    totalEarnings: number;
    availability: {
      isAvailable: boolean;
      schedule: Array<{
        day: string;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }>;
    };
  };
  verification?: {
    basicVerification: {
      isCompleted: boolean;
      completedAt?: string;
    };
    skillVerification: {
      isCompleted: boolean;
      completedAt?: string;
    };
    categorySpecific: {
      category: string;
      subcategory: string;
      experience: string;
      skills: string;
      portfolio: string;
      references: string;
      documents: Array<{
        type: string;
        url: string;
        filename: string;
      }>;
      interviewScheduled: boolean;
      interviewDate?: string;
      interviewNotes: string;
      assessment: string;
      recommendation: string;
      adminNotes: string;
      submittedAt: string;
      status: 'pending' | 'approved' | 'rejected';
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: {
    first: string;
    last: string;
  };
  phone: string;
  role?: 'seeker' | 'provider';
}

export interface UpdateProfileData {
  name?: {
    first: string;
    last: string;
  };
  phone?: string;
  seekerProfile?: {
    preferences: string[];
  };
  providerProfile?: {
    skills: Array<{
      category: string;
      subcategory: string;
      experience: string;
    }>;
    availability: {
      isAvailable: boolean;
      schedule: Array<{
        day: string;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }>;
    };
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Auth service functions
export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return api.auth.login(credentials);
  },

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    return api.auth.register(userData);
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    return api.auth.refreshToken();
  },

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return api.auth.forgotPassword(email);
  },

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return api.auth.resetPassword(token, password);
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return api.auth.changePassword(currentPassword, newPassword);
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.auth.getCurrentUser();
  },

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return api.users.getProfile();
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return api.users.updateProfile(data);
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ avatarUrl: string }>> {
    return api.users.uploadAvatar(file, onProgress);
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Store tokens in localStorage
   */
  storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  },

  /**
   * Store user data in localStorage
   */
  storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Check if user has specific role
   */
  hasRole(role: User['role']): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  },

  /**
   * Check if user is verified (for providers)
   */
  isVerified(): boolean {
    const user = this.getStoredUser();
    return user?.verificationStatus === 'approved';
  },

  /**
   * Check if user is active
   */
  isActive(): boolean {
    const user = this.getStoredUser();
    return user?.isActive === true;
  },

  /**
   * Check if user is blocked
   */
  isBlocked(): boolean {
    const user = this.getStoredUser();
    return user?.isBlocked === true;
  },

  /**
   * Get user's full name
   */
  getFullName(user?: User): string {
    const userData = user || this.getStoredUser();
    if (!userData) return '';
    return `${userData.name.first} ${userData.name.last}`;
  },

  /**
   * Get user's initials
   */
  getInitials(user?: User): string {
    const userData = user || this.getStoredUser();
    if (!userData) return '';
    return `${userData.name.first.charAt(0)}${userData.name.last.charAt(0)}`.toUpperCase();
  },

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone format (Egyptian)
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }
    
    if (!/\d/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Auto-refresh token when it's about to expire
   */
  async setupTokenRefresh(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    try {
      // Decode JWT to get expiration time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        await this.refreshToken();
      }

      // Set up automatic refresh 1 minute before expiry
      const refreshTime = timeUntilExpiry - 60 * 1000;
      if (refreshTime > 0) {
        setTimeout(async () => {
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('Failed to refresh token:', error);
            this.logout();
          }
        }, refreshTime);
      }
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  },
};

export default authService; 
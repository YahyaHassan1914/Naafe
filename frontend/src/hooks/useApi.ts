import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { 
  authService, 
  serviceRequestService, 
  offerService, 
  paymentService, 
  reviewService, 
  notificationService, 
  verificationService 
} from '../services';

// Query keys for React Query
export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
    profile: ['auth', 'profile'] as const,
  },

  // Service Requests
  serviceRequests: {
    all: (filters?: any) => ['serviceRequests', 'all', filters] as const,
    byId: (id: string) => ['serviceRequests', 'byId', id] as const,
    myRequests: (filters?: any) => ['serviceRequests', 'myRequests', filters] as const,
    recommendations: (id: string) => ['serviceRequests', 'recommendations', id] as const,
  },

  // Offers
  offers: {
    all: (filters?: any) => ['offers', 'all', filters] as const,
    byId: (id: string) => ['offers', 'byId', id] as const,
    byRequest: (requestId: string) => ['offers', 'byRequest', requestId] as const,
    byProvider: (providerId: string) => ['offers', 'byProvider', providerId] as const,
    negotiationHistory: (id: string) => ['offers', 'negotiationHistory', id] as const,
  },

  // Payments
  payments: {
    byId: (id: string) => ['payments', 'byId', id] as const,
    myTransactions: (filters?: any) => ['payments', 'myTransactions', filters] as const,
  },

  // Reviews
  reviews: {
    byId: (id: string) => ['reviews', 'byId', id] as const,
    byRequest: (requestId: string) => ['reviews', 'byRequest', requestId] as const,
    byProvider: (providerId: string, filters?: any) => ['reviews', 'byProvider', providerId, filters] as const,
    bySeeker: (seekerId: string, filters?: any) => ['reviews', 'bySeeker', seekerId, filters] as const,
    providerStats: (providerId: string) => ['reviews', 'providerStats', providerId] as const,
    recent: (filters?: any) => ['reviews', 'recent', filters] as const,
    topRated: (filters?: any) => ['reviews', 'topRated', filters] as const,
  },

  // Notifications
  notifications: {
    all: (filters?: any) => ['notifications', 'all', filters] as const,
    byId: (id: string) => ['notifications', 'byId', id] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
    settings: ['notifications', 'settings'] as const,
  },

  // Verification
  verification: {
    status: ['verification', 'status'] as const,
    steps: ['verification', 'steps'] as const,
  },
};

// Auth hooks
export const useCurrentUser = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useProfile = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.success && data.data) {
        authService.storeTokens(data.data.tokens);
        authService.storeUser(data.data.user);
        queryClient.setQueryData(queryKeys.auth.currentUser, data);
        queryClient.setQueryData(queryKeys.auth.profile, { success: true, data: data.data.user });
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.setQueryData(queryKeys.auth.profile, data);
        queryClient.setQueryData(queryKeys.auth.currentUser, { success: true, data: data.data });
      }
    },
  });
};

// Service Request hooks
export const useServiceRequests = (filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.serviceRequests.all(filters),
    queryFn: () => serviceRequestService.getAllServiceRequests(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useServiceRequest = (id: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.serviceRequests.byId(id),
    queryFn: () => serviceRequestService.getServiceRequestById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useMyServiceRequests = (filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.serviceRequests.myRequests(filters),
    queryFn: () => serviceRequestService.getMyServiceRequests(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serviceRequestService.createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
    },
  });
};

export const useUpdateServiceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      serviceRequestService.updateServiceRequest(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.serviceRequests.byId(variables.id), data);
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
    },
  });
};

export const useDeleteServiceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serviceRequestService.deleteServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
    },
  });
};

// Offer hooks
export const useOffers = (filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.offers.all(filters),
    queryFn: () => offerService.getAllOffers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useOffer = (id: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.offers.byId(id),
    queryFn: () => offerService.getOfferById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useOffersByRequest = (requestId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.offers.byRequest(requestId),
    queryFn: () => offerService.getAllOffers({ requestId }),
    enabled: !!requestId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: offerService.createOffer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
    },
  });
};

export const useAcceptOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: offerService.acceptOffer,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.offers.byId(variables), data);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
    },
  });
};

export const useRejectOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: offerService.rejectOffer,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.offers.byId(variables), data);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
};

export const useNegotiateOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: any }) => 
      offerService.negotiateOffer(offerId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.offers.byId(variables.offerId), data);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
};

// Payment hooks
export const usePayment = (id: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.payments.byId(id),
    queryFn: () => paymentService.getPaymentById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useMyTransactions = (filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.payments.myTransactions(filters),
    queryFn: () => paymentService.getMyTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

// Review hooks
export const useReview = (id: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.reviews.byId(id),
    queryFn: () => reviewService.getReviewById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useProviderReviews = (providerId: string, filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.reviews.byProvider(providerId, filters),
    queryFn: () => reviewService.getProviderReviews(providerId, filters),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useProviderReviewStats = (providerId: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.reviews.providerStats(providerId),
    queryFn: () => reviewService.getProviderReviewStats(providerId),
    enabled: !!providerId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

// Notification hooks
export const useNotifications = (filters?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.notifications.all(filters),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

export const useUnreadNotificationCount = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    ...options,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Verification hooks
export const useVerificationStatus = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.verification.status,
    queryFn: () => verificationService.getVerificationStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useVerificationSteps = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: queryKeys.verification.steps,
    queryFn: () => verificationService.getVerificationSteps(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useRequestVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: verificationService.requestVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification'] });
    },
  });
};

export const useUploadVerificationDocuments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: verificationService.uploadDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification'] });
    },
  });
};

// Utility hooks
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.refreshToken,
    onSuccess: (data) => {
      if (data.success && data.data) {
        authService.storeTokens(data.data);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
  });
}; 
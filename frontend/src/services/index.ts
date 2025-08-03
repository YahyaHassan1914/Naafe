// Export all services
export { default as api, apiClient, ApiResponse, PaginatedResponse, ApiError } from './api';
export { default as authService, type User, type LoginCredentials, type RegisterData, type UpdateProfileData, type AuthTokens, type AuthResponse } from './authService';
export { default as serviceRequestService, type ServiceRequest, type CreateServiceRequestData, type UpdateServiceRequestData, type ServiceRequestFilters, type ProviderRecommendation } from './serviceRequestService';
export { default as offerService, type Offer, type CreateOfferData, type UpdateOfferData, type NegotiationData, type OfferFilters } from './offerService';
export { default as paymentService, type Payment, type CreatePaymentRequest, type UpdatePaymentStatusRequest, type RefundRequest, type PaymentFilters } from './paymentService';
export { default as reviewService, type Review, type CreateReviewRequest, type UpdateReviewRequest, type ReviewFilters, type ReviewStats, type TopRatedProvider } from './reviewService';
export { default as notificationService, type Notification, type NotificationFilters, type NotificationSettings, type NotificationStats } from './notificationService';
export { default as verificationService, type VerificationRequest, type VerificationDocument, type UploadDocumentsData, type InterviewSchedule, type VerificationStatus, type VerificationStep } from './verificationService';
export { default as socketService, type SocketEvents } from './socketService';

// Legacy exports for backward compatibility
export { createReview, getUserReviews } from './reviewService';
export { createPayment, getPaymentDetails, getMyTransactions } from './paymentService';

// Export all services as a single object for convenience
export const services = {
  api,
  auth: authService,
  serviceRequests: serviceRequestService,
  offers: offerService,
  payments: paymentService,
  reviews: reviewService,
  notifications: notificationService,
  verification: verificationService,
  socket: socketService
};

export default services; 
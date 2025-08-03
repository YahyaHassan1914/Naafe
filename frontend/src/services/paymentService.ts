import { api, ApiResponse, PaginatedResponse } from './api';

// Types for payment data
export interface Payment {
  _id: string;
  requestId: string;
  offerId: string;
  seekerId: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    email: string;
  };
  providerId: {
    _id: string;
    name: {
      first: string;
      last: string;
    };
    email: string;
  };
  amount: number;
  platformFee: number;
  providerAmount: number;
  paymentMethod: 'stripe' | 'cod' | 'bank_transfer' | 'cash' | 'vodafone_cash' | 'meeza' | 'fawry';
  paymentGateway: 'stripe' | 'manual';
  status: 'pending' | 'agreed' | 'completed' | 'disputed' | 'refunded';
  transactionId?: string;
  paymentDate?: string;
  verificationDate?: string;
  verifiedBy?: string;
  refundRequest?: {
    reason: string;
    amount: number;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  requestId: string;
  offerId: string;
  amount: number;
  paymentMethod: Payment['paymentMethod'];
}

export interface UpdatePaymentStatusRequest {
  status: Payment['status'];
  verificationNotes?: string;
}

export interface RefundRequest {
  reason: string;
  amount?: number;
}

export interface PaymentFilters {
  status?: Payment['status'];
  paymentMethod?: Payment['paymentMethod'];
  page?: number;
  limit?: number;
}

// Payment service functions
export const paymentService = {
  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    return api.payments.create(data);
  },

  /**
   * Get payment details by ID
   */
  async getPaymentById(paymentId: string): Promise<ApiResponse<Payment>> {
    return api.payments.getById(paymentId);
  },

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(
    paymentId: string, 
    data: UpdatePaymentStatusRequest
  ): Promise<ApiResponse<Payment>> {
    return api.payments.updateStatus(paymentId, data);
  },

  /**
   * Request a refund
   */
  async requestRefund(
    paymentId: string, 
    data: RefundRequest
  ): Promise<ApiResponse<Payment>> {
    return api.payments.requestRefund(paymentId, data);
  },

  /**
   * Get user's transaction history
   */
  async getMyTransactions(
    filters?: PaymentFilters
  ): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    return api.payments.getMyTransactions(filters);
  },

  /**
   * Process Stripe payment (if using Stripe)
   */
  async processStripePayment(
    paymentIntentId: string,
    paymentData: CreatePaymentRequest
  ): Promise<ApiResponse<Payment>> {
    // This would integrate with Stripe's payment intent confirmation
    // For now, we'll create the payment record and let the webhook handle the status update
    return this.createPayment(paymentData);
  },

  /**
   * Get payment statistics for a user
   */
  async getPaymentStats(userId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    pendingPayments: number;
    averageAmount: number;
  }> {
    try {
      const response = await api.payments.getMyTransactions({ limit: 1000 });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payment data');
      }

      const payments = response.data.data;
      
      const stats = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
        completedPayments: payments.filter(p => p.status === 'completed').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        averageAmount: payments.length > 0 
          ? payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length 
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        averageAmount: 0
      };
    }
  },

  /**
   * Format payment amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  },

  /**
   * Get payment method display name
   */
  getPaymentMethodName(method: Payment['paymentMethod']): string {
    const methodNames: Record<Payment['paymentMethod'], string> = {
      stripe: 'بطاقة ائتمان',
      cod: 'الدفع عند الاستلام',
      bank_transfer: 'تحويل بنكي',
      cash: 'نقداً',
      vodafone_cash: 'فودافون كاش',
      meeza: 'ميزة',
      fawry: 'فوري'
    };
    return methodNames[method] || method;
  },

  /**
   * Get payment status display name
   */
  getPaymentStatusName(status: Payment['status']): string {
    const statusNames: Record<Payment['status'], string> = {
      pending: 'في الانتظار',
      agreed: 'تم الاتفاق',
      completed: 'مكتمل',
      disputed: 'متنازع عليه',
      refunded: 'مسترد'
    };
    return statusNames[status] || status;
  },

  /**
   * Check if payment can be refunded
   */
  canRefund(payment: Payment): boolean {
    return payment.status === 'completed' && !payment.refundRequest;
  },

  /**
   * Check if payment can be disputed
   */
  canDispute(payment: Payment): boolean {
    return payment.status === 'completed' && !payment.refundRequest;
  },
};

// Legacy functions for backward compatibility
export const createPayment = async (
  data: CreatePaymentRequest
): Promise<ApiResponse<Payment>> => {
  return paymentService.createPayment(data);
};

export const getPaymentDetails = async (
  paymentId: string
): Promise<ApiResponse<Payment>> => {
  return paymentService.getPaymentById(paymentId);
};

export const getMyTransactions = async (
  filters?: PaymentFilters
): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
  return paymentService.getMyTransactions(filters);
};

export default paymentService; 
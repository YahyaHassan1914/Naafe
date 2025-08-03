import Payment from '../models/Payment.js';
import Offer from '../models/Offer.js';
import ServiceRequest from '../models/JobRequest.js';
import User from '../models/User.js';
import { logger } from '../middlewares/logging.middleware.js';

class PaymentService {
  /**
   * Create a new payment for a service
   * @param {Object} paymentData - Payment data
   * @param {string} seekerId - ID of the seeker making the payment
   * @returns {Object} Created payment
   */
  async createPayment(paymentData, seekerId) {
    try {
      logger.info(`Creating payment for service request: ${paymentData.requestId} by seeker: ${seekerId}`);
      
      // Verify seeker exists
      const seeker = await User.findById(seekerId);
      if (!seeker || seeker.role !== 'seeker') {
        throw new Error('Seeker not found or not authorized');
      }

      // Verify offer exists and is accepted
      const offer = await Offer.findById(paymentData.offerId)
        .populate('requestId')
        .populate('providerId');
      
      if (!offer) {
        throw new Error('Offer not found');
      }
      
      if (offer.status !== 'accepted') {
        throw new Error('Can only create payment for accepted offers');
      }

      // Verify service request belongs to seeker
      if (offer.requestId.seekerId.toString() !== seekerId.toString()) {
        throw new Error('Unauthorized to create payment for this offer');
      }

      // Verify payment amount matches offer price
      if (paymentData.amount !== offer.price) {
        throw new Error('Payment amount must match offer price');
      }

      // Check if payment already exists for this offer
      const existingPayment = await Payment.findOne({ offerId: paymentData.offerId });
      if (existingPayment) {
        throw new Error('Payment already exists for this offer');
      }

      // Calculate platform fee (5% for now, can be made configurable)
      const platformFee = Math.round(paymentData.amount * 0.05);
      const providerAmount = paymentData.amount - platformFee;

      // Create payment with new model structure
      const payment = new Payment({
        requestId: paymentData.requestId,
        offerId: paymentData.offerId,
        seekerId: seekerId,
        providerId: offer.providerId._id,
        amount: paymentData.amount,
        platformFee: platformFee,
        providerAmount: providerAmount,
        paymentMethod: paymentData.paymentMethod,
        status: 'pending',
        paymentGateway: paymentData.paymentMethod === 'stripe' ? 'stripe' : 'manual'
      });

      await payment.save();
      logger.info(`Payment created successfully: ${payment._id}`);

      // Update service request status to in_progress
      await ServiceRequest.findByIdAndUpdate(paymentData.requestId, { 
        status: 'in_progress' 
      });

      // Populate payment with related data
      await payment.populate([
        { path: 'seekerId', select: 'name email' },
        { path: 'providerId', select: 'name email' },
        { path: 'requestId', select: 'category subcategory description' }
      ]);

      // Send real-time notification to both users
      try {
        const { default: socketService } = await import('./socketService.js');
        await socketService.sendPaymentNotification(payment._id, seekerId, offer.providerId._id.toString());
      } catch (error) {
        logger.error('Error sending payment notification:', error);
        // Don't throw error here as the payment was already created successfully
      }

      return payment;
    } catch (error) {
      logger.error(`Error creating payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @param {string} userId - User ID for authorization
   * @returns {Object} Payment with populated data
   */
  async getPaymentById(paymentId, userId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('seekerId', 'name email')
        .populate('providerId', 'name email')
        .populate('requestId', 'category subcategory description');

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check authorization
      const user = await User.findById(userId);
      const isAuthorized = 
        user.role === 'admin' ||
        payment.seekerId._id.toString() === userId.toString() ||
        payment.providerId._id.toString() === userId.toString();

      if (!isAuthorized) {
        throw new Error('Unauthorized to view this payment');
      }

      return payment;
    } catch (error) {
      logger.error(`Error getting payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update payment status (for manual payments)
   * @param {string} paymentId - Payment ID
   * @param {Object} updateData - Update data
   * @param {string} adminId - Admin ID
   * @returns {Object} Updated payment
   */
  async updatePaymentStatus(paymentId, updateData, adminId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Only allow status updates for manual payments
      if (payment.paymentGateway !== 'manual') {
        throw new Error('Can only update status for manual payments');
      }

      // Update payment status
      payment.status = updateData.status;
      payment.verificationDate = new Date();
      payment.verifiedBy = adminId;
      
      if (updateData.verificationNotes) {
        payment.verificationNotes = updateData.verificationNotes;
      }

      await payment.save();
      logger.info(`Payment status updated: ${paymentId} to ${updateData.status}`);

      // If payment is completed, update service request status
      if (updateData.status === 'completed') {
        await ServiceRequest.findByIdAndUpdate(payment.requestId, { 
          status: 'completed',
          completedAt: new Date()
        });

        // Send real-time notification to both users
        try {
          const { default: socketService } = await import('./socketService.js');
          await socketService.sendPaymentCompletionNotification(payment._id, payment.seekerId.toString(), payment.providerId.toString());
        } catch (error) {
          logger.error('Error sending payment completion notification:', error);
          // Don't throw error here as the payment was already updated successfully
        }
      }

      return payment;
    } catch (error) {
      logger.error(`Error updating payment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Request a refund for a payment
   * @param {string} paymentId - Payment ID
   * @param {Object} refundData - Refund data
   * @param {string} userId - User ID
   * @returns {Object} Refund request details
   */
  async requestRefund(paymentId, refundData, userId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check authorization (only payment participants can request refund)
      const isAuthorized = 
        payment.seekerId.toString() === userId.toString() ||
        payment.providerId.toString() === userId.toString();

      if (!isAuthorized) {
        throw new Error('Unauthorized to request refund for this payment');
      }

      // Only allow refund requests for completed payments
      if (payment.status !== 'completed') {
        throw new Error('Can only request refund for completed payments');
      }

      // Calculate refund amount
      const refundAmount = refundData.amount || payment.amount;

      // Create refund request
      payment.refundRequest = {
        requestedBy: userId,
        requestedAt: new Date(),
        reason: refundData.reason,
        amount: refundAmount,
        status: 'pending'
      };

      await payment.save();
      logger.info(`Refund requested for payment: ${paymentId}`);

      return payment;
    } catch (error) {
      logger.error(`Error requesting refund: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transactions for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Object} Object with transactions and total count
   */
  async getMyTransactions(userId, filters = {}) {
    try {
      const {
        status,
        paymentMethod,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting transactions for user: ${userId}`);

      let query = {
        $or: [
          { seekerId: userId },
          { providerId: userId }
        ]
      };

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [transactions, total] = await Promise.all([
        Payment.find(query)
          .populate('seekerId', 'name email')
          .populate('providerId', 'name email')
          .populate('requestId', 'category subcategory description')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Payment.countDocuments(query)
      ]);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all transactions (Admin only)
   * @param {Object} filters - Filter options
   * @returns {Object} Object with transactions and total count
   */
  async getAllTransactions(filters = {}) {
    try {
      const {
        status,
        paymentMethod,
        userId,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting all transactions with filters:`, filters);

      let query = {};

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }

      if (userId) {
        query.$or = [
          { seekerId: userId },
          { providerId: userId }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [transactions, total] = await Promise.all([
        Payment.find(query)
          .populate('seekerId', 'name email')
          .populate('providerId', 'name email')
          .populate('requestId', 'category subcategory description')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Payment.countDocuments(query)
      ]);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting all transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle payment webhook (Stripe, etc.)
   * @param {Object} webhookData - Webhook data
   * @returns {Object} Webhook processing result
   */
  async handleWebhook(webhookData) {
    try {
      logger.info(`Processing payment webhook: ${webhookData.type}`);
      
      // This is a simplified webhook handler
      // In production, you would verify the webhook signature
      // and handle different webhook types (payment_intent.succeeded, etc.)
      
      if (webhookData.type === 'payment_intent.succeeded') {
        const paymentIntent = webhookData.data.object;
        
        // Find payment by transaction ID
        const payment = await Payment.findOne({ 
          transactionId: paymentIntent.id 
        });
        
        if (payment) {
          payment.status = 'completed';
          payment.paymentDate = new Date();
          await payment.save();
          
          // Update service request status
          await ServiceRequest.findByIdAndUpdate(payment.requestId, { 
            status: 'completed',
            completedAt: new Date()
          });
          
          logger.info(`Payment completed via webhook: ${payment._id}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      logger.error(`Error processing webhook: ${error.message}`);
      throw error;
    }
  }
}

export default new PaymentService(); 
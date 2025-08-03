import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logger } from '../middlewares/logging.middleware.js';

class VerificationService {
  /**
   * Request provider verification
   * @param {Object} verificationData - Verification request data
   * @param {string} providerId - Provider ID
   * @returns {Object} Verification request details
   */
  async requestVerification(verificationData, providerId) {
    try {
      logger.info(`Provider ${providerId} requesting verification for ${verificationData.category}/${verificationData.subcategory}`);
      
      const provider = await User.findById(providerId);
      if (!provider || provider.role !== 'provider') {
        throw new Error('Provider not found or not authorized');
      }

      // Check if verification is already in progress
      if (provider.verificationStatus !== 'none') {
        throw new Error('Verification already in progress or completed');
      }

      // Validate required fields for Egypt-specific verification
      const requiredFields = ['category', 'subcategory', 'experience', 'skills'];
      for (const field of requiredFields) {
        if (!verificationData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Initialize verification data based on Egypt-specific approach
      const verificationInfo = {
        category: verificationData.category,
        subcategory: verificationData.subcategory,
        experience: verificationData.experience,
        skills: verificationData.skills,
        portfolio: verificationData.portfolio || '',
        references: verificationData.references || '',
        documents: [],
        interviewScheduled: false,
        interviewDate: null,
        interviewNotes: '',
        assessment: '',
        recommendation: '',
        adminNotes: '',
        submittedAt: new Date(),
        status: 'pending'
      };

      // Update provider with verification data
      const updatedProvider = await User.findByIdAndUpdate(
        providerId,
        {
          verificationStatus: 'basic',
          'verification.categorySpecific': verificationInfo
        },
        { new: true }
      );

      // Create notification for admin
      await this.createAdminNotification(providerId, 'verification_requested', {
        category: verificationData.category,
        subcategory: verificationData.subcategory
      });

      logger.info(`Verification request submitted for provider: ${providerId}`);
      return updatedProvider;
    } catch (error) {
      logger.error(`Error requesting verification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload verification documents
   * @param {Object} uploadData - Document upload data
   * @param {string} providerId - Provider ID
   * @returns {Object} Upload confirmation
   */
  async uploadDocuments(uploadData, providerId) {
    try {
      logger.info(`Provider ${providerId} uploading documents: ${uploadData.documentType}`);
      
      const provider = await User.findById(providerId);
      if (!provider || provider.role !== 'provider') {
        throw new Error('Provider not found or not authorized');
      }

      if (!provider.verification.categorySpecific) {
        throw new Error('No verification request found. Please submit verification request first.');
      }

      // Validate document type
      const validDocumentTypes = ['id_card', 'portfolio', 'references', 'certificates', 'work_samples'];
      if (!validDocumentTypes.includes(uploadData.documentType)) {
        throw new Error('Invalid document type');
      }

      // Add documents to verification data
      const documents = provider.verification.categorySpecific.documents || [];
      documents.push({
        type: uploadData.documentType,
        urls: uploadData.documents,
        uploadedAt: new Date()
      });

      // Update provider verification data
      const updatedProvider = await User.findByIdAndUpdate(
        providerId,
        {
          'verification.categorySpecific.documents': documents
        },
        { new: true }
      );

      // Create notification for admin
      await this.createAdminNotification(providerId, 'documents_uploaded', {
        documentType: uploadData.documentType,
        documentCount: uploadData.documents.length
      });

      logger.info(`Documents uploaded for provider: ${providerId}`);
      return { message: 'Documents uploaded successfully', documentCount: documents.length };
    } catch (error) {
      logger.error(`Error uploading documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Schedule verification interview
   * @param {Object} interviewData - Interview scheduling data
   * @param {string} providerId - Provider ID
   * @returns {Object} Interview scheduling confirmation
   */
  async scheduleInterview(interviewData, providerId) {
    try {
      logger.info(`Provider ${providerId} scheduling interview for ${interviewData.preferredDate}`);
      
      const provider = await User.findById(providerId);
      if (!provider || provider.role !== 'provider') {
        throw new Error('Provider not found or not authorized');
      }

      if (!provider.verification.categorySpecific) {
        throw new Error('No verification request found. Please submit verification request first.');
      }

      // Validate interview date (must be in the future)
      const interviewDate = new Date(interviewData.preferredDate);
      if (interviewDate <= new Date()) {
        throw new Error('Interview date must be in the future');
      }

      // Update verification data with interview details
      const updatedProvider = await User.findByIdAndUpdate(
        providerId,
        {
          'verification.categorySpecific.interviewScheduled': true,
          'verification.categorySpecific.interviewDate': interviewDate,
          'verification.categorySpecific.interviewNotes': interviewData.notes || ''
        },
        { new: true }
      );

      // Create notification for admin
      await this.createAdminNotification(providerId, 'interview_scheduled', {
        interviewDate: interviewDate,
        preferredTime: interviewData.preferredTime
      });

      logger.info(`Interview scheduled for provider: ${providerId}`);
      return { message: 'Interview scheduled successfully', interviewDate: interviewDate };
    } catch (error) {
      logger.error(`Error scheduling interview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get verification status for user
   * @param {string} userId - User ID
   * @returns {Object} Verification status and details
   */
  async getVerificationStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const verificationData = {
        status: user.verificationStatus,
        basicVerification: user.verification.basicVerification || {},
        skillVerification: user.verification.skillVerification || {},
        categorySpecific: user.verification.categorySpecific || {}
      };

      return verificationData;
    } catch (error) {
      logger.error(`Error getting verification status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all verification requests (Admin)
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated verification requests
   */
  async getAllVerifications(filters = {}) {
    try {
      const {
        status,
        category,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting all verifications with filters:`, filters);

      let query = {
        role: 'provider',
        'verificationStatus': { $ne: 'none' }
      };

      // Apply filters
      if (status) {
        query.verificationStatus = status;
      }

      if (category) {
        query['verification.categorySpecific.category'] = category;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [verifications, total] = await Promise.all([
        User.find(query)
          .select('name email phone verificationStatus verification.categorySpecific createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      return {
        verifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting all verifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending verification requests (Admin)
   * @param {Object} pagination - Pagination options
   * @returns {Object} Paginated pending verification requests
   */
  async getPendingVerifications(pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      
      logger.info(`Getting pending verifications`);

      const query = {
        role: 'provider',
        verificationStatus: { $in: ['basic', 'skill'] }
      };

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [verifications, total] = await Promise.all([
        User.find(query)
          .select('name email phone verificationStatus verification.categorySpecific createdAt')
          .sort({ 'verification.categorySpecific.submittedAt': 1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      return {
        verifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting pending verifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve provider verification (Admin)
   * @param {string} userId - User ID to approve
   * @param {Object} approvalData - Approval data
   * @param {string} adminId - Admin ID
   * @returns {Object} Approval confirmation
   */
  async approveVerification(userId, approvalData, adminId) {
    try {
      logger.info(`Admin ${adminId} approving verification for user: ${userId}`);
      
      const user = await User.findById(userId);
      if (!user || user.role !== 'provider') {
        throw new Error('Provider not found');
      }

      if (user.verificationStatus === 'approved') {
        throw new Error('Provider is already approved');
      }

      // Determine verification level
      const verificationLevel = approvalData.verificationLevel || 'approved';
      
      // Update verification status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          verificationStatus: verificationLevel,
          'verification.categorySpecific.status': 'approved',
          'verification.categorySpecific.adminNotes': approvalData.notes || '',
          'verification.categorySpecific.approvedAt': new Date(),
          'verification.categorySpecific.approvedBy': adminId
        },
        { new: true }
      );

      // Create notification for provider
      await this.createProviderNotification(userId, 'verification_approved', {
        verificationLevel: verificationLevel,
        notes: approvalData.notes
      });

      logger.info(`Verification approved for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error approving verification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject provider verification (Admin)
   * @param {string} userId - User ID to reject
   * @param {Object} rejectionData - Rejection data
   * @param {string} adminId - Admin ID
   * @returns {Object} Rejection confirmation
   */
  async rejectVerification(userId, rejectionData, adminId) {
    try {
      logger.info(`Admin ${adminId} rejecting verification for user: ${userId}`);
      
      const user = await User.findById(userId);
      if (!user || user.role !== 'provider') {
        throw new Error('Provider not found');
      }

      // Update verification status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          verificationStatus: 'none',
          'verification.categorySpecific.status': 'rejected',
          'verification.categorySpecific.adminNotes': rejectionData.reason,
          'verification.categorySpecific.suggestions': rejectionData.suggestions || '',
          'verification.categorySpecific.rejectedAt': new Date(),
          'verification.categorySpecific.rejectedBy': adminId
        },
        { new: true }
      );

      // Create notification for provider
      await this.createProviderNotification(userId, 'verification_rejected', {
        reason: rejectionData.reason,
        suggestions: rejectionData.suggestions
      });

      logger.info(`Verification rejected for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error rejecting verification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Block user (Admin)
   * @param {string} userId - User ID to block
   * @param {Object} blockData - Block data
   * @param {string} adminId - Admin ID
   * @returns {Object} Block confirmation
   */
  async blockUser(userId, blockData, adminId) {
    try {
      logger.info(`Admin ${adminId} blocking user: ${userId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isBlocked) {
        throw new Error('User is already blocked');
      }

      // Update user status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: adminId,
          blockReason: blockData.reason
        },
        { new: true }
      );

      // Create notification for user
      await this.createUserNotification(userId, 'account_blocked', {
        reason: blockData.reason
      });

      logger.info(`User blocked: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error blocking user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unblock user (Admin)
   * @param {string} userId - User ID to unblock
   * @param {string} adminId - Admin ID
   * @returns {Object} Unblock confirmation
   */
  async unblockUser(userId, adminId) {
    try {
      logger.info(`Admin ${adminId} unblocking user: ${userId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isBlocked) {
        throw new Error('User is not blocked');
      }

      // Update user status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          isBlocked: false,
          unblockedAt: new Date(),
          unblockedBy: adminId,
          $unset: { blockReason: 1 }
        },
        { new: true }
      );

      // Create notification for user
      await this.createUserNotification(userId, 'account_unblocked', {});

      logger.info(`User unblocked: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error unblocking user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Conduct verification interview (Admin)
   * @param {string} userId - User ID for interview
   * @param {Object} interviewData - Interview data
   * @param {string} adminId - Admin ID
   * @returns {Object} Interview results
   */
  async conductInterview(userId, interviewData, adminId) {
    try {
      logger.info(`Admin ${adminId} conducting interview for user: ${userId}`);
      
      const user = await User.findById(userId);
      if (!user || user.role !== 'provider') {
        throw new Error('Provider not found');
      }

      if (!user.verification.categorySpecific) {
        throw new Error('No verification request found');
      }

      // Update interview results
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          'verification.categorySpecific.interviewNotes': interviewData.interviewNotes,
          'verification.categorySpecific.assessment': interviewData.assessment,
          'verification.categorySpecific.recommendation': interviewData.recommendation,
          'verification.categorySpecific.interviewConductedAt': new Date(),
          'verification.categorySpecific.interviewConductedBy': adminId
        },
        { new: true }
      );

      // Create notification for provider
      await this.createProviderNotification(userId, 'interview_completed', {
        assessment: interviewData.assessment,
        recommendation: interviewData.recommendation
      });

      logger.info(`Interview conducted for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error conducting interview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create admin notification
   */
  async createAdminNotification(userId, type, data) {
    try {
      // Find admin users
      const admins = await User.find({ role: 'admin', isActive: true });
      
      // Create notifications for all admins
      const notifications = admins.map(admin => ({
        userId: admin._id,
        type: type,
        title: 'طلب تحقق جديد',
        message: `طلب تحقق جديد من مقدم خدمة`,
        data: { userId, ...data },
        isRead: false
      }));

      await Notification.insertMany(notifications);
    } catch (error) {
      logger.error('Error creating admin notification:', error);
    }
  }

  /**
   * Create provider notification
   */
  async createProviderNotification(userId, type, data) {
    try {
      const notification = new Notification({
        userId: userId,
        type: type,
        title: 'تحديث حالة التحقق',
        message: 'تم تحديث حالة التحقق الخاصة بك',
        data: data,
        isRead: false
      });

      await notification.save();
    } catch (error) {
      logger.error('Error creating provider notification:', error);
    }
  }

  /**
   * Create user notification
   */
  async createUserNotification(userId, type, data) {
    try {
      const notification = new Notification({
        userId: userId,
        type: type,
        title: 'تحديث الحساب',
        message: 'تم تحديث حالة حسابك',
        data: data,
        isRead: false
      });

      await notification.save();
    } catch (error) {
      logger.error('Error creating user notification:', error);
    }
  }
}

export default new VerificationService(); 
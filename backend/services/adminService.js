import User from '../models/User.js';
import ServiceRequest from '../models/JobRequest.js';
import Offer from '../models/Offer.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import { logger } from '../middlewares/logging.middleware.js';

class AdminService {
  /**
   * Get dashboard overview
   * @returns {Object} Dashboard overview data
   */
  async getDashboardOverview() {
    try {
      logger.info('Getting admin dashboard overview');

      // Get basic counts
      const [
        totalUsers,
        totalSeekers,
        totalProviders,
        totalAdmins,
        totalServiceRequests,
        totalOffers,
        totalPayments,
        totalReviews,
        pendingVerifications,
        blockedUsers
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'seeker' }),
        User.countDocuments({ role: 'provider' }),
        User.countDocuments({ role: 'admin' }),
        ServiceRequest.countDocuments(),
        Offer.countDocuments(),
        Payment.countDocuments(),
        Review.countDocuments(),
        User.countDocuments({ 
          role: 'provider', 
          verificationStatus: { $in: ['basic', 'skill'] } 
        }),
        User.countDocuments({ isBlocked: true })
      ]);

      // Get recent activity counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        newUsersToday,
        newServiceRequestsToday,
        newOffersToday,
        completedPaymentsToday
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: today } }),
        ServiceRequest.countDocuments({ createdAt: { $gte: today } }),
        Offer.countDocuments({ createdAt: { $gte: today } }),
        Payment.countDocuments({ 
          status: 'completed', 
          updatedAt: { $gte: today } 
        })
      ]);

      // Calculate revenue
      const revenueData = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$platformFee' } } }
      ]);

      const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

      return {
        overview: {
          totalUsers,
          totalSeekers,
          totalProviders,
          totalAdmins,
          totalServiceRequests,
          totalOffers,
          totalPayments,
          totalReviews,
          pendingVerifications,
          blockedUsers,
          totalRevenue
        },
        today: {
          newUsers: newUsersToday,
          newServiceRequests: newServiceRequestsToday,
          newOffers: newOffersToday,
          completedPayments: completedPaymentsToday
        }
      };
    } catch (error) {
      logger.error(`Error getting dashboard overview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get platform statistics
   * @param {Object} filters - Filter options
   * @returns {Object} Platform statistics
   */
  async getPlatformStats(filters = {}) {
    try {
      const { period = 'month' } = filters;
      
      logger.info(`Getting platform stats for period: ${period}`);

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get statistics for the period
      const [
        newUsers,
        newServiceRequests,
        newOffers,
        completedPayments,
        totalRevenue,
        averageRating
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: startDate } }),
        ServiceRequest.countDocuments({ createdAt: { $gte: startDate } }),
        Offer.countDocuments({ createdAt: { $gte: startDate } }),
        Payment.countDocuments({ 
          status: 'completed', 
          updatedAt: { $gte: startDate } 
        }),
        Payment.aggregate([
          { $match: { status: 'completed', updatedAt: { $gte: startDate } } },
          { $group: { _id: null, total: { $sum: '$platformFee' } } }
        ]),
        Review.aggregate([
          { $group: { _id: null, average: { $avg: '$rating' } } }
        ])
      ]);

      const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
      const avgRating = averageRating.length > 0 ? averageRating[0].average : 0;

      return {
        period,
        startDate,
        endDate: now,
        statistics: {
          newUsers,
          newServiceRequests,
          newOffers,
          completedPayments,
          totalRevenue: revenue,
          averageRating: Math.round(avgRating * 10) / 10
        }
      };
    } catch (error) {
      logger.error(`Error getting platform stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated users list
   */
  async getAllUsers(filters = {}) {
    try {
      const {
        role,
        status,
        verification,
        search,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting all users with filters:`, filters);

      let query = {};

      // Apply filters
      if (role) {
        query.role = role;
      }

      if (status === 'active') {
        query.isBlocked = false;
      } else if (status === 'blocked') {
        query.isBlocked = true;
      }

      if (verification) {
        query.verificationStatus = verification;
      }

      if (search) {
        query.$or = [
          { 'name.first': { $regex: search, $options: 'i' } },
          { 'name.last': { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [users, total] = await Promise.all([
        User.find(query)
          .select('name email phone role verificationStatus isBlocked createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting all users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed user information
   * @param {string} userId - User ID
   * @returns {Object} User details with activity history
   */
  async getUserDetails(userId) {
    try {
      logger.info(`Getting user details for: ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user activity
      const [serviceRequests, offers, payments, reviews] = await Promise.all([
        ServiceRequest.find({ seekerId: userId }).sort({ createdAt: -1 }).limit(10),
        Offer.find({ providerId: userId }).sort({ createdAt: -1 }).limit(10),
        Payment.find({ 
          $or: [{ seekerId: userId }, { providerId: userId }] 
        }).sort({ createdAt: -1 }).limit(10),
        Review.find({ 
          $or: [{ seekerId: userId }, { providerId: userId }] 
        }).sort({ createdAt: -1 }).limit(10)
      ]);

      return {
        user,
        activity: {
          serviceRequests,
          offers,
          payments,
          reviews
        }
      };
    } catch (error) {
      logger.error(`Error getting user details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user information
   */
  async updateUser(userId, updateData) {
    try {
      logger.info(`Updating user: ${userId}`);

      const allowedUpdates = ['name', 'phone', 'isActive'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Block a user
   * @param {string} userId - User ID
   * @param {string} reason - Block reason
   * @param {string} adminId - Admin ID
   * @returns {Object} Block confirmation
   */
  async blockUser(userId, reason, adminId) {
    try {
      logger.info(`Admin ${adminId} blocking user: ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isBlocked) {
        throw new Error('User is already blocked');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: adminId,
          blockReason: reason
        },
        { new: true }
      );

      return updatedUser;
    } catch (error) {
      logger.error(`Error blocking user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unblock a user
   * @param {string} userId - User ID
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

      return updatedUser;
    } catch (error) {
      logger.error(`Error unblocking user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get service requests with filtering
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated service requests
   */
  async getServiceRequests(filters = {}) {
    try {
      const {
        status,
        category,
        urgency,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting service requests with filters:`, filters);

      let query = {};

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (urgency) {
        query.urgency = urgency;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [serviceRequests, total] = await Promise.all([
        ServiceRequest.find(query)
          .populate('seekerId', 'name email')
          .populate('assignedTo', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ServiceRequest.countDocuments(query)
      ]);

      return {
        serviceRequests,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting service requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get offers with filtering
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated offers
   */
  async getOffers(filters = {}) {
    try {
      const {
        status,
        category,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting offers with filters:`, filters);

      let query = {};

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (category) {
        query['requestId.category'] = category;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [offers, total] = await Promise.all([
        Offer.find(query)
          .populate('providerId', 'name email')
          .populate('requestId', 'category subcategory description')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Offer.countDocuments(query)
      ]);

      return {
        offers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting offers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payments with filtering
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated payments
   */
  async getPayments(filters = {}) {
    try {
      const {
        status,
        paymentMethod,
        period,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting payments with filters:`, filters);

      let query = {};

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }

      if (period) {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        query.createdAt = { $gte: startDate };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [payments, total] = await Promise.all([
        Payment.find(query)
          .populate('seekerId', 'name email')
          .populate('providerId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Payment.countDocuments(query)
      ]);

      return {
        payments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting payments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews with filtering
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated reviews
   */
  async getReviews(filters = {}) {
    try {
      const {
        rating,
        isVerified,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting reviews with filters:`, filters);

      let query = {};

      // Apply filters
      if (rating) {
        query.rating = parseInt(rating);
      }

      if (isVerified !== undefined) {
        query.isVerified = isVerified;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('seekerId', 'name email')
          .populate('providerId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments(query)
      ]);

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get notifications with filtering
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated notifications
   */
  async getNotifications(filters = {}) {
    try {
      const {
        type,
        isRead,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting notifications with filters:`, filters);

      let query = {};

      // Apply filters
      if (type) {
        query.type = type;
      }

      if (isRead !== undefined) {
        query.isRead = isRead;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query)
      ]);

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent activity
   * @param {Object} filters - Filter options
   * @returns {Object} Recent activity log
   */
  async getRecentActivity(filters = {}) {
    try {
      const { type, limit = 50 } = filters;
      
      logger.info(`Getting recent activity with filters:`, filters);

      // This is a simplified activity log
      // In a production system, you would have a dedicated Activity model
      const activities = [];

      // Get recent user registrations
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email role createdAt');

      recentUsers.forEach(user => {
        activities.push({
          type: 'user_registration',
          user: user.name,
          email: user.email,
          role: user.role,
          timestamp: user.createdAt
        });
      });

      // Get recent service requests
      const recentRequests = await ServiceRequest.find()
        .populate('seekerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);

      recentRequests.forEach(request => {
        activities.push({
          type: 'service_request',
          user: request.seekerId.name,
          category: request.category,
          timestamp: request.createdAt
        });
      });

      // Sort activities by timestamp
      activities.sort((a, b) => b.timestamp - a.timestamp);

      return {
        activities: activities.slice(0, limit),
        total: activities.length
      };
    } catch (error) {
      logger.error(`Error getting recent activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification to users
   * @param {Object} notificationData - Notification data
   * @returns {Object} Notification sending confirmation
   */
  async sendNotification(notificationData) {
    try {
      const { userIds, title, message, type = 'admin' } = notificationData;
      
      logger.info(`Sending notification to ${userIds.length} users`);

      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        isRead: false
      }));

      await Notification.insertMany(notifications);

      return {
        message: `Notification sent to ${userIds.length} users`,
        sentCount: userIds.length
      };
    } catch (error) {
      logger.error(`Error sending notification: ${error.message}`);
      throw error;
    }
  }
}

export default new AdminService(); 
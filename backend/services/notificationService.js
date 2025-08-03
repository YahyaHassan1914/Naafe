import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logger } from '../middlewares/logging.middleware.js';

class NotificationService {
  /**
   * Get user's notifications with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated notifications
   */
  async getNotifications(userId, filters = {}) {
    try {
      const {
        type,
        isRead,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting notifications for user: ${userId}`);

      let query = { userId };

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
   * Get count of unread notifications
   * @param {string} userId - User ID
   * @returns {Object} Unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false
      });

      return { unreadCount: count };
    } catch (error) {
      logger.error(`Error getting unread count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific notification by ID
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Notification details
   */
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error(`Error getting notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Object} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId: userId
        },
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      logger.info(`Notification marked as read: ${notificationId}`);
      return notification;
    } catch (error) {
      logger.error(`Error marking notification as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark a notification as unread
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Object} Updated notification
   */
  async markAsUnread(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId: userId
        },
        {
          isRead: false,
          $unset: { readAt: 1 }
        },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      logger.info(`Notification marked as unread: ${notificationId}`);
      return notification;
    } catch (error) {
      logger.error(`Error marking notification as unread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Object} Update confirmation
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        {
          userId: userId,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      logger.info(`All notifications marked as read for user: ${userId}`);
      return {
        message: 'All notifications marked as read',
        updatedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error(`Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Object} Deletion confirmation
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      logger.info(`Notification deleted: ${notificationId}`);
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all read notifications
   * @param {string} userId - User ID
   * @returns {Object} Deletion confirmation
   */
  async clearReadNotifications(userId) {
    try {
      const result = await Notification.deleteMany({
        userId: userId,
        isRead: true
      });

      logger.info(`Read notifications cleared for user: ${userId}`);
      return {
        message: 'Read notifications cleared successfully',
        deletedCount: result.deletedCount
      };
    } catch (error) {
      logger.error(`Error clearing read notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update notification settings
   * @param {string} userId - User ID
   * @param {Object} settings - Notification settings
   * @returns {Object} Updated settings
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update notification settings in user profile
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          'notificationSettings': {
            ...user.notificationSettings,
            ...settings
          }
        },
        { new: true }
      );

      logger.info(`Notification settings updated for user: ${userId}`);
      return {
        notificationSettings: updatedUser.notificationSettings
      };
    } catch (error) {
      logger.error(`Error updating notification settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's notification settings
   * @param {string} userId - User ID
   * @returns {Object} Notification settings
   */
  async getNotificationSettings(userId) {
    try {
      const user = await User.findById(userId).select('notificationSettings');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        notificationSettings: user.notificationSettings || {}
      };
    } catch (error) {
      logger.error(`Error getting notification settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a notification
   * @param {Object} notificationData - Notification data
   * @returns {Object} Created notification
   */
  async createNotification(notificationData) {
    try {
      const notification = new Notification({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        isRead: false,
        priority: notificationData.priority || 'normal',
        channels: notificationData.channels || ['in_app']
      });

      await notification.save();
      logger.info(`Notification created: ${notification._id}`);

      return notification;
    } catch (error) {
      logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create multiple notifications
   * @param {Array} notificationsData - Array of notification data
   * @returns {Object} Created notifications
   */
  async createMultipleNotifications(notificationsData) {
    try {
      const notifications = notificationsData.map(data => ({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        isRead: false,
        priority: data.priority || 'normal',
        channels: data.channels || ['in_app']
      }));

      const createdNotifications = await Notification.insertMany(notifications);
      logger.info(`Created ${createdNotifications.length} notifications`);

      return {
        notifications: createdNotifications,
        count: createdNotifications.length
      };
    } catch (error) {
      logger.error(`Error creating multiple notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   * @returns {Object} Send confirmation
   */
  async sendToMultipleUsers(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        isRead: false,
        priority: notificationData.priority || 'normal',
        channels: notificationData.channels || ['in_app']
      }));

      await Notification.insertMany(notifications);
      logger.info(`Notifications sent to ${userIds.length} users`);

      return {
        message: `Notifications sent to ${userIds.length} users`,
        sentCount: userIds.length
      };
    } catch (error) {
      logger.error(`Error sending notifications to multiple users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} Notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const [
        totalNotifications,
        unreadNotifications,
        readNotifications,
        notificationsByType
      ] = await Promise.all([
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false }),
        Notification.countDocuments({ userId, isRead: true }),
        Notification.aggregate([
          { $match: { userId: userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);

      const typeDistribution = {};
      notificationsByType.forEach(item => {
        typeDistribution[item._id] = item.count;
      });

      return {
        total: totalNotifications,
        unread: unreadNotifications,
        read: readNotifications,
        typeDistribution
      };
    } catch (error) {
      logger.error(`Error getting notification stats: ${error.message}`);
      throw error;
    }
  }
}

export default new NotificationService(); 
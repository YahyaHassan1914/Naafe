import { api, ApiResponse, PaginatedResponse } from './api';

// Types for notification data
export interface Notification {
  _id: string;
  userId: string;
  type: 'system' | 'offer' | 'payment' | 'admin' | 'verification' | 'review' | 'service_request';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: Array<'in_app' | 'email' | 'sms' | 'whatsapp' | 'push'>;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  type?: Notification['type'];
  isRead?: boolean;
  priority?: Notification['priority'];
  page?: number;
  limit?: number;
}

export interface NotificationSettings {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  types: {
    system: boolean;
    offer: boolean;
    payment: boolean;
    admin: boolean;
    verification: boolean;
    review: boolean;
    service_request: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<Notification['type'], number>;
  byPriority: Record<Notification['priority'], number>;
}

// Notification service functions
export const notificationService = {
  /**
   * Get user's notifications with filtering and pagination
   */
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    return api.notifications.getAll(filters);
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return api.notifications.getUnreadCount();
  },

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<ApiResponse<Notification>> {
    return api.notifications.getById(notificationId);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return api.notifications.markAsRead(notificationId);
  },

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<ApiResponse<Notification>> {
    return api.notifications.markAsUnread(notificationId);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return api.notifications.markAllAsRead();
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return api.notifications.delete(notificationId);
  },

  /**
   * Clear all read notifications
   */
  async clearReadNotifications(): Promise<ApiResponse<void>> {
    return api.notifications.clearRead();
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return api.notifications.getSettings();
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<ApiResponse<NotificationSettings>> {
    return api.notifications.updateSettings(settings);
  },

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        this.getNotifications({ limit: 1000 }),
        this.getUnreadCount()
      ]);

      if (!notificationsResponse.success || !notificationsResponse.data) {
        throw new Error('Failed to fetch notification data');
      }

      const notifications = notificationsResponse.data.data;
      const unreadCount = unreadResponse.success ? unreadResponse.data?.count || 0 : 0;

      // Calculate statistics
      const byType: Record<Notification['type'], number> = {
        system: 0,
        offer: 0,
        payment: 0,
        admin: 0,
        verification: 0,
        review: 0,
        service_request: 0
      };

      const byPriority: Record<Notification['priority'], number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      };

      notifications.forEach(notification => {
        byType[notification.type]++;
        byPriority[notification.priority]++;
      });

      return {
        total: notifications.length,
        unread: unreadCount,
        read: notifications.length - unreadCount,
        byType,
        byPriority
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        byType: {
          system: 0,
          offer: 0,
          payment: 0,
          admin: 0,
          verification: 0,
          review: 0,
          service_request: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
      };
    }
  },

  /**
   * Get type display name
   */
  getTypeName(type: Notification['type']): string {
    const typeNames: Record<Notification['type'], string> = {
      system: 'النظام',
      offer: 'عرض',
      payment: 'دفع',
      admin: 'إدارة',
      verification: 'تحقق',
      review: 'تقييم',
      service_request: 'طلب خدمة'
    };
    return typeNames[type] || type;
  },

  /**
   * Get priority display name
   */
  getPriorityName(priority: Notification['priority']): string {
    const priorityNames: Record<Notification['priority'], string> = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل'
    };
    return priorityNames[priority] || priority;
  },

  /**
   * Get priority color for UI
   */
  getPriorityColor(priority: Notification['priority']): string {
    const priorityColors: Record<Notification['priority'], string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Get priority icon
   */
  getPriorityIcon(priority: Notification['priority']): string {
    const priorityIcons: Record<Notification['priority'], string> = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };
    return priorityIcons[priority] || '🔵';
  },

  /**
   * Format notification time
   */
  formatTime(notification: Notification): string {
    const now = new Date();
    const createdAt = new Date(notification.createdAt);
    const diff = now.getTime() - createdAt.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
      return 'الآن';
    } else if (minutes < 60) {
      return `منذ ${minutes} دقيقة`;
    } else if (hours < 24) {
      return `منذ ${hours} ساعة`;
    } else if (days < 7) {
      return `منذ ${days} يوم`;
    } else {
      return createdAt.toLocaleDateString('ar-EG');
    }
  },

  /**
   * Check if notification is recent (within last 24 hours)
   */
  isRecent(notification: Notification): boolean {
    const now = new Date();
    const createdAt = new Date(notification.createdAt);
    const diff = now.getTime() - createdAt.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  },

  /**
   * Get notification action based on type
   */
  getNotificationAction(notification: Notification): {
    action: string;
    url?: string;
    onClick?: () => void;
  } {
    switch (notification.type) {
      case 'offer':
        return {
          action: 'عرض التفاصيل',
          url: `/offers/${notification.data?.offerId}`
        };
      case 'payment':
        return {
          action: 'عرض الدفع',
          url: `/payments/${notification.data?.paymentId}`
        };
      case 'service_request':
        return {
          action: 'عرض الطلب',
          url: `/requests/${notification.data?.requestId}`
        };
      case 'review':
        return {
          action: 'عرض التقييم',
          url: `/reviews/${notification.data?.reviewId}`
        };
      case 'verification':
        return {
          action: 'عرض التحقق',
          url: '/verification'
        };
      default:
        return {
          action: 'عرض التفاصيل'
        };
    }
  },

  /**
   * Subscribe to real-time notifications using Socket.IO
   */
  subscribeToNotifications(socket: any, userId: string): void {
    if (!socket) return;

    // Join user's notification room
    socket.emit('join-notifications', { userId });

    // Listen for new notifications
    socket.on('notify:newNotification', (data: { notification: Notification }) => {
      // Handle new notification (e.g., show toast, update unread count)
      console.log('New notification received:', data.notification);
    });

    // Listen for notification updates
    socket.on('notify:notificationUpdated', (data: { notification: Notification }) => {
      // Handle notification update
      console.log('Notification updated:', data.notification);
    });
  },

  /**
   * Unsubscribe from real-time notifications
   */
  unsubscribeFromNotifications(socket: any, userId: string): void {
    if (!socket) return;

    socket.emit('leave-notifications', { userId });
    socket.off('notify:newNotification');
    socket.off('notify:notificationUpdated');
  },

  /**
   * Create a local notification (for testing or offline scenarios)
   */
  createLocalNotification(
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: Notification['priority'] = 'medium'
  ): Notification {
    return {
      _id: `local_${Date.now()}`,
      userId: 'current_user',
      type,
      title,
      message,
      data,
      isRead: false,
      priority,
      channels: ['in_app'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
};

export default notificationService; 
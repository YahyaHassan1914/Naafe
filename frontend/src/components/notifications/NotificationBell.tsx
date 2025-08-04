import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface Notification {
  _id: string;
  type: 'message' | 'offer' | 'payment' | 'review' | 'system' | 'verification';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

interface NotificationBellProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  onNotificationClick
}) => {
  const { user } = useAuth();
  const { connected, on } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // API hooks
  const { data: notificationsData, refetch: refetchNotifications } = useApi('/notifications?limit=10');
  const { mutate: markAsRead } = useApi('/notifications/:id/read', 'PATCH');
  const { mutate: markAllAsRead } = useApi('/notifications/read-all', 'PATCH');

  // Load notifications
  useEffect(() => {
    if (notificationsData?.success) {
      setNotifications(notificationsData.data.notifications || []);
      setUnreadCount(notificationsData.data.unreadCount || 0);
    }
  }, [notificationsData]);

  // Socket listeners for real-time notifications
  useEffect(() => {
    if (!connected) return;

    on('notification', (newNotification: Notification) => {
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      // Cleanup socket listeners if needed
    };
  }, [connected, on]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      refetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead({ id: notification._id });
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'offer':
        return '💰';
      case 'payment':
        return '💳';
      case 'review':
        return '⭐';
      case 'verification':
        return '✅';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  تحديد الكل كمقروء
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                لا توجد إشعارات جديدة
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-gray-600 hover:text-gray-900"
              onClick={() => {
                setIsOpen(false);
                // Navigate to notifications page
                window.location.href = '/notifications';
              }}
            >
              عرض جميع الإشعارات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 
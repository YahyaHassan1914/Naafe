import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../common/LoadingSpinner';

interface NotificationBellProps {
  unreadCount: number;
  isLoading?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  unreadCount, 
  isLoading = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { useNotifications, useMarkAllNotificationsAsRead } = useApi();

  const notificationsQuery = useNotifications({ limit: 5 });
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      notificationsQuery.refetch();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      offer_received: '💼',
      offer_accepted: '✅',
      payment_received: '💰',
      payment_completed: '✅',
      review_received: '⭐',
      verification_approved: '✅',
      verification_rejected: '❌',
      service_completed: '🎉',
      service_cancelled: '❌',
      system: '🔔'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      offer_received: 'text-blue-600 bg-blue-50',
      offer_accepted: 'text-green-600 bg-green-50',
      payment_received: 'text-green-600 bg-green-50',
      payment_completed: 'text-green-600 bg-green-50',
      review_received: 'text-yellow-600 bg-yellow-50',
      verification_approved: 'text-green-600 bg-green-50',
      verification_rejected: 'text-red-600 bg-red-50',
      service_completed: 'text-green-600 bg-green-50',
      service_cancelled: 'text-red-600 bg-red-50',
      system: 'text-gray-600 bg-gray-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-deep-teal focus:ring-offset-2"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a1.5 1.5 0 0 1-1.5 2.25h-13.5a1.5 1.5 0 0 1-1.5-2.25L6 14.25V9.75a6 6 0 0 1 6-6z"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-5 h-5">
            <LoadingSpinner size="sm" variant="primary" />
          </div>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              الإشعارات
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-deep-teal hover:text-teal-700 transition-colors disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? 'جاري...' : 'تحديد الكل كمقروء'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <div className="px-4 py-8 text-center">
                <LoadingSpinner size="md" text="جاري تحميل الإشعارات..." />
              </div>
            ) : notificationsQuery.error ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-secondary">
                  حدث خطأ في تحميل الإشعارات
                </p>
                <button
                  onClick={() => notificationsQuery.refetch()}
                  className="mt-2 text-xs text-deep-teal hover:text-teal-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : notificationsQuery.data?.data?.data?.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm text-text-secondary">
                  لا توجد إشعارات جديدة
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notificationsQuery.data?.data?.data?.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.readAt ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      // Mark as read and navigate
                      setIsOpen(false);
                      // TODO: Implement mark as read functionality
                    }}
                  >
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.readAt && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificationsQuery.data?.data?.data?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <Link
                to="/notifications"
                className="text-sm text-deep-teal hover:text-teal-700 transition-colors text-center block"
                onClick={() => setIsOpen(false)}
              >
                عرض جميع الإشعارات
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 
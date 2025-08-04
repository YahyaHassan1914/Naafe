import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

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

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
  className?: string;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onClick,
  showActions = true,
  className = ''
}) => {
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-50 border-blue-200';
      case 'offer':
        return 'bg-green-50 border-green-200';
      case 'payment':
        return 'bg-purple-50 border-purple-200';
      case 'review':
        return 'bg-yellow-50 border-yellow-200';
      case 'verification':
        return 'bg-emerald-50 border-emerald-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  const handleCardClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      } ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium text-sm ${
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
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(notification.createdAt)}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2">
                {!notification.isRead && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 p-1 h-6"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard; 
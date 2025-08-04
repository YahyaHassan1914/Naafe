import React, { useState, useEffect } from 'react';
import { Filter, Search, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import NotificationCard from './NotificationCard';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
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

interface NotificationListProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
  showFilters?: boolean;
  limit?: number;
}

const NotificationList: React.FC<NotificationListProps> = ({
  className = '',
  onNotificationClick,
  showFilters = true,
  limit = 20
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    isRead: '',
    search: ''
  });

  // API hooks
  const { data: notificationsData, refetch: refetchNotifications } = useApi(
    `/notifications?page=${page}&limit=${limit}&type=${filters.type}&isRead=${filters.isRead}&search=${filters.search}`
  );
  const { mutate: markAsRead } = useApi('/notifications/:id/read', 'PATCH');
  const { mutate: markAllAsRead } = useApi('/notifications/read-all', 'PATCH');

  // Load notifications
  useEffect(() => {
    if (notificationsData?.success) {
      const newNotifications = notificationsData.data.notifications || [];
      if (page === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      setHasMore(newNotifications.length === limit);
    }
  }, [notificationsData, page, limit]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead({ id });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRefresh = () => {
    setPage(1);
    refetchNotifications();
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type && notification.type !== filters.type) return false;
    if (filters.isRead === 'read' && !notification.isRead) return false;
    if (filters.isRead === 'unread' && notification.isRead) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">الإشعارات</h3>
          {getUnreadCount() > 0 && (
            <Badge variant="error" className="text-xs">
              {getUnreadCount()} جديد
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getUnreadCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              تحديد الكل كمقروء
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={loading}
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">تصفية</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <FormInput
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="البحث في الإشعارات..."
                className="w-full"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                النوع
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الأنواع</option>
                <option value="message">رسائل</option>
                <option value="offer">عروض</option>
                <option value="payment">مدفوعات</option>
                <option value="review">تقييمات</option>
                <option value="verification">تحقق</option>
                <option value="system">نظام</option>
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={filters.isRead}
                onChange={(e) => handleFilterChange('isRead', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الإشعارات</option>
                <option value="unread">غير مقروء</option>
                <option value="read">مقروء</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ type: '', isRead: '', search: '' });
                  setPage(1);
                }}
                className="w-full"
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-3">
        {loading && page === 1 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">جاري التحميل...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="mt-2"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">لا توجد إشعارات</p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={onNotificationClick}
              />
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  loading={loading && page > 1}
                >
                  تحميل المزيد
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationList; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { NotificationList, NotificationSettings } from '../../components/notifications';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

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

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.relatedId) {
          navigate(`/chat/${notification.relatedId}`);
        }
        break;
      case 'offer':
        if (notification.relatedId) {
          navigate(`/offers/${notification.relatedId}`);
        }
        break;
      case 'payment':
        navigate('/payments');
        break;
      case 'review':
        if (notification.relatedId) {
          navigate(`/reviews/${notification.relatedId}`);
        }
        break;
      case 'verification':
        navigate('/verification');
        break;
      default:
        // For system notifications, just mark as read
        break;
    }
  };

  const handleSettingsSave = () => {
    showSuccess('تم حفظ إعدادات الإشعارات بنجاح');
    setShowSettings(false);
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
                <p className="text-sm text-gray-500">إدارة إشعاراتك وتفضيلاتك</p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {showSettings ? (
            <NotificationSettings onSave={handleSettingsSave} />
          ) : (
            <NotificationList
              onNotificationClick={handleNotificationClick}
              showFilters={true}
              limit={20}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default NotificationsPage; 
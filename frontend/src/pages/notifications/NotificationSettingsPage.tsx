import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { NotificationSettings } from '../../components/notifications';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSettingsSave = () => {
    showSuccess('تم حفظ إعدادات الإشعارات بنجاح');
    navigate('/notifications');
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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
              <h1 className="text-2xl font-bold text-gray-900">إعدادات الإشعارات</h1>
              <p className="text-sm text-gray-500">تحكم في كيفية استلام الإشعارات</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <NotificationSettings onSave={handleSettingsSave} />
      </div>
    </PageLayout>
  );
};

export default NotificationSettingsPage; 
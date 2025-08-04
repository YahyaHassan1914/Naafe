import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, CreditCard, Star, CheckCircle, Settings, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationSettingsProps {
  className?: string;
  onSave?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  onSave
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // API hooks
  const { data: settingsData, refetch: refetchSettings } = useApi('/notifications/settings');
  const { mutate: updateSettings } = useApi('/notifications/settings', 'PUT');

  const defaultPreferences: NotificationPreference[] = [
    {
      type: 'message',
      label: 'رسائل جديدة',
      description: 'عندما تتلقى رسالة جديدة من مقدم خدمة أو طالب',
      icon: MessageCircle,
      email: true,
      push: true,
      inApp: true
    },
    {
      type: 'offer',
      label: 'عروض جديدة',
      description: 'عندما يتلقى طلبك عرضاً جديداً',
      icon: CreditCard,
      email: true,
      push: true,
      inApp: true
    },
    {
      type: 'payment',
      label: 'المدفوعات',
      description: 'تحديثات حول المدفوعات والمعاملات',
      icon: CreditCard,
      email: true,
      push: false,
      inApp: true
    },
    {
      type: 'review',
      label: 'التقييمات',
      description: 'عندما تتلقى تقييماً جديداً',
      icon: Star,
      email: true,
      push: true,
      inApp: true
    },
    {
      type: 'verification',
      label: 'التحقق من الهوية',
      description: 'تحديثات حول حالة التحقق من هويتك',
      icon: CheckCircle,
      email: true,
      push: true,
      inApp: true
    },
    {
      type: 'system',
      label: 'إشعارات النظام',
      description: 'إشعارات مهمة من النظام',
      icon: Settings,
      email: true,
      push: false,
      inApp: true
    }
  ];

  // Load settings
  useEffect(() => {
    if (settingsData?.success) {
      const savedSettings = settingsData.data.preferences || {};
      setPreferences(
        defaultPreferences.map(pref => ({
          ...pref,
          ...savedSettings[pref.type]
        }))
      );
    } else {
      setPreferences(defaultPreferences);
    }
  }, [settingsData]);

  const handlePreferenceChange = (type: string, channel: 'email' | 'push' | 'inApp', value: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.type === type ? { ...pref, [channel]: value } : pref
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const settingsObject = preferences.reduce((acc, pref) => {
        acc[pref.type] = {
          email: pref.email,
          push: pref.push,
          inApp: pref.inApp
        };
        return acc;
      }, {} as Record<string, any>);

      await updateSettings({ preferences: settingsObject });
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">إعدادات الإشعارات</h2>
          <p className="text-sm text-gray-500">تحكم في كيفية استلام الإشعارات</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">قنوات الإشعارات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">الإشعارات في التطبيق</p>
                <p className="text-xs text-gray-500">إشعارات فورية</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">البريد الإلكتروني</p>
                <p className="text-xs text-gray-500">ملخص يومي</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">إشعارات الدفع</p>
                <p className="text-xs text-gray-500">مهمة فقط</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">أنواع الإشعارات</h3>
          <div className="space-y-4">
            {preferences.map((preference) => {
              const IconComponent = preference.icon;
              return (
                <div key={preference.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{preference.label}</h4>
                          <p className="text-sm text-gray-500">{preference.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={preference.inApp}
                            onChange={(e) => handlePreferenceChange(preference.type, 'inApp', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">في التطبيق</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={preference.email}
                            onChange={(e) => handlePreferenceChange(preference.type, 'email', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">البريد الإلكتروني</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={preference.push}
                            onChange={(e) => handlePreferenceChange(preference.type, 'push', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">إشعارات الدفع</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            className="flex-1"
          >
            <Save className="w-4 h-4 ml-2" />
            حفظ الإعدادات
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            إعادة تعيين
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 
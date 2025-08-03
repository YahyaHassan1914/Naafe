import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import { authService } from '../../services';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { useNotificationSettings, useUpdateNotificationSettings } = useApi();
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'security' | 'account'>('notifications');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const notificationSettingsQuery = useNotificationSettings();
  const updateNotificationSettingsMutation = useUpdateNotificationSettings();

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    offerReceived: true,
    offerAccepted: true,
    paymentReceived: true,
    paymentCompleted: true,
    reviewReceived: true,
    verificationStatus: true,
    systemUpdates: true,
    marketing: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showPhone: false,
    showEmail: false,
    showLocation: true,
    allowMessages: true,
    allowReviews: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: 30
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePrivacyChange = (setting: string, value: string | boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSecurityChange = (setting: string, value: boolean | number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'كلمة المرور الحالية مطلوبة';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('تم تغيير كلمة المرور بنجاح');
    } catch (error: any) {
      alert(error?.message || 'فشل في تغيير كلمة المرور');
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await updateNotificationSettingsMutation.mutateAsync(notificationSettings);
      alert('تم حفظ إعدادات الإشعارات بنجاح');
    } catch (error) {
      alert('فشل في حفظ إعدادات الإشعارات');
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      // TODO: Implement account deletion API call
      await logout();
      alert('تم حذف الحساب بنجاح');
    } catch (error) {
      alert('فشل في حذف الحساب');
      setShowDeleteConfirm(false);
    }
  };

  const tabs = [
    { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
    { id: 'privacy', label: 'الخصوصية', icon: '🔒' },
    { id: 'security', label: 'الأمان', icon: '🛡️' },
    { id: 'account', label: 'الحساب', icon: '👤' }
  ] as const;

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            الإعدادات
          </h1>
          <p className="text-text-secondary">
            إدارة إعدادات حسابك وتفضيلاتك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-deep-teal bg-teal-50'
                        : 'text-text-secondary hover:text-deep-teal hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-text-primary">
                    إعدادات الإشعارات
                  </h2>
                  <p className="text-text-secondary mt-1">
                    اختر كيف تريد استلام الإشعارات
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Notification Channels */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      قنوات الإشعارات
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email}
                          onChange={(e) => handleNotificationChange('email', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">البريد الإلكتروني</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.push}
                          onChange={(e) => handleNotificationChange('push', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">إشعارات الموقع</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.sms}
                          onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">رسائل SMS</span>
                      </label>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      أنواع الإشعارات
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.offerReceived}
                          onChange={(e) => handleNotificationChange('offerReceived', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">عروض جديدة</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.offerAccepted}
                          onChange={(e) => handleNotificationChange('offerAccepted', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">قبول العروض</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.paymentReceived}
                          onChange={(e) => handleNotificationChange('paymentReceived', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">استلام المدفوعات</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.paymentCompleted}
                          onChange={(e) => handleNotificationChange('paymentCompleted', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">اكتمال المدفوعات</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.reviewReceived}
                          onChange={(e) => handleNotificationChange('reviewReceived', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">التقييمات الجديدة</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={notificationSettings.verificationStatus}
                          onChange={(e) => handleNotificationChange('verificationStatus', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">حالة التحقق</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      variant="primary"
                      onClick={handleSaveNotificationSettings}
                      disabled={updateNotificationSettingsMutation.isPending}
                    >
                      {updateNotificationSettingsMutation.isPending ? (
                        <div className="flex items-center">
                          <LoadingSpinner size="sm" variant="white" className="mr-2" />
                          حفظ...
                        </div>
                      ) : (
                        'حفظ الإعدادات'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-text-primary">
                    إعدادات الخصوصية
                  </h2>
                  <p className="text-text-secondary mt-1">
                    تحكم في من يمكنه رؤية معلوماتك
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      رؤية الملف الشخصي
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          رؤية الملف الشخصي
                        </label>
                        <select
                          value={privacySettings.profileVisibility}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                        >
                          <option value="public">عام</option>
                          <option value="private">خاص</option>
                          <option value="contacts">جهات الاتصال فقط</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      المعلومات المرئية
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={privacySettings.showPhone}
                          onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">إظهار رقم الهاتف</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={privacySettings.showEmail}
                          onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">إظهار البريد الإلكتروني</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={privacySettings.showLocation}
                          onChange={(e) => handlePrivacyChange('showLocation', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">إظهار الموقع</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      التفاعل
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={privacySettings.allowMessages}
                          onChange={(e) => handlePrivacyChange('allowMessages', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">السماح بالرسائل</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={privacySettings.allowReviews}
                          onChange={(e) => handlePrivacyChange('allowReviews', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">السماح بالتقييمات</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-text-primary">
                    إعدادات الأمان
                  </h2>
                  <p className="text-text-secondary mt-1">
                    حماية حسابك وتأمين معلوماتك
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Change Password */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      تغيير كلمة المرور
                    </h3>
                    <div className="space-y-4">
                      <FormInput
                        label="كلمة المرور الحالية"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(value) => handlePasswordChange('currentPassword', value)}
                        error={errors.currentPassword}
                        placeholder="كلمة المرور الحالية"
                      />
                      
                      <FormInput
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(value) => handlePasswordChange('newPassword', value)}
                        error={errors.newPassword}
                        placeholder="كلمة المرور الجديدة"
                      />
                      
                      <FormInput
                        label="تأكيد كلمة المرور"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(value) => handlePasswordChange('confirmPassword', value)}
                        error={errors.confirmPassword}
                        placeholder="تأكيد كلمة المرور"
                      />
                      
                      <Button
                        variant="primary"
                        onClick={handleChangePassword}
                      >
                        تغيير كلمة المرور
                      </Button>
                    </div>
                  </div>

                  {/* Security Options */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      خيارات الأمان
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorAuth}
                          onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">المصادقة الثنائية</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={securitySettings.loginNotifications}
                          onChange={(e) => handleSecurityChange('loginNotifications', e.target.checked)}
                          className="h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
                        />
                        <span className="text-text-primary">إشعارات تسجيل الدخول</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-text-primary">
                    إدارة الحساب
                  </h2>
                  <p className="text-text-secondary mt-1">
                    إدارة إعدادات حسابك
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      معلومات الحساب
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          نوع الحساب
                        </label>
                        <p className="text-text-primary">
                          {user?.role === 'seeker' ? 'مستفيد' : user?.role === 'provider' ? 'مزود خدمة' : 'مدير'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          تاريخ الإنشاء
                        </label>
                        <p className="text-text-primary">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">
                      إجراءات الحساب
                    </h3>
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Export data */}}
                      >
                        <span className="mr-2">📤</span>
                        تصدير بياناتي
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Deactivate account */}}
                      >
                        <span className="mr-2">⏸️</span>
                        إيقاف الحساب مؤقتاً
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDeleteAccount}
                      >
                        <span className="mr-2">🗑️</span>
                        {showDeleteConfirm ? 'تأكيد حذف الحساب' : 'حذف الحساب'}
                      </Button>
                    </div>
                  </div>

                  {showDeleteConfirm && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-red-800 font-medium mb-2">
                        ⚠️ تحذير: حذف الحساب نهائياً
                      </h4>
                      <p className="text-red-700 text-sm mb-4">
                        هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.
                      </p>
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          إلغاء
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleDeleteAccount}
                        >
                          تأكيد الحذف
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage; 
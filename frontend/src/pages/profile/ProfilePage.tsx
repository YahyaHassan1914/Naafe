import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import { authService } from '../../services';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { useProfile, useUpdateProfile } = useApi();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: {
      governorate: user?.location?.governorate || '',
      city: user?.location?.city || ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationChange = (field: 'governorate' | 'city', value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'الاسم الأول مطلوب';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'الاسم الأخير مطلوب';
    }

    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.phone) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^(\+20|0)?1[0125][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase(),
        phone: formData.phone.replace(/\s/g, ''),
        bio: formData.bio.trim(),
        location: formData.location
      });

      if (updatedUser) {
        updateUser(updatedUser);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: {
        governorate: user?.location?.governorate || '',
        city: user?.location?.city || ''
      }
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('يجب اختيار ملف صورة');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const updatedUser = await authService.uploadAvatar(file, (progress) => {
        setUploadProgress(progress);
      });

      if (updatedUser) {
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getRoleName = (role: string) => {
    const roleNames = {
      seeker: 'مستفيد',
      provider: 'مزود خدمة',
      admin: 'مدير'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getVerificationStatusName = (status: string) => {
    const statusNames = {
      unverified: 'غير محقق',
      basic: 'تحقق أساسي',
      verified: 'محقق',
      rejected: 'مرفوض'
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getVerificationStatusColor = (status: string) => {
    const colors = {
      unverified: 'text-gray-600 bg-gray-100',
      basic: 'text-yellow-600 bg-yellow-100',
      verified: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('20')) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
    } else if (digits.startsWith('0')) {
      return `+20 ${digits.slice(1, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    } else if (digits.startsWith('1')) {
      return `+20 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }
    return phone;
  };

  if (profileQuery.isLoading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="text-center">
            <LoadingSpinner size="lg" text="جاري تحميل الملف الشخصي..." />
          </div>
        </div>
      </Layout>
    );
  }

  if (profileQuery.error) {
    return (
      <Layout>
        <div className="py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              حدث خطأ في تحميل الملف الشخصي
            </h2>
            <p className="text-text-secondary mb-4">
              {profileQuery.error.message || 'حدث خطأ غير متوقع'}
            </p>
            <Button
              variant="outline"
              onClick={() => profileQuery.refetch()}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const profileData = profileQuery.data?.data || user;

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            الملف الشخصي
          </h1>
          <p className="text-text-secondary">
            إدارة معلوماتك الشخصية وإعدادات الحساب
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text-primary">
                    المعلومات الشخصية
                  </h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      تعديل
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="الاسم الأول"
                        type="text"
                        value={formData.firstName}
                        onChange={(value) => handleInputChange('firstName', value)}
                        error={errors.firstName}
                        placeholder="الاسم الأول"
                        required
                      />
                      
                      <FormInput
                        label="الاسم الأخير"
                        type="text"
                        value={formData.lastName}
                        onChange={(value) => handleInputChange('lastName', value)}
                        error={errors.lastName}
                        placeholder="الاسم الأخير"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="البريد الإلكتروني"
                        type="email"
                        value={formData.email}
                        onChange={(value) => handleInputChange('email', value)}
                        error={errors.email}
                        placeholder="البريد الإلكتروني"
                        required
                      />
                      
                      <FormInput
                        label="رقم الهاتف"
                        type="tel"
                        value={formData.phone}
                        onChange={(value) => handleInputChange('phone', value)}
                        error={errors.phone}
                        placeholder="+20 123 4567 890"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="المحافظة"
                        type="text"
                        value={formData.location.governorate}
                        onChange={(value) => handleLocationChange('governorate', value)}
                        placeholder="المحافظة"
                      />
                      
                      <FormInput
                        label="المدينة"
                        type="text"
                        value={formData.location.city}
                        onChange={(value) => handleLocationChange('city', value)}
                        placeholder="المدينة"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        نبذة شخصية
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent resize-none"
                        placeholder="اكتب نبذة مختصرة عن نفسك..."
                      />
                    </div>

                    <div className="flex items-center space-x-4 space-x-reverse">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="flex items-center">
                            <LoadingSpinner size="sm" variant="white" className="mr-2" />
                            حفظ...
                          </div>
                        ) : (
                          'حفظ التغييرات'
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateProfileMutation.isPending}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          الاسم الأول
                        </label>
                        <p className="text-text-primary">{profileData?.firstName || '-'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          الاسم الأخير
                        </label>
                        <p className="text-text-primary">{profileData?.lastName || '-'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          البريد الإلكتروني
                        </label>
                        <p className="text-text-primary">{profileData?.email || '-'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          رقم الهاتف
                        </label>
                        <p className="text-text-primary">
                          {profileData?.phone ? formatPhoneNumber(profileData.phone) : '-'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          المحافظة
                        </label>
                        <p className="text-text-primary">{profileData?.location?.governorate || '-'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          المدينة
                        </label>
                        <p className="text-text-primary">{profileData?.location?.city || '-'}</p>
                      </div>
                    </div>

                    {profileData?.bio && (
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          نبذة شخصية
                        </label>
                        <p className="text-text-primary">{profileData.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                الصورة الشخصية
              </h3>
              
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-deep-teal text-white rounded-full flex items-center justify-center text-4xl font-bold mb-4 mx-auto">
                    {profileData?.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt={`${profileData.firstName} ${profileData.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      profileData?.firstName?.charAt(0) || 'U'
                    )}
                  </div>
                  
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="text-center">
                        <LoadingSpinner size="md" variant="white" />
                        <p className="text-white text-sm mt-2">{uploadProgress.toFixed(0)}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                
                <label
                  htmlFor="avatar-upload"
                  className="inline-block px-4 py-2 bg-deep-teal text-white rounded-lg cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'جاري الرفع...' : 'تغيير الصورة'}
                </label>
                
                <p className="text-xs text-text-secondary mt-2">
                  الحد الأقصى: 5 ميجابايت
                </p>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                معلومات الحساب
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    نوع الحساب
                  </label>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleName(profileData?.role || '')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    حالة التحقق
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor(profileData?.verificationStatus || 'unverified')}`}>
                    {getVerificationStatusName(profileData?.verificationStatus || 'unverified')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    تاريخ الإنشاء
                  </label>
                  <p className="text-text-primary">
                    {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('ar-EG') : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    آخر تحديث
                  </label>
                  <p className="text-text-primary">
                    {profileData?.updatedAt ? new Date(profileData.updatedAt).toLocaleDateString('ar-EG') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                إجراءات سريعة
              </h3>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* TODO: Navigate to settings */}}
                >
                  <span className="mr-2">⚙️</span>
                  الإعدادات
                </Button>
                
                {profileData?.role === 'provider' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {/* TODO: Navigate to verification */}}
                  >
                    <span className="mr-2">✅</span>
                    التحقق من الحساب
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* TODO: Navigate to change password */}}
                >
                  <span className="mr-2">🔒</span>
                  تغيير كلمة المرور
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 
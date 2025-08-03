import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import FormTextarea from '../components/ui/FormTextarea';
import FormSelect from '../components/ui/FormSelect';
import BaseCard from '../components/ui/BaseCard';
import { Save, Eye, Edit, CheckCircle } from 'lucide-react';

interface ProviderProfile {
  category: string;
  subcategory: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  skills: string[];
}

const ProviderProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [profile, setProfile] = useState<ProviderProfile>({
    category: '',
    subcategory: '',
    description: '',
    budgetMin: 0,
    budgetMax: 0,
    availability: {
      days: [],
      timeSlots: []
    },
    skills: []
  });

  // Categories and subcategories (from your existing data)
  const categories = [
    { name: 'صيانة وإصلاح المنازل', subcategories: ['سباكة', 'كهرباء', 'نجارة', 'نقاشة', 'محارة', 'أرضيات', 'جبس بلدي وجبسيوم بورد', 'رخام وجرانيت', 'ألوميتال', 'زجاج وسيكوريت', 'أسترجي', 'تكييفات', 'صيانة أجهزة منزلية', 'صيانة دش'] },
    { name: 'التنظيف المنزلي والمكتبي والفرش', subcategories: ['تنظيف شقق مفروشة', 'تنظيف ما بعد التشطيب', 'جلي وتلميع الأرضيات', 'فرش شقق العرسان', 'تنظيف مكاتب مفروشة'] },
    { name: 'النقل والتحميل', subcategories: ['نقل عفش داخل نفس المدينة', 'نقل بين المحافظات', 'تحميل ورفع عفش وأجهزة'] },
    { name: 'التوصيل وقضاء المشاوير', subcategories: ['توصيل أغراض خاصة أو مشتريات', 'قضاء مشاوير'] },
    { name: 'البستنة والخدمات الخارجية', subcategories: ['تنسيق حدائق', 'زراعة نجيل ونباتات', 'رش مبيدات ومكافحة حشرات', 'تنظيف خزانات', 'تنظيف واجهات وزجاج'] },
    { name: 'التعليم والدروس الخصوصية', subcategories: ['دروس خصوصية في المواد الدراسية', 'دروس تقوية', 'تعليم أطفال', 'تدريبات خاصة أو فردية'] }
  ];

  const days = [
    { value: 'sunday', label: 'الأحد' },
    { value: 'monday', label: 'الاثنين' },
    { value: 'tuesday', label: 'الثلاثاء' },
    { value: 'wednesday', label: 'الأربعاء' },
    { value: 'thursday', label: 'الخميس' },
    { value: 'friday', label: 'الجمعة' },
    { value: 'saturday', label: 'السبت' }
  ];

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/providers/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProfile(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Handle form changes
  const handleChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle availability days
  const handleDayToggle = (day: string) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter(d => d !== day)
          : [...prev.availability.days, day]
      }
    }));
  };

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/providers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setIsEditing(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get selected category's subcategories
  const selectedCategory = categories.find(cat => cat.name === profile.category);
  const subcategories = selectedCategory?.subcategories || [];

  if (loading) {
    return (
      <PageLayout title="الملف الشخصي" user={user}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto"></div>
          <p className="text-gray-600 mt-4">جاري التحميل...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="الملف الشخصي" user={user}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الملف الشخصي</h1>
            <p className="text-gray-600">إدارة معلومات الخدمة التي تقدمها</p>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => navigate('/search?intent=need-service')}
                >
                  عرض البطاقة
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => setIsEditing(true)}
                >
                  تعديل
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  loading={saving}
                >
                  حفظ
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <BaseCard className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <FormSelect
              label="الفئة الرئيسية"
              value={profile.category}
              onChange={(value) => handleChange('category', value)}
              options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
              disabled={!isEditing}
              required
            />

            {/* Subcategory */}
            <FormSelect
              label="التخصص"
              value={profile.subcategory}
              onChange={(value) => handleChange('subcategory', value)}
              options={subcategories.map(sub => ({ value: sub, label: sub }))}
              disabled={!isEditing || !profile.category}
              required
            />

            {/* Description */}
            <div className="md:col-span-2">
              <FormTextarea
                label="وصف الخدمة"
                value={profile.description}
                onChange={(value) => handleChange('description', value)}
                placeholder="اكتب وصفاً مختصراً للخدمة التي تقدمها..."
                disabled={!isEditing}
                rows={3}
                required
              />
            </div>

            {/* Budget */}
            <FormInput
              label="الحد الأدنى للسعر (جنيه)"
              type="number"
              value={profile.budgetMin}
              onChange={(value) => handleChange('budgetMin', parseInt(value) || 0)}
              disabled={!isEditing}
              required
            />

            <FormInput
              label="الحد الأقصى للسعر (جنيه)"
              type="number"
              value={profile.budgetMax}
              onChange={(value) => handleChange('budgetMax', parseInt(value) || 0)}
              disabled={!isEditing}
              required
            />

            {/* Availability */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                أيام التوفر
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {days.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      profile.availability.days.includes(day.value)
                        ? 'border-deep-teal bg-deep-teal/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.availability.days.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <CheckCircle
                      className={`w-5 h-5 mr-2 ${
                        profile.availability.days.includes(day.value)
                          ? 'text-deep-teal'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Preview Card */}
        <BaseCard>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">معاينة البطاقة</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <img
                src={user?.avatarUrl || '/default-avatar.png'}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="flex-1">
                <h4 className="text-base font-bold text-deep-teal">
                  {user?.name?.first} {user?.name?.last}
                </h4>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-soft-teal/20 text-deep-teal px-2 py-0.5 rounded-md text-xs font-medium">
                    {profile.category}
                  </span>
                </div>
              </div>
            </div>

            {profile.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {profile.description}
              </p>
            )}

            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-semibold">
                  {profile.budgetMin && profile.budgetMax 
                    ? `${profile.budgetMin} - ${profile.budgetMax} جنيه`
                    : 'سعر متغير'
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  متاح: {profile.availability.days.length > 0 
                    ? profile.availability.days.map(day => 
                        days.find(d => d.value === day)?.label
                      ).join('، ')
                    : 'حسب الطلب'
                  }
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">عرض التفاصيل</Button>
              <Button variant="primary" size="sm">تواصل</Button>
            </div>
          </div>
        </BaseCard>
      </div>
    </PageLayout>
  );
};

export default ProviderProfilePage; 
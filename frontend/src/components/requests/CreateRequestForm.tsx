import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormTextarea from '../ui/FormTextarea';
import LoadingSpinner from '../common/LoadingSpinner';
import ImageUpload from './ImageUpload';

interface CreateRequestFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  location: {
    governorate: string;
    city: string;
    address: string;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  images: File[];
  customFields: Record<string, any>;
}

const CreateRequestForm: React.FC<CreateRequestFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { useCategories } = useApi();
  const categoriesQuery = useCategories();
  
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    location: {
      governorate: initialData?.location?.governorate || '',
      city: initialData?.location?.city || '',
      address: initialData?.location?.address || ''
    },
    budget: {
      min: initialData?.budget?.min || 0,
      max: initialData?.budget?.max || 0,
      currency: initialData?.budget?.currency || 'EGP'
    },
    urgency: initialData?.urgency || 'medium',
    deadline: initialData?.deadline || '',
    images: [],
    customFields: initialData?.customFields || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const totalSteps = 3;

  // Get selected category details
  useEffect(() => {
    if (formData.category && categoriesQuery.data?.data) {
      const category = categoriesQuery.data.data.find(cat => cat._id === formData.category);
      setSelectedCategory(category);
    }
  }, [formData.category, categoriesQuery.data]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        newErrors.title = 'عنوان الطلب مطلوب';
      } else if (formData.title.trim().length < 10) {
        newErrors.title = 'العنوان يجب أن يكون 10 أحرف على الأقل';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'وصف الطلب مطلوب';
      } else if (formData.description.trim().length < 50) {
        newErrors.description = 'الوصف يجب أن يكون 50 حرف على الأقل';
      }

      if (!formData.category) {
        newErrors.category = 'اختيار الفئة مطلوب';
      }

      if (!formData.subcategory) {
        newErrors.subcategory = 'اختيار الفئة الفرعية مطلوب';
      }
    }

    if (step === 2) {
      if (!formData.location.governorate) {
        newErrors.governorate = 'اختيار المحافظة مطلوب';
      }

      if (!formData.location.city) {
        newErrors.city = 'اختيار المدينة مطلوب';
      }

      if (!formData.location.address.trim()) {
        newErrors.address = 'العنوان التفصيلي مطلوب';
      }

      if (formData.budget.min <= 0) {
        newErrors.budgetMin = 'الميزانية الدنيا يجب أن تكون أكبر من صفر';
      }

      if (formData.budget.max <= 0) {
        newErrors.budgetMax = 'الميزانية القصوى يجب أن تكون أكبر من صفر';
      }

      if (formData.budget.max < formData.budget.min) {
        newErrors.budgetMax = 'الميزانية القصوى يجب أن تكون أكبر من أو تساوي الدنيا';
      }

      if (!formData.deadline) {
        newErrors.deadline = 'تاريخ الانتهاء مطلوب';
      } else {
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate <= today) {
          newErrors.deadline = 'تاريخ الانتهاء يجب أن يكون في المستقبل';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBudgetChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: value
      }
    }));
    
    if (errors[`budget${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`budget${field.charAt(0).toUpperCase() + field.slice(1)}`]: '' }));
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value
      }
    }));
  };

  const handleImagesChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      images: files
    }));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyName = (urgency: string) => {
    const names = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل'
    };
    return names[urgency as keyof typeof names] || urgency;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    };
    return colors[urgency as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const renderCustomFields = () => {
    if (!selectedCategory?.customFields) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-text-primary">
          معلومات إضافية
        </h3>
        {selectedCategory.customFields.map((field: any) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            
            {field.type === 'text' && (
              <FormInput
                type="text"
                value={formData.customFields[field.name] || ''}
                onChange={(value) => handleCustomFieldChange(field.name, value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
            
            {field.type === 'textarea' && (
              <FormTextarea
                value={formData.customFields[field.name] || ''}
                onChange={(value) => handleCustomFieldChange(field.name, value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            )}
            
            {field.type === 'select' && (
              <select
                value={formData.customFields[field.name] || ''}
                onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                required={field.required}
              >
                <option value="">اختر {field.label}</option>
                {field.options?.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {field.type === 'number' && (
              <FormInput
                type="number"
                value={formData.customFields[field.name] || ''}
                onChange={(value) => handleCustomFieldChange(field.name, Number(value))}
                placeholder={field.placeholder}
                required={field.required}
                min={field.min}
                max={field.max}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (categoriesQuery.isLoading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="lg" text="جاري تحميل الفئات..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary">
            {isEditing ? 'تعديل طلب الخدمة' : 'إنشاء طلب خدمة جديد'}
          </h2>
          <span className="text-sm text-text-secondary">
            الخطوة {currentStep} من {totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-deep-teal h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              المعلومات الأساسية
            </h3>
            
            <div className="space-y-4">
              <FormInput
                label="عنوان الطلب"
                type="text"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                error={errors.title}
                placeholder="مثال: أحتاج إلى سباك محترف لإصلاح تسرب المياه"
                required
              />

              <FormTextarea
                label="وصف الطلب"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                error={errors.description}
                placeholder="اشرح تفاصيل الخدمة المطلوبة، متطلباتك، والمواصفات المطلوبة..."
                required
                rows={5}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    الفئة الرئيسية
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange('category', e.target.value);
                      handleInputChange('subcategory', '');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                  >
                    <option value="">اختر الفئة</option>
                    {categoriesQuery.data?.data?.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    الفئة الفرعية
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                    disabled={!formData.category}
                  >
                    <option value="">اختر الفئة الفرعية</option>
                    {selectedCategory?.subcategories?.map((subcategory: any) => (
                      <option key={subcategory._id} value={subcategory._id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {errors.subcategory && (
                    <p className="text-red-600 text-sm mt-1">{errors.subcategory}</p>
                  )}
                </div>
              </div>

              {renderCustomFields()}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location & Budget */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              الموقع والميزانية
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="المحافظة"
                  type="text"
                  value={formData.location.governorate}
                  onChange={(value) => handleLocationChange('governorate', value)}
                  error={errors.governorate}
                  placeholder="مثال: القاهرة"
                  required
                />

                <FormInput
                  label="المدينة"
                  type="text"
                  value={formData.location.city}
                  onChange={(value) => handleLocationChange('city', value)}
                  error={errors.city}
                  placeholder="مثال: المعادي"
                  required
                />
              </div>

              <FormInput
                label="العنوان التفصيلي"
                type="text"
                value={formData.location.address}
                onChange={(value) => handleLocationChange('address', value)}
                error={errors.address}
                placeholder="العنوان التفصيلي للموقع"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="الميزانية الدنيا"
                  type="number"
                  value={formData.budget.min}
                  onChange={(value) => handleBudgetChange('min', Number(value))}
                  error={errors.budgetMin}
                  placeholder="0"
                  required
                  min={0}
                />

                <FormInput
                  label="الميزانية القصوى"
                  type="number"
                  value={formData.budget.max}
                  onChange={(value) => handleBudgetChange('max', Number(value))}
                  error={errors.budgetMax}
                  placeholder="0"
                  required
                  min={0}
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    العملة
                  </label>
                  <select
                    value={formData.budget.currency}
                    onChange={(e) => handleBudgetChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    الأولوية
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => handleInputChange('urgency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>

                <FormInput
                  label="تاريخ الانتهاء"
                  type="date"
                  value={formData.deadline}
                  onChange={(value) => handleInputChange('deadline', value)}
                  error={errors.deadline}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Images & Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              الصور والمراجعة
            </h3>
            
            <div className="space-y-4">
              <ImageUpload
                images={formData.images}
                onChange={handleImagesChange}
                maxImages={5}
                maxSize={5 * 1024 * 1024} // 5MB
              />

              {/* Review Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-text-primary mb-4">
                  مراجعة الطلب
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      العنوان
                    </label>
                    <p className="text-text-primary">{formData.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      الفئة
                    </label>
                    <p className="text-text-primary">
                      {selectedCategory?.name} - {selectedCategory?.subcategories?.find((s: any) => s._id === formData.subcategory)?.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      الموقع
                    </label>
                    <p className="text-text-primary">
                      {formData.location.governorate}, {formData.location.city}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      الميزانية
                    </label>
                    <p className="text-text-primary">
                      {formData.budget.min} - {formData.budget.max} {formData.budget.currency}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      الأولوية
                    </label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(formData.urgency)}`}>
                      {getUrgencyName(formData.urgency)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      تاريخ الانتهاء
                    </label>
                    <p className="text-text-primary">
                      {new Date(formData.deadline).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              السابق
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              التالي
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" variant="white" className="mr-2" />
                  {isEditing ? 'جاري التحديث...' : 'جاري الإرسال...'}
                </div>
              ) : (
                isEditing ? 'تحديث الطلب' : 'إرسال الطلب'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRequestForm; 
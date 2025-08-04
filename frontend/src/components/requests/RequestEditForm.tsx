import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Edit, Save, X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormTextarea from '../ui/FormTextarea';
import UnifiedSelect from '../ui/UnifiedSelect';
import ImageUpload from './ImageUpload';
import { CategorySelection } from '../categories';
import { LocationSearch } from '../search';
import { serviceRequestService } from '../../services';

interface ServiceRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  urgency: 'flexible' | 'urgent' | 'very_urgent';
  location: {
    governorate: string;
    city: string;
  };
  images: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
  answers: Array<{
    question: string;
    answer: string;
  }>;
  status: 'open' | 'negotiating' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
}

interface RequestEditFormProps {
  request: ServiceRequest;
  onSave: (updatedRequest: Partial<ServiceRequest>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const RequestEditForm: React.FC<RequestEditFormProps> = ({
  request,
  onSave,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    title: request.title || '',
    description: request.description || '',
    category: request.category || '',
    subcategory: request.subcategory || '',
    urgency: request.urgency || 'flexible',
    location: request.location || { governorate: '', city: '' },
    images: request.images || [],
    answers: request.answers || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { useCategories } = useApi();
  const categoriesQuery = useCategories();

  const categories = categoriesQuery.data?.data || [];

  // Get selected category details
  const selectedCategory = categories.find(cat => cat._id === formData.category);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'العنوان مطلوب';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'الوصف مطلوب';
    }

    if (!formData.category) {
      newErrors.category = 'الفئة مطلوبة';
    }

    if (!formData.location.governorate) {
      newErrors.location = 'المحافظة مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    handleInputChange('category', categoryId);
    handleInputChange('subcategory', '');
  };

  const handleSubcategorySelect = (subcategoryId: string, subcategoryName: string) => {
    handleInputChange('subcategory', subcategoryId);
  };

  const handleLocationChange = (location: any) => {
    handleInputChange('location', location);
  };

  const handleImagesChange = (images: File[]) => {
    // Convert File objects to the expected format
    const imageObjects = images.map(file => ({
      url: URL.createObjectURL(file),
      filename: file.name,
      fileType: file.type,
      fileSize: file.size
    }));
    handleInputChange('images', imageObjects);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = { ...newAnswers[index], answer: value };
    handleInputChange('answers', newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to save request:', error);
      alert(error?.message || 'حدث خطأ أثناء حفظ الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setIsEditing(false);
      // Reset form data to original values
      setFormData({
        title: request.title || '',
        description: request.description || '',
        category: request.category || '',
        subcategory: request.subcategory || '',
        urgency: request.urgency || 'flexible',
        location: request.location || { governorate: '', city: '' },
        images: request.images || [],
        answers: request.answers || []
      });
      setErrors({});
    } else {
      onCancel();
    }
  };

  const getUrgencyOptions = () => [
    { value: 'flexible', label: 'مرن' },
    { value: 'urgent', label: 'عاجل' },
    { value: 'very_urgent', label: 'عاجل جداً' }
  ];

  // Check if request can be edited
  const canEdit = request.status === 'open';

  if (!canEdit) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 space-x-reverse">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">
            لا يمكن تعديل هذا الطلب لأنه في حالة "{serviceRequestService.getStatusName(request.status)}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Edit className="w-5 h-5 text-deep-teal" />
          <h2 className="text-xl font-semibold text-text-primary">
            تعديل طلب الخدمة
          </h2>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          {!isEditing ? (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Edit className="w-4 h-4" />
              <span>تعديل</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            عنوان الطلب
          </label>
          <FormInput
            type="text"
            value={formData.title}
            onChange={(value) => handleInputChange('title', value)}
            placeholder="أدخل عنوان الطلب"
            disabled={!isEditing}
            error={errors.title}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            وصف الطلب
          </label>
          <FormTextarea
            value={formData.description}
            onChange={(value) => handleInputChange('description', value)}
            placeholder="اشرح تفاصيل الطلب..."
            rows={4}
            disabled={!isEditing}
            error={errors.description}
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الفئة
          </label>
          {isEditing ? (
            <CategorySelection
              selectedCategory={formData.category}
              selectedSubcategory={formData.subcategory}
              onCategorySelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
              variant="dropdown"
              placeholder="اختر الفئة"
              disabled={!isEditing}
            />
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-text-primary">
                {selectedCategory?.name || 'غير محدد'}
                {formData.subcategory && ` - ${selectedCategory?.subcategories?.find(sub => sub._id === formData.subcategory)?.name}`}
              </p>
            </div>
          )}
          {errors.category && (
            <p className="text-red-600 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الأولوية
          </label>
          <UnifiedSelect
            value={formData.urgency}
            onChange={(value) => handleInputChange('urgency', value)}
            options={getUrgencyOptions()}
            placeholder="اختر الأولوية"
            disabled={!isEditing}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الموقع
          </label>
          {isEditing ? (
            <LocationSearch
              location={formData.location}
              onLocationChange={handleLocationChange}
              disabled={!isEditing}
            />
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-text-primary">
                {formData.location.city && formData.location.governorate 
                  ? `${formData.location.city}، ${formData.location.governorate}`
                  : 'غير محدد'
                }
              </p>
            </div>
          )}
          {errors.location && (
            <p className="text-red-600 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        {/* Custom Answers */}
        {formData.answers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              إجابات إضافية
            </label>
            <div className="space-y-4">
              {formData.answers.map((answer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-text-primary mb-2">
                    {answer.question}
                  </h4>
                  <FormTextarea
                    value={answer.answer}
                    onChange={(value) => handleAnswerChange(index, value)}
                    placeholder="أدخل إجابتك..."
                    rows={2}
                    disabled={!isEditing}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الصور المرفقة
          </label>
          {isEditing ? (
            <ImageUpload
              images={formData.images.map(img => new File([], img.filename))}
              onChange={handleImagesChange}
              maxImages={5}
              disabled={!isEditing}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit buttons */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-2 space-x-reverse pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default RequestEditForm; 
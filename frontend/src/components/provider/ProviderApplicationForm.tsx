import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User, 
  MapPin,
  Star,
  Award,
  BookOpen,
  Tool
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormTextarea from '../ui/FormTextarea';
import FormSelect from '../ui/FormSelect';
import Badge from '../ui/Badge';
import { useApi } from '../../hooks/useApi';

interface Skill {
  category: string;
  subcategory: string;
  verified: boolean;
}

interface ApplicationFormData {
  skills: Skill[];
  experience: {
    years: number;
    description: string;
    learningMethod: 'apprenticeship' | 'self_taught' | 'family_business' | 'formal_education';
  };
  portfolio: {
    images: string[];
    videos: string[];
    description: string;
  };
  availability: {
    workingDays: string[];
    startTime: string;
    endTime: string;
  };
  pricing: {
    minPrice: number;
    maxPrice: number;
  };
  additionalInfo: string;
}

interface ProviderApplicationFormProps {
  onComplete?: (applicationData: ApplicationFormData) => void;
  className?: string;
}

const ProviderApplicationForm: React.FC<ProviderApplicationFormProps> = ({
  onComplete,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ApplicationFormData>({
    skills: [],
    experience: {
      years: 0,
      description: '',
      learningMethod: 'self_taught'
    },
    portfolio: {
      images: [],
      videos: [],
      description: ''
    },
    availability: {
      workingDays: [],
      startTime: '09:00',
      endTime: '17:00'
    },
    pricing: {
      minPrice: 0,
      maxPrice: 0
    },
    additionalInfo: ''
  });

  // API hooks
  const { data: categories, isLoading: categoriesLoading } = useApi('/categories');
  const { mutate: submitApplication } = useApi('/provider/apply', 'POST');

  const learningMethods = [
    { value: 'apprenticeship', label: 'التدريب المهني (صنايعي)' },
    { value: 'self_taught', label: 'التعلم الذاتي' },
    { value: 'family_business', label: 'العمل العائلي' },
    { value: 'formal_education', label: 'التعليم الرسمي' }
  ];

  const workingDays = [
    { value: 'sunday', label: 'الأحد' },
    { value: 'monday', label: 'الاثنين' },
    { value: 'tuesday', label: 'الثلاثاء' },
    { value: 'wednesday', label: 'الأربعاء' },
    { value: 'thursday', label: 'الخميس' },
    { value: 'friday', label: 'الجمعة' },
    { value: 'saturday', label: 'السبت' }
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const handleSkillAdd = (category: string, subcategory: string) => {
    const newSkill: Skill = {
      category,
      subcategory,
      verified: false
    };
    
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const handleSkillRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleExperienceChange = (field: keyof typeof formData.experience, value: any) => {
    setFormData(prev => ({
      ...prev,
      experience: {
        ...prev.experience,
        [field]: value
      }
    }));
  };

  const handlePortfolioUpload = async (files: FileList, type: 'images' | 'videos') => {
    setLoading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload/portfolio', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('فشل رفع الملفات');

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        portfolio: {
          ...prev.portfolio,
          [type]: [...prev.portfolio[type], ...data.urls]
        }
      }));

      showSuccess('تم رفع الملفات بنجاح');
    } catch (error) {
      showError('فشل رفع الملفات');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        workingDays: prev.availability.workingDays.includes(day)
          ? prev.availability.workingDays.filter(d => d !== day)
          : [...prev.availability.workingDays, day]
      }
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await submitApplication(formData);
      showSuccess('تم تقديم طلبك بنجاح! سنراجع طلبك خلال 24-48 ساعة');
      onComplete?.(formData);
      navigate('/provider-dashboard');
    } catch (error) {
      showError('فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    if (formData.skills.length === 0) {
      showError('يرجى اختيار مهارة واحدة على الأقل');
      return false;
    }
    if (formData.experience.years === 0) {
      showError('يرجى تحديد سنوات الخبرة');
      return false;
    }
    if (formData.experience.description.trim() === '') {
      showError('يرجى وصف خبرتك');
      return false;
    }
    if (formData.portfolio.images.length === 0) {
      showError('يرجى رفع صور لأعمالك السابقة');
      return false;
    }
    if (formData.availability.workingDays.length === 0) {
      showError('يرجى اختيار أيام العمل');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            step <= currentStep 
              ? 'bg-deep-teal border-deep-teal text-white' 
              : 'bg-gray-200 border-gray-300 text-gray-500'
          }`}>
            {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          {step < 5 && (
            <div className={`w-16 h-1 ${
              step < currentStep ? 'bg-deep-teal' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="w-16 h-16 text-deep-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-deep-teal mb-2">اختر مهاراتك</h2>
        <p className="text-gray-600">حدد الفئات والتخصصات التي تريد العمل فيها</p>
      </div>

      {categoriesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل الفئات...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected Skills */}
          {formData.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-deep-teal mb-3">المهارات المختارة:</h3>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="success" 
                    className="flex items-center gap-2"
                  >
                    {skill.category} - {skill.subcategory}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories?.map((category: any) => (
              <div key={category._id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-deep-teal mb-3">{category.name}</h4>
                <div className="space-y-2">
                  {category.subcategories?.map((subcategory: string) => (
                    <button
                      key={subcategory}
                      type="button"
                      onClick={() => handleSkillAdd(category.name, subcategory)}
                      className="w-full text-right p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      {subcategory}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <BookOpen className="w-16 h-16 text-deep-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-deep-teal mb-2">وصف خبرتك</h2>
        <p className="text-gray-600">أخبرنا عن خبرتك وكيف تعلمت مهاراتك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="سنوات الخبرة"
          type="number"
          value={formData.experience.years}
          onChange={(value) => handleExperienceChange('years', parseInt(value) || 0)}
          placeholder="عدد سنوات الخبرة"
          min={0}
          max={50}
          required
        />

        <FormSelect
          label="طريقة التعلم"
          value={formData.experience.learningMethod}
          onChange={(value) => handleExperienceChange('learningMethod', value)}
          options={learningMethods}
          required
        />
      </div>

      <FormTextarea
        label="وصف الخبرة"
        value={formData.experience.description}
        onChange={(value) => handleExperienceChange('description', value)}
        placeholder="اكتب عن خبرتك في هذا المجال، الأعمال التي قمت بها، والطرق التي تعلمت بها..."
        rows={6}
        required
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Upload className="w-16 h-16 text-deep-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-deep-teal mb-2">معرض أعمالك</h2>
        <p className="text-gray-600">ارفع صور وفيديوهات لأعمالك السابقة</p>
      </div>

      {/* Portfolio Images */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            صور الأعمال السابقة
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">اسحب وأفلت الصور هنا أو اضغط للاختيار</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handlePortfolioUpload(e.target.files, 'images')}
              className="hidden"
              id="portfolio-images"
            />
            <label htmlFor="portfolio-images">
              <Button variant="outline" disabled={loading}>
                {loading ? 'جاري الرفع...' : 'اختيار الصور'}
              </Button>
            </label>
          </div>
          {formData.portfolio.images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">الصور المرفوعة:</p>
              <div className="grid grid-cols-3 gap-2">
                {formData.portfolio.images.map((url, index) => (
                  <img key={index} src={url} alt={`Portfolio ${index + 1}`} className="w-full h-20 object-cover rounded" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Description */}
        <FormTextarea
          label="وصف معرض الأعمال"
          value={formData.portfolio.description}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            portfolio: { ...prev.portfolio, description: value }
          }))}
          placeholder="اكتب وصفاً مختصراً لأعمالك المرفوعة..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Clock className="w-16 h-16 text-deep-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-deep-teal mb-2">جدول العمل</h2>
        <p className="text-gray-600">حدد أوقات عملك المتاحة</p>
      </div>

      {/* Working Days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          أيام العمل
        </label>
        <div className="grid grid-cols-7 gap-2">
          {workingDays.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => handleWorkingDayToggle(day.value)}
              className={`p-3 rounded-lg border text-sm ${
                formData.availability.workingDays.includes(day.value)
                  ? 'bg-deep-teal text-white border-deep-teal'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-deep-teal'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Working Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSelect
          label="وقت البدء"
          value={formData.availability.startTime}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            availability: { ...prev.availability, startTime: value }
          }))}
          options={timeSlots.map(time => ({ value: time, label: time }))}
        />

        <FormSelect
          label="وقت الانتهاء"
          value={formData.availability.endTime}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            availability: { ...prev.availability, endTime: value }
          }))}
          options={timeSlots.map(time => ({ value: time, label: time }))}
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="الحد الأدنى للسعر (جنيه)"
          type="number"
          value={formData.pricing.minPrice}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            pricing: { ...prev.pricing, minPrice: parseInt(value) || 0 }
          }))}
          placeholder="الحد الأدنى"
          min={0}
        />

        <FormInput
          label="الحد الأقصى للسعر (جنيه)"
          type="number"
          value={formData.pricing.maxPrice}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            pricing: { ...prev.pricing, maxPrice: parseInt(value) || 0 }
          }))}
          placeholder="الحد الأقصى"
          min={0}
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Award className="w-16 h-16 text-deep-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-deep-teal mb-2">مراجعة الطلب</h2>
        <p className="text-gray-600">راجع معلومات طلبك قبل التقديم</p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-deep-teal mb-2">المهارات المختارة:</h3>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <Badge key={index} variant="success">
                {skill.category} - {skill.subcategory}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-deep-teal mb-2">الخبرة:</h3>
          <p className="text-gray-700">
            {formData.experience.years} سنوات - {learningMethods.find(m => m.value === formData.experience.learningMethod)?.label}
          </p>
          <p className="text-gray-600 text-sm mt-1">{formData.experience.description}</p>
        </div>

        <div>
          <h3 className="font-semibold text-deep-teal mb-2">أيام العمل:</h3>
          <p className="text-gray-700">
            {formData.availability.workingDays.map(day => 
              workingDays.find(w => w.value === day)?.label
            ).join('، ')} - {formData.availability.startTime} إلى {formData.availability.endTime}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-deep-teal mb-2">نطاق الأسعار:</h3>
          <p className="text-gray-700">
            {formData.pricing.minPrice} - {formData.pricing.maxPrice} جنيه
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <FormTextarea
        label="معلومات إضافية (اختياري)"
        value={formData.additionalInfo}
        onChange={(value) => setFormData(prev => ({ ...prev, additionalInfo: value }))}
        placeholder="أي معلومات إضافية تريد إضافتها..."
        rows={3}
      />
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 ${className}`}>
      {renderStepIndicator()}
      
      {renderCurrentStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          السابق
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={nextStep}
            disabled={currentStep === 5}
          >
            التالي
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
          >
            تقديم الطلب
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProviderApplicationForm; 
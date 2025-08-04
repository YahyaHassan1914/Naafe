import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Upload, 
  X, 
  MapPin, 
  Clock, 
  AlertCircle,
  Info,
  Camera,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormTextarea from '../ui/FormTextarea';
import FormSelect from '../ui/FormSelect';
import Badge from '../ui/Badge';

interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  _id: string;
  name: string;
  description: string;
  icon: string;
  questions: DynamicQuestion[];
}

interface DynamicQuestion {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
  helpText?: string;
}

interface Location {
  governorate: string;
  city: string;
  street?: string;
  apartmentNumber?: string;
  additionalInfo?: string;
}

interface EnhancedRequestFormData {
  category: string;
  subcategory: string;
  urgency: 'asap' | 'this-week' | 'flexible';
  location: Location;
  description: string;
  currentSituation: string;
  specificRequirements: string;
  answers: Record<string, string>;
  images: string[];
}

interface ValidationErrors {
  category?: string;
  subcategory?: string;
  urgency?: string;
  location?: Partial<Location>;
  description?: string;
  currentSituation?: string;
  specificRequirements?: string;
  answers?: Record<string, string>;
  images?: string;
}

const ENHANCED_STEPS = [
  { id: 1, title: 'اختيار الفئة', description: 'اختر نوع الخدمة المطلوبة', icon: '🏠' },
  { id: 2, title: 'التخصص والأولوية', description: 'حدد التخصص ومستوى الأولوية', icon: '⚡' },
  { id: 3, title: 'الموقع (خاص)', description: 'حدد موقعك (لن يتم مشاركته علناً)', icon: '📍' },
  { id: 4, title: 'تفاصيل الطلب', description: 'صف ما تحتاجه بالتفصيل', icon: '📝' },
  { id: 5, title: 'أسئلة إضافية', description: 'أسئلة خاصة بنوع الخدمة', icon: '❓' },
  { id: 6, title: 'الصور (اختياري)', description: 'ارفع صور للمساعدة في الفهم', icon: '📸' },
];

const URGENCY_OPTIONS = [
  { value: 'asap', label: 'عاجل (اليوم أو غداً)', description: 'مطلوب في أقرب وقت ممكن' },
  { value: 'this-week', label: 'هذا الأسبوع', description: 'مطلوب خلال الأسبوع الحالي' },
  { value: 'flexible', label: 'مرن', description: 'لا توجد أولوية زمنية محددة' },
];

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الغربية', 'المنوفية', 'القليوبية',
  'البحيرة', 'كفر الشيخ', 'الدمياط', 'الدقهلية', 'الشرقية', 'بورسعيد', 'الإسماعيلية',
  'السويس', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر'
];

const EnhancedRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { showSuccess, showError } = useToast();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EnhancedRequestFormData>({
    category: '',
    subcategory: '',
    urgency: 'flexible',
    location: {
      governorate: '',
      city: '',
      street: '',
      apartmentNumber: '',
      additionalInfo: ''
    },
    description: '',
    currentSituation: '',
    specificRequirements: '',
    answers: {},
    images: []
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<{[key: string]: boolean}>({});

  // Data fetching
  const { data: categories, isLoading: categoriesLoading } = useApi('/categories');
  const { mutate: submitRequest } = useApi('/requests', 'POST');

  // Get current subcategory and its questions
  const currentCategory = categories?.find((cat: Category) => cat.name === formData.category);
  const currentSubcategory = currentCategory?.subcategories?.find((sub: Subcategory) => sub.name === formData.subcategory);
  const currentQuestions = currentSubcategory?.questions || [];

  // Get cities for selected governorate (simplified - in real app, this would be API call)
  const getCitiesForGovernorate = (governorate: string) => {
    // This is a simplified version - in real app, you'd fetch from API
    const cityMap: Record<string, string[]> = {
      'القاهرة': ['المعادي', 'مدينة نصر', 'الزمالك', 'مصر الجديدة', 'المرج', 'شبرا'],
      'الجيزة': ['الدقي', 'المهندسين', 'الهرم', '6 أكتوبر', 'الشيخ زايد', 'العجوزة'],
      'الإسكندرية': ['سموحة', 'سيدي جابر', 'الإبراهيمية', 'ميامي', 'العجمي', 'باكوس'],
      // Add more cities for other governorates
    };
    return cityMap[governorate] || [];
  };

  const validateStep = (step: number): boolean => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.category) {
          errors.category = 'يرجى اختيار الفئة';
        }
        break;

      case 2:
        if (!formData.subcategory) {
          errors.subcategory = 'يرجى اختيار التخصص';
        }
        if (!formData.urgency) {
          errors.urgency = 'يرجى تحديد مستوى الأولوية';
        }
        break;

      case 3:
        if (!formData.location.governorate) {
          errors.location = { ...errors.location, governorate: 'يرجى اختيار المحافظة' };
        }
        if (!formData.location.city) {
          errors.location = { ...errors.location, city: 'يرجى اختيار المدينة' };
        }
        break;

      case 4:
        if (!formData.description.trim()) {
          errors.description = 'يرجى وصف ما تحتاجه بالتفصيل';
        }
        if (!formData.currentSituation.trim()) {
          errors.currentSituation = 'يرجى وصف الوضع الحالي';
        }
        if (!formData.specificRequirements.trim()) {
          errors.specificRequirements = 'يرجى تحديد المتطلبات المحددة';
        }
        break;

      case 5:
        // Validate dynamic questions
        const answerErrors: Record<string, string> = {};
        currentQuestions.forEach(question => {
          if (question.required && !formData.answers[question.id]?.trim()) {
            answerErrors[question.id] = `يرجى الإجابة على: ${question.label}`;
          }
        });
        if (Object.keys(answerErrors).length > 0) {
          errors.answers = answerErrors;
        }
        break;

      case 6:
        // Images are optional, no validation needed
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const shouldShowError = (field: string) => {
    return touchedFields[field] && validationErrors[field as keyof ValidationErrors];
  };

  const handleFieldChange = (field: keyof EnhancedRequestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLocationChange = (field: keyof Location, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
    setTouchedFields(prev => ({ ...prev, [`location.${field}`]: true }));
    
    // Clear city when governorate changes
    if (field === 'governorate') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, city: '' }
      }));
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
    setTouchedFields(prev => ({ ...prev, [`answer_${questionId}`]: true }));
    
    // Clear validation error
    if (validationErrors.answers?.[questionId]) {
      setValidationErrors(prev => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: undefined }
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload/request-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('فشل رفع الصور');

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...data.urls]
      }));

      showSuccess('تم رفع الصور بنجاح');
    } catch (error) {
      showError('فشل رفع الصور');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < ENHANCED_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      showError('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      // Combine answers into description
      const answersText = currentQuestions
        .map(question => {
          const answer = formData.answers[question.id] || '';
          return `${question.label}\n${answer}`;
        })
        .join('\n\n');

      const fullDescription = `${formData.description}\n\nالوضع الحالي:\n${formData.currentSituation}\n\nالمتطلبات المحددة:\n${formData.specificRequirements}\n\n${answersText}`;

      const payload = {
        title: `طلب خدمة - ${formData.category} - ${formData.subcategory}`,
        description: fullDescription,
        category: formData.category,
        subcategory: formData.subcategory,
        urgency: formData.urgency,
        location: formData.location, // Private location for matching only
        images: formData.images,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      await submitRequest(payload);
      showSuccess('تم نشر طلبك بنجاح!');
      
      // Navigate to success page with recommendations
      navigate('/request-success', { 
        state: { 
          requestId: 'temp-id', // In real app, this would come from the response
          category: formData.category,
          subcategory: formData.subcategory
        } 
      });
    } catch (error) {
      showError('فشل نشر الطلب');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-deep-teal">طلب خدمة جديدة</h1>
        <div className="text-sm text-gray-500">
          الخطوة {currentStep} من {ENHANCED_STEPS.length}
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-4">
        {ENHANCED_STEPS.map((step) => (
          <div key={step.id} className="text-center">
            <button
              onClick={() => goToStep(step.id)}
              disabled={step.id > currentStep}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                step.id < currentStep
                  ? 'bg-green-500 border-green-500 text-white'
                  : step.id === currentStep
                  ? 'bg-deep-teal border-deep-teal text-white'
                  : 'bg-gray-200 border-gray-300 text-gray-500'
              }`}
            >
              {step.id < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-lg">{step.icon}</span>
              )}
            </button>
            <div className="mt-2">
              <div className="text-xs font-medium text-gray-700">{step.title}</div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-deep-teal mb-2">اختر نوع الخدمة</h2>
        <p className="text-gray-600">حدد الفئة التي تناسب احتياجاتك</p>
      </div>

      {categoriesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل الفئات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category: Category) => (
            <button
              key={category._id}
              onClick={() => handleFieldChange('category', category.name)}
              className={`p-6 rounded-lg border-2 text-right transition-all ${
                formData.category === category.name
                  ? 'border-deep-teal bg-deep-teal/5'
                  : 'border-gray-200 hover:border-deep-teal/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{category.icon}</span>
                {formData.category === category.name && (
                  <Check className="w-5 h-5 text-deep-teal" />
                )}
              </div>
              <h3 className="font-semibold text-deep-teal mb-2">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </button>
          ))}
        </div>
      )}

      {shouldShowError('category') && (
        <div className="text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {validationErrors.category}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-deep-teal mb-2">التخصص والأولوية</h2>
        <p className="text-gray-600">حدد التخصص المحدد ومستوى الأولوية</p>
      </div>

      {/* Subcategory Selection */}
      {currentCategory && (
        <div className="space-y-4">
          <h3 className="font-semibold text-deep-teal">التخصص</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCategory.subcategories.map((subcategory: Subcategory) => (
              <button
                key={subcategory._id}
                onClick={() => handleFieldChange('subcategory', subcategory.name)}
                className={`p-4 rounded-lg border-2 text-right transition-all ${
                  formData.subcategory === subcategory.name
                    ? 'border-deep-teal bg-deep-teal/5'
                    : 'border-gray-200 hover:border-deep-teal/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{subcategory.icon}</span>
                  {formData.subcategory === subcategory.name && (
                    <Check className="w-4 h-4 text-deep-teal" />
                  )}
                </div>
                <h4 className="font-medium text-deep-teal">{subcategory.name}</h4>
                <p className="text-sm text-gray-600">{subcategory.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Urgency Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-deep-teal">مستوى الأولوية</h3>
        <div className="space-y-3">
          {URGENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFieldChange('urgency', option.value)}
              className={`w-full p-4 rounded-lg border-2 text-right transition-all ${
                formData.urgency === option.value
                  ? 'border-deep-teal bg-deep-teal/5'
                  : 'border-gray-200 hover:border-deep-teal/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div className="font-medium text-deep-teal">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
                {formData.urgency === option.value && (
                  <Check className="w-5 h-5 text-deep-teal" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {shouldShowError('subcategory') && (
        <div className="text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {validationErrors.subcategory}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-deep-teal mb-2">الموقع (خاص)</h2>
        <p className="text-gray-600">حدد موقعك - لن يتم مشاركته علناً، فقط للمطابقة مع المحترفين</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="w-4 h-4" />
            <span className="text-sm">موقعك آمن ولن يظهر في الطلب العام</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSelect
          label="المحافظة"
          value={formData.location.governorate}
          onChange={(value) => handleLocationChange('governorate', value)}
          options={EGYPT_GOVERNORATES.map(gov => ({ value: gov, label: gov }))}
          placeholder="اختر المحافظة"
          required
        />

        <FormSelect
          label="المدينة"
          value={formData.location.city}
          onChange={(value) => handleLocationChange('city', value)}
          options={getCitiesForGovernorate(formData.location.governorate).map(city => ({ value: city, label: city }))}
          placeholder="اختر المدينة"
          disabled={!formData.location.governorate}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="الشارع (اختياري)"
          value={formData.location.street || ''}
          onChange={(value) => handleLocationChange('street', value)}
          placeholder="اسم الشارع"
        />

        <FormInput
          label="رقم الشقة/المبنى (اختياري)"
          value={formData.location.apartmentNumber || ''}
          onChange={(value) => handleLocationChange('apartmentNumber', value)}
          placeholder="رقم الشقة أو المبنى"
        />
      </div>

      <FormTextarea
        label="معلومات إضافية (اختياري)"
        value={formData.location.additionalInfo || ''}
        onChange={(value) => handleLocationChange('additionalInfo', value)}
        placeholder="أي معلومات إضافية عن الموقع..."
        rows={3}
      />

      {validationErrors.location && (
        <div className="space-y-2">
          {validationErrors.location.governorate && (
            <div className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.location.governorate}
            </div>
          )}
          {validationErrors.location.city && (
            <div className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.location.city}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-deep-teal mb-2">تفاصيل الطلب</h2>
        <p className="text-gray-600">صف ما تحتاجه بالتفصيل لمساعدة المحترفين في فهم متطلباتك</p>
      </div>

      <FormTextarea
        label="ما الذي تحتاج عمله؟"
        value={formData.description}
        onChange={(value) => handleFieldChange('description', value)}
        placeholder="اشرح بالتفصيل ما الذي تحتاج عمله..."
        rows={4}
        required
        error={shouldShowError('description') ? validationErrors.description : undefined}
      />

      <FormTextarea
        label="الوضع الحالي"
        value={formData.currentSituation}
        onChange={(value) => handleFieldChange('currentSituation', value)}
        placeholder="اشرح الوضع الحالي والمشكلة التي تواجهها..."
        rows={3}
        required
        error={shouldShowError('currentSituation') ? validationErrors.currentSituation : undefined}
      />

      <FormTextarea
        label="المتطلبات المحددة"
        value={formData.specificRequirements}
        onChange={(value) => handleFieldChange('specificRequirements', value)}
        placeholder="اذكر أي متطلبات محددة أو تفضيلات خاصة..."
        rows={3}
        required
        error={shouldShowError('specificRequirements') ? validationErrors.specificRequirements : undefined}
      />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-deep-teal mb-2">أسئلة إضافية</h2>
        <p className="text-gray-600">أسئلة خاصة بنوع الخدمة لمساعدة المحترفين في تقديم عروض أفضل</p>
      </div>

      {currentQuestions.length === 0 ? (
        <div className="text-center py-8">
          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد أسئلة إضافية لهذا النوع من الخدمة</p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentQuestions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {question.label}
                {question.required && <span className="text-red-500"> *</span>}
              </label>
              
              {question.helpText && (
                <p className="text-sm text-gray-500">{question.helpText}</p>
              )}

              {question.type === 'text' && (
                <FormInput
                  value={formData.answers[question.id] || ''}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  placeholder={question.placeholder}
                  required={question.required}
                  error={shouldShowError(`answer_${question.id}`) ? validationErrors.answers?.[question.id] : undefined}
                />
              )}

              {question.type === 'textarea' && (
                <FormTextarea
                  value={formData.answers[question.id] || ''}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  placeholder={question.placeholder}
                  rows={3}
                  required={question.required}
                  error={shouldShowError(`answer_${question.id}`) ? validationErrors.answers?.[question.id] : undefined}
                />
              )}

              {question.type === 'select' && question.options && (
                <FormSelect
                  value={formData.answers[question.id] || ''}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  options={question.options.map(option => ({ value: option, label: option }))}
                  placeholder={question.placeholder}
                  required={question.required}
                  error={shouldShowError(`answer_${question.id}`) ? validationErrors.answers?.[question.id] : undefined}
                />
              )}

              {question.type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={formData.answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="text-deep-teal focus:ring-deep-teal"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-deep-teal mb-2">الصور (اختياري)</h2>
        <p className="text-gray-600">ارفع صور للمساعدة في فهم المشكلة أو المطلوب</p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">اسحب وأفلت الصور هنا أو اضغط للاختيار</p>
          <p className="text-sm text-gray-500 mb-4">
            يمكنك رفع حتى 5 صور (JPG, PNG) - الحد الأقصى 5MB لكل صورة
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="request-images"
            disabled={uploadingImages || formData.images.length >= 5}
          />
          <label htmlFor="request-images">
            <Button 
              variant="outline" 
              disabled={uploadingImages || formData.images.length >= 5}
              className="cursor-pointer"
            >
              {uploadingImages ? 'جاري الرفع...' : 'اختيار الصور'}
            </Button>
          </label>
        </div>

        {formData.images.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-3">الصور المرفوعة:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`صورة ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepIndicator()}
          
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              السابق
            </Button>

            {currentStep < ENHANCED_STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={currentStep === ENHANCED_STEPS.length}
              >
                التالي
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
              >
                نشر الطلب
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRequestForm; 
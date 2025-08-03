import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Button from './ui/Button';
import BaseCard from './ui/BaseCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FormInput, FormTextarea } from './ui';
import { Upload, X, Image as ImageIcon, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface Category {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  icon: string;
  questions: Question[];
}

interface Question {
  label: string;
  placeholder: string;
}

interface RequestServiceFormData {
  category: string;
  subcategory: string;
  requestDescription: string;
  answers: Record<string, string>;
  images: string[];
}

interface ValidationErrors {
  category?: string;
  subcategory?: string;
  requestDescription?: string;
  answers?: Record<string, string>;
}

const STEPS = [
  { id: 1, title: 'اختيار الفئة', description: 'اختار نوع الخدمة' },
  { id: 2, title: 'اختيار التخصص', description: 'اختار التخصص المحدد' },
  { id: 3, title: 'تفاصيل الطلب', description: 'جاوب على الأسئلة واكتب وصف' },
  { id: 4, title: 'رفع الصور', description: 'ارفع صور (اختياري)' },
];

const RequestServiceForm: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RequestServiceFormData>({
    category: '',
    subcategory: '',
    requestDescription: '',
    answers: {},
    images: [],
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<{[key: string]: boolean}>({});
  
  // Data fetching
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [subcategoriesData, setSubcategoriesData] = useState<Record<string, Subcategory[]>>({});

  // Fetch categories and subcategories data
  useEffect(() => {
    const fetchData = async () => {
      setCategoriesLoading(true);
      try {
        // Fetch categories from API
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        
        if (categoriesData.success && Array.isArray(categoriesData.data.categories)) {
          setCategories(categoriesData.data.categories);
        } else {
          setCategoriesError('فشل تحميل الفئات');
        }

        // Load subcategories questions from JSON file
        const subcategoriesRes = await fetch('/subcategories-labels-placeholders.json');
        const subcategoriesJson = await subcategoriesRes.json();
        setSubcategoriesData(subcategoriesJson);
      } catch (error) {
        console.error('Error fetching data:', error);
        setCategoriesError('فشل تحميل البيانات');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get current category object
  const currentCategory = categories.find(cat => cat.name === formData.category);
  
  // Get current subcategory object
  const currentSubcategory = currentCategory?.subcategories.find(sub => sub.name === formData.subcategory);
  
  // Get questions for current subcategory
  const currentQuestions = subcategoriesData[formData.category]?.[formData.subcategory]?.questions || [];

  // Check if current step is valid for next button
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.category.trim() !== '';
      case 2:
        return formData.subcategory.trim() !== '';
      case 3:
        return currentQuestions.every((question: Question, index: number) => formData.answers[`question_${index}`]?.trim());
      case 4:
        return true; // Image upload is optional
      default:
        return false;
    }
  };

  // Validation functions
  const validateStep = (step: number): boolean => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.category.trim()) {
          errors.category = 'الفئة مطلوبة';
        }
        break;
      case 2:
        if (!formData.subcategory.trim()) {
          errors.subcategory = 'الفئة الفرعية مطلوبة';
        }
        break;
      case 3: {
        // Validate questions
        const questionErrors: Record<string, string> = {};
        currentQuestions.forEach((question: Question, index: number) => {
          const answerKey = `question_${index}`;
          if (!formData.answers[answerKey]?.trim()) {
            questionErrors[answerKey] = 'هذا السؤال مطلوب';
          }
        });
        if (Object.keys(questionErrors).length > 0) {
          errors.answers = questionErrors;
        }
        break;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const shouldShowError = (field: string) => {
    return (touchedFields[field] || submitAttempted) && validationErrors[field as keyof ValidationErrors];
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setValidationErrors({});
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setValidationErrors({});
  };

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      setValidationErrors({});
    }
  };

  // Handle form changes
  const handleCategoryChange = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryName,
      subcategory: '', // Reset subcategory when category changes
      answers: {}, // Reset answers when category changes
    }));
    setValidationErrors({});
  };

  const handleSubcategoryChange = (subcategoryName: string) => {
    setFormData(prev => ({
      ...prev,
      subcategory: subcategoryName,
      answers: {}, // Reset answers when subcategory changes
    }));
    setValidationErrors({});
  };

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const answerKey = `question_${questionIndex}`;
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [answerKey]: value,
      },
    }));
    
    // Clear error when field is changed
    if (validationErrors.answers?.[answerKey]) {
      setValidationErrors(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [answerKey]: undefined,
        },
      }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, requestDescription: value }));
    if (validationErrors.requestDescription) {
      setValidationErrors(prev => ({ ...prev, requestDescription: undefined }));
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    if (formData.images.length + files.length > 5) {
      alert('يمكنك رفع 5 صور كحد أقصى');
      return;
    }

    setUploadingImages(true);

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('يرجى رفع صور فقط');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`الملف ${file.name} كبير جداً. الحد الأقصى 5 ميجابايت`);
        continue;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      try {
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.data.imageUrl]
          }));
          setImageUploadProgress(prev => ({ ...prev, [file.name]: true }));
        } else {
          alert(`فشل رفع الصورة ${file.name}`);
        }
      } catch (error) {
        alert(`خطأ في رفع الصورة ${file.name}`);
      }
    }

    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Submit form
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setTouchedFields({
      category: true,
      subcategory: true,
      requestDescription: true,
      ...Object.fromEntries(currentQuestions.map((_, index) => [`question_${index}`, true])),
    });
    
    if (!validateStep(3)) {
      alert('يوجد أخطاء في النموذج. يرجى التأكد من صحة البيانات.');
      return;
    }
    
    setLoading(true);
    try {
      // Combine answers into description
      const answersText = currentQuestions
        .map((question, index) => {
          const answer = formData.answers[`question_${index}`] || '';
          return `${question.label}\n${answer}`;
        })
        .join('\n\n');

      const fullDescription = `${formData.requestDescription}\n\n${answersText}`;

      const payload = {
        title: `طلب خدمة - ${formData.category} - ${formData.subcategory}`,
        description: fullDescription,
        category: formData.category,
        subcategory: formData.subcategory,
        budget: {
          min: 0,
          max: 0,
          currency: 'EGP',
        },
        location: {
          government: '',
          city: '',
          street: '',
          apartmentNumber: '',
          address: '',
          additionalInformation: '',
        },
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        deliveryTimeDays: 1,
        tags: [],
        attachments: formData.images.map(url => ({
          url,
          filename: url.split('/').pop() || 'image.jpg',
          fileType: 'image/jpeg',
          fileSize: 0
        })),
      };

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to post request');
      }

      const data = await res.json();
      setSuccess(true);
      setTimeout(() => navigate('/request-success', { 
        state: { 
          requestId: data.data.jobRequest._id,
          category: formData.category,
          subcategory: formData.subcategory 
        }
      }), 1500);
    } catch (err) {
      setLoading(false);
      alert(err instanceof Error ? err.message : 'Failed to post request');
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-deep-teal mb-2">اختر الفئة الرئيسية</h2>
              <p className="text-gray-600">اختر الفئة التي تناسب الخدمة المطلوبة</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id || category._id || category.name}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    formData.category === category.name
                      ? 'border-deep-teal bg-deep-teal/5'
                      : 'border-gray-200 hover:border-deep-teal/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={category.icon} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-semibold text-deep-teal">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    {formData.category === category.name && (
                      <Check className="w-5 h-5 text-deep-teal mr-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {shouldShowError('category') && (
              <p className="text-red-600 text-sm text-center">{validationErrors.category}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-deep-teal mb-2">اختر الفئة الفرعية</h2>
              <p className="text-gray-600">اختر الفئة الفرعية المحددة للخدمة</p>
              {currentCategory && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">الفئة المختارة: </span>
                  <span className="font-semibold text-deep-teal">{currentCategory.name}</span>
                </div>
              )}
            </div>
            
            {currentCategory ? (
              <div key="subcategories-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCategory.subcategories.map((subcategory) => (
                  <div
                    key={subcategory.id || subcategory._id || subcategory.name}
                    onClick={() => handleSubcategoryChange(subcategory.name)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.subcategory === subcategory.name
                        ? 'border-deep-teal bg-deep-teal/5'
                        : 'border-gray-200 hover:border-deep-teal/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-deep-teal">{subcategory.name}</h3>
                        <p className="text-sm text-gray-600">{subcategory.description}</p>
                      </div>
                      {formData.subcategory === subcategory.name && (
                        <Check className="w-5 h-5 text-deep-teal mr-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div key="no-subcategories" className="text-center py-8 text-gray-500">
                لا توجد فئات فرعية متاحة
              </div>
            )}
            
            {shouldShowError('subcategory') && (
              <p className="text-red-600 text-sm text-center">{validationErrors.subcategory}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-deep-teal mb-2">تفاصيل الطلب</h2>
              <p className="text-gray-600">أجب على الأسئلة وأضف وصف مفصل للخدمة</p>
              {currentSubcategory && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">الفئة الفرعية: </span>
                  <span className="font-semibold text-deep-teal">{currentSubcategory.name}</span>
                </div>
              )}
            </div>
            
            {/* Questions */}
            {currentQuestions.length > 0 ? (
              <div key="questions-section" className="space-y-4">
                <h3 className="text-lg font-semibold text-deep-teal">الأسئلة المطلوبة:</h3>
                {currentQuestions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <FormInput
                      label={question.label}
                      value={formData.answers[`question_${index}`] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder={question.placeholder}
                      required
                      className={shouldShowError(`question_${index}`) ? 'border-red-500' : ''}
                    />
                    {shouldShowError(`question_${index}`) && (
                      <p className="text-red-600 text-sm text-right">
                        {validationErrors.answers?.[`question_${index}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-deep-teal text-right">
                اوصف طلبك بشكل مفصل (اختياري)
                <span className="text-gray-500 text-xs mr-2">
                  ({formData.requestDescription.length}/2000)
                </span>
              </label>
              <FormTextarea
                value={formData.requestDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="تفاصيل اضافية ممكن تعرفنا ازاي نساعدك بشكل احسن..."
                maxLength={2000}
                rows={4}
                className={shouldShowError('requestDescription') ? 'border-red-500' : ''}
              />
              {shouldShowError('requestDescription') && (
                <p className="text-red-600 text-sm text-right">{validationErrors.requestDescription}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-deep-teal mb-2">رفع الصور</h2>
              <p className="text-gray-600">أضف صور توضيحية للخدمة (اختياري)</p>
            </div>
            
            {/* Image Upload */}
            <div className="border-2 border-dashed border-deep-teal/30 rounded-lg p-6 text-center hover:border-deep-teal/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImages || formData.images.length >= 5}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-deep-teal mx-auto mb-2" />
                <p className="text-deep-teal font-medium mb-1">
                  {uploadingImages ? 'جاري رفع الصور...' : 'اضغط لرفع الصور'}
                </p>
                <p className="text-text-secondary text-sm">
                  يمكنك رفع حتى 5 صور (JPG, PNG) - الحد الأقصى 5 ميجابايت لكل صورة
                </p>
              </label>
            </div>

            {/* Uploaded Images Preview */}
            {formData.images.length > 0 ? (
              <div key="images-preview" className="space-y-3">
                <h4 className="text-sm font-semibold text-deep-teal">الصور المرفوعة:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`صورة ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-deep-teal/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Upload Progress */}
            {Object.keys(imageUploadProgress).length > 0 && (
              <div className="space-y-2">
                {Object.entries(imageUploadProgress).map(([fileName, isUploading]) => (
                  <div key={fileName} className="flex items-center gap-2 text-sm text-deep-teal">
                    <ImageIcon className="w-4 h-4" />
                    <span>{fileName}</span>
                    {isUploading && <span>جاري الرفع...</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex flex-col font-cairo" dir="rtl">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
            <p className="text-deep-teal">جاري تحميل البيانات...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex flex-col font-cairo" dir="rtl">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{categoriesError}</p>
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex flex-col font-cairo" dir="rtl">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <BaseCard className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 border border-gray-200">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold text-deep-teal">طلب خدمة</h1>
                <div className="text-sm text-gray-500">
                  الخطوة {currentStep} من {STEPS.length}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {STEPS.map((step) => (
                  <div key={step.id} className="text-center">
                    <div
                      onClick={() => goToStep(step.id)}
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer transition-all mx-auto mb-2 ${
                        step.id < currentStep
                          ? 'bg-deep-teal border-deep-teal text-white'
                          : step.id === currentStep
                          ? 'border-deep-teal text-deep-teal'
                          : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="font-semibold text-sm">{step.id}</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className={`font-semibold ${
                        step.id <= currentStep ? 'text-deep-teal' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-gray-500 mt-1">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Success Message */}
            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200 mb-6">
                تم إرسال الطلب بنجاح!
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={prevStep}
                disabled={currentStep === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                السابق
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  variant="primary"
                  onClick={nextStep}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  disabled={!isCurrentStepValid()}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={uploadingImages}
                >
                  إرسال الطلب
                </Button>
              )}
            </div>
          </BaseCard>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestServiceForm; 
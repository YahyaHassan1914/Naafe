import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Button from './ui/Button';
import BaseCard from './ui/BaseCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FormInput, FormTextarea } from './ui';
import UnifiedSelect from './ui/UnifiedSelect';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface RequestServiceFormData {
  category: string;
  requestDescription: string;
  images: string[]; // Array of image URLs
}

interface ValidationErrors {
  category?: string;
  requestDescription?: string;
}

const RequestServiceForm: React.FC = () => {
  const { accessToken } = useAuth();
  const [formData, setFormData] = useState<RequestServiceFormData>({
    category: '',
    requestDescription: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Category validation
    if (!formData.category.trim()) {
      errors.category = 'الفئة مطلوبة';
    }

    // Request Description validation
    if (!formData.requestDescription.trim()) {
      errors.requestDescription = 'وصف الطلب مطلوب';
    } else if (formData.requestDescription.length < 20) {
      errors.requestDescription = 'وصف الطلب يجب أن يكون 20 حرف على الأقل';
    } else if (formData.requestDescription.length > 2000) {
      errors.requestDescription = 'وصف الطلب لا يمكن أن يتجاوز 2000 حرف';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    // Validate only this specific field when it's blurred
    validateField(name as keyof ValidationErrors);
  };

  const validateField = (fieldName: keyof ValidationErrors) => {
    const errors: ValidationErrors = {};
    
    // Validate only the specific field
    switch (fieldName) {
      case 'category':
        if (!formData.category.trim()) {
          errors.category = 'الفئة مطلوبة';
        }
        break;
      case 'requestDescription':
        if (!formData.requestDescription.trim()) {
          errors.requestDescription = 'وصف الطلب مطلوب';
        } else if (formData.requestDescription.length < 20) {
          errors.requestDescription = 'وصف الطلب يجب أن يكون 20 حرف على الأقل';
        } else if (formData.requestDescription.length > 2000) {
          errors.requestDescription = 'وصف الطلب لا يمكن أن يتجاوز 2000 حرف';
        }
        break;
    }
    
    // Update only the specific field error
    setValidationErrors(prev => ({ ...prev, [fieldName]: errors[fieldName] }));
  };

  // Helper to decide if error should be shown
  const shouldShowError = (field: keyof ValidationErrors) => {
    return (touchedFields[field] || submitAttempted) && validationErrors[field];
  };

  // Helper to check if form is valid for submit button
  const isFormValid = (): boolean => {
    // Check if all required fields are filled
    const hasRequiredFields = 
      formData.category.trim() &&
      formData.requestDescription.trim();

    // Check if there are no validation errors
    const hasNoErrors = Object.keys(validationErrors).length === 0;

    return hasRequiredFields && hasNoErrors;
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Limit to 5 images
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

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`الملف ${file.name} كبير جداً. الحد الأقصى 5 ميجابايت`);
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.imageUrl]
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

  useEffect(() => {
    setCategoriesLoading(true);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data.categories)) {
          setCategories(data.data.categories.map((cat: { name: string }) => cat.name));
        } else {
          setCategoriesError('فشل تحميل الفئات');
        }
      })
      .catch(() => setCategoriesError('فشل تحميل الفئات'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is changed
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    // Mark all fields as touched ON SUBMIT ONLY
    setTouchedFields({
      category: true,
      requestDescription: true,
    });
    
    if (!validateForm()) {
      alert('يوجد أخطاء في النموذج. يرجى التأكد من صحة البيانات.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        title: `طلب خدمة - ${formData.category}`,
        description: formData.requestDescription,
        category: formData.category,
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
        deadline: undefined,
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
      setSuccess(true);
      setTimeout(() => navigate('/search/service-requests'), 1500);
    } catch (err) {
      setLoading(false);
      alert(err instanceof Error ? err.message : 'Failed to post request');
    }
  };



  return (
    <div className="min-h-screen bg-[#F5E6D3] flex flex-col font-cairo" dir="rtl">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <BaseCard className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 border border-gray-200">
            <h1 className="text-3xl font-extrabold text-[#0e1b18] text-center mb-8">طلب خدمة</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#0e1b18] text-right mb-2" htmlFor="category">الفئة</label>
                <UnifiedSelect
                  value={formData.category}
                  onChange={val => setFormData(prev => ({ ...prev, category: val }))}
                  options={categories.map((cat: string) => ({ value: cat, label: cat }))}
                  placeholder="اختر الفئة"
                  required
                  disabled={categoriesLoading}
                  size="md"
                  className={shouldShowError('category') ? 'border-red-500' : ''}
                />
                {shouldShowError('category') && <p className="text-red-600 text-sm text-right mt-1">{validationErrors.category}</p>}
                {categoriesError && <div className="text-red-600 text-sm text-right bg-red-50 p-2 rounded-lg border border-red-200 mt-2">{categoriesError}</div>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#0e1b18] text-right mb-2" htmlFor="requestDescription">
                  وصف الطلب
                  <span className="text-gray-500 text-xs mr-2">
                    ({formData.requestDescription.length}/2000)
                  </span>
                </label>
                <FormTextarea
                  id="requestDescription"
                  name="requestDescription"
                  value={formData.requestDescription}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="وصف مفصل للخدمة المطلوبة..."
                  required
                  size="md"
                  maxLength={2000}
                  className={shouldShowError('requestDescription') ? 'border-red-500' : ''}
                />
                {shouldShowError('requestDescription') && <p className="text-red-600 text-sm text-right mt-1">{validationErrors.requestDescription}</p>}
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-[#0e1b18] text-right mb-2">
                  صور توضيحية للخدمة (اختياري)
                </label>
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
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-deep-teal mb-3">الصور المرفوعة:</h4>
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
                )}

                {/* Upload Progress */}
                {Object.keys(imageUploadProgress).length > 0 && (
                  <div className="mt-3">
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
              
              {success && <div className="text-green-600 text-sm text-right bg-green-50 p-3 rounded-lg border border-green-200">تم إرسال الطلب بنجاح!</div>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="rounded-xl"
                disabled={!isFormValid()}
              >
                إرسال الطلب
              </Button>
            </form>
          </BaseCard>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestServiceForm; 
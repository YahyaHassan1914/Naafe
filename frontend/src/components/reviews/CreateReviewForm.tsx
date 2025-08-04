import React, { useState } from 'react';
import { Star, Upload, XCircle, Image, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface CreateReviewFormProps {
  requestId: string;
  providerId: string;
  providerName: string;
  serviceTitle: string;
  onSuccess: (reviewData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface ReviewCategory {
  id: string;
  label: string;
  description: string;
}

const CreateReviewForm: React.FC<CreateReviewFormProps> = ({
  requestId,
  providerId,
  providerName,
  serviceTitle,
  onSuccess,
  onError,
  onCancel
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API hooks
  const { mutate: submitReview, loading: submittingReview } = useApi('/reviews', 'POST');

  const reviewCategories: ReviewCategory[] = [
    {
      id: 'quality',
      label: 'جودة العمل',
      description: 'مدى جودة الخدمة المقدمة'
    },
    {
      id: 'communication',
      label: 'التواصل',
      description: 'سهولة التواصل والاستجابة'
    },
    {
      id: 'punctuality',
      label: 'الالتزام بالمواعيد',
      description: 'الوصول في الوقت المحدد'
    },
    {
      id: 'cleanliness',
      label: 'النظافة',
      description: 'الحفاظ على نظافة المكان'
    },
    {
      id: 'professionalism',
      label: 'الاحترافية',
      description: 'السلوك المهني والاحترافي'
    },
    {
      id: 'value',
      label: 'قيمة مقابل السعر',
      description: 'مدى تناسب السعر مع الخدمة'
    }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'يرجى إعطاء تقييم';
    }

    if (!title.trim()) {
      newErrors.title = 'عنوان التقييم مطلوب';
    } else if (title.trim().length < 5) {
      newErrors.title = 'العنوان يجب أن يكون 5 أحرف على الأقل';
    }

    if (!comment.trim()) {
      newErrors.comment = 'تعليق التقييم مطلوب';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'التعليق يجب أن يكون 10 أحرف على الأقل';
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = 'يرجى اختيار فئة واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setErrors(prev => ({
        ...prev,
        photos: 'بعض الصور غير صالحة. يرجى التأكد من أن الملفات صور وحجمها أقل من 5MB'
      }));
    }

    if (photos.length + validFiles.length > 5) {
      setErrors(prev => ({
        ...prev,
        photos: 'يمكن رفع 5 صور كحد أقصى'
      }));
      return;
    }

    setPhotos(prev => [...prev, ...validFiles]);
    if (errors.photos) {
      setErrors(prev => ({ ...prev, photos: '' }));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('requestId', requestId);
      formData.append('providerId', providerId);
      formData.append('rating', rating.toString());
      formData.append('title', title);
      formData.append('comment', comment);
      formData.append('categories', JSON.stringify(selectedCategories));
      formData.append('isAnonymous', isAnonymous.toString());

      photos.forEach((photo, index) => {
        formData.append(`photos_${index}`, photo);
      });

      const response = await submitReview(formData);
      onSuccess(response);
    } catch (error) {
      console.error('Review submission error:', error);
      onError('حدث خطأ في إرسال التقييم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">تقييم الخدمة</h2>
          <p className="text-sm text-gray-500">شارك تجربتك مع {providerName}</p>
        </div>
      </div>

      {/* Service Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">تفاصيل الخدمة</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div>الخدمة: {serviceTitle}</div>
          <div>مقدم الخدمة: {providerName}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">التقييم العام</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="text-sm text-gray-500 mr-3">
              {rating > 0 && `${rating} من 5`}
            </span>
          </div>
          {errors.rating && (
            <p className="text-red-600 text-sm mt-2">{errors.rating}</p>
          )}
        </div>

        {/* Review Categories */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">فئات التقييم</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviewCategories.map((category) => (
              <div
                key={category.id}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedCategories.includes(category.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 rounded-full flex items-center justify-center">
                    {selectedCategories.includes(category.id) && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{category.label}</h4>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.categories && (
            <p className="text-red-600 text-sm mt-2">{errors.categories}</p>
          )}
        </div>

        {/* Review Title */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">عنوان التقييم</h3>
          <FormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اكتب عنواناً مختصراً لتقييمك"
            error={errors.title}
            maxLength={100}
          />
          <p className="text-sm text-gray-500 mt-1">
            {title.length}/100 حرف
          </p>
        </div>

        {/* Review Comment */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">التعليق</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شارك تفاصيل تجربتك مع مقدم الخدمة. ما الذي أعجبك؟ وما الذي يمكن تحسينه؟"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.comment ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={4}
            maxLength={500}
          />
          {errors.comment && (
            <p className="text-red-600 text-sm mt-2">{errors.comment}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {comment.length}/500 حرف
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">إضافة صور (اختياري)</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                اسحب الصور هنا أو انقر للاختيار
              </p>
              <p className="text-xs text-gray-500">
                صور JPG أو PNG، الحد الأقصى 5MB لكل صورة
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="inline-block mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200"
              >
                اختيار صور
              </label>
            </div>
          </div>
          
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {errors.photos && (
            <p className="text-red-600 text-sm mt-2">{errors.photos}</p>
          )}
        </div>

        {/* Anonymous Review */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-700">
            نشر التقييم بشكل مجهول
          </label>
        </div>

        {/* Review Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">إرشادات التقييم</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• كن صادقاً وموضوعياً في تقييمك</li>
            <li>• تجنب اللغة المسيئة أو التعليقات الشخصية</li>
            <li>• ركز على جودة الخدمة والتجربة</li>
            <li>• الصور تساعد الآخرين في اتخاذ قرارات أفضل</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            loading={isProcessing || submittingReview}
            disabled={rating === 0 || isProcessing}
            className="flex-1"
          >
            إرسال التقييم
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateReviewForm; 
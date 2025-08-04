import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import CreateReviewForm from '../../components/reviews/CreateReviewForm';
import Button from '../../components/ui/Button';

interface ServiceRequest {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  status: string;
  provider: {
    id: string;
    name: string;
    avatar?: string;
  };
  seeker: {
    id: string;
    name: string;
  };
  completedAt?: string;
}

const CreateReviewPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API hooks
  const { data: requestData, loading: loadingRequest, error: requestError } = useApi(
    `/requests/${requestId}`
  );

  const { mutate: submitReview, loading: submittingReview } = useApi('/reviews', 'POST');

  useEffect(() => {
    if (requestError) {
      setError('تعذر تحميل تفاصيل الخدمة');
    }
  }, [requestError]);

  const handleReviewSuccess = (reviewData: any) => {
    setShowSuccess(true);
    // Redirect after 3 seconds
    setTimeout(() => {
      navigate(`/requests/${requestId}`);
    }, 3000);
  };

  const handleReviewError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleCancel = () => {
    navigate(`/requests/${requestId}`);
  };

  if (loadingRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">جاري تحميل تفاصيل الخدمة...</p>
        </div>
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطأ في التحميل</h2>
            <p className="text-gray-600 mb-6">{error || 'تعذر تحميل تفاصيل الخدمة'}</p>
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const request: ServiceRequest = requestData.request;

  // Check if user can review this request
  if (request.seeker.id !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">غير مصرح</h2>
            <p className="text-gray-600 mb-6">لا يمكنك تقييم هذه الخدمة</p>
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if request is completed
  if (request.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">الخدمة لم تكتمل بعد</h2>
            <p className="text-gray-600 mb-6">يمكنك تقييم الخدمة فقط بعد اكتمالها</p>
            <Button onClick={() => navigate(`/requests/${requestId}`)}>
              العودة لتفاصيل الخدمة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">تم إرسال التقييم بنجاح</h2>
            <p className="text-gray-600 mb-6">
              شكراً لك على تقييمك! سيساعد هذا التقييم الآخرين في اتخاذ قرارات أفضل.
            </p>
            <div className="text-sm text-gray-500">
              جاري إعادة التوجيه...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 ml-2" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تقييم الخدمة</h1>
              <p className="text-gray-600">شارك تجربتك مع {request.provider.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Form */}
          <div className="lg:col-span-2">
            <CreateReviewForm
              requestId={requestId!}
              providerId={request.provider.id}
              providerName={request.provider.name}
              serviceTitle={request.title}
              onSuccess={handleReviewSuccess}
              onError={handleReviewError}
              onCancel={handleCancel}
            />
          </div>

          {/* Service Details Sidebar */}
          <div className="space-y-6">
            {/* Service Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">تفاصيل الخدمة</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">الخدمة:</span>
                  <p className="font-medium text-gray-900">{request.title}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">الفئة:</span>
                  <p className="font-medium text-gray-900">{request.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">النوع:</span>
                  <p className="font-medium text-gray-900">{request.subcategory}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">تاريخ الإنجاز:</span>
                  <p className="font-medium text-gray-900">
                    {request.completedAt ? new Date(request.completedAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">مقدم الخدمة</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {request.provider.avatar ? (
                    <img
                      src={request.provider.avatar}
                      alt={request.provider.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {request.provider.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{request.provider.name}</h4>
                  <p className="text-sm text-gray-500">مقدم خدمة موثق</p>
                </div>
              </div>
            </div>

            {/* Review Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">نصائح للتقييم الجيد</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• كن صادقاً وموضوعياً في تقييمك</li>
                <li>• ركز على جودة العمل والخدمة المقدمة</li>
                <li>• اذكر النقاط الإيجابية والسلبية</li>
                <li>• تجنب اللغة المسيئة أو التعليقات الشخصية</li>
                <li>• الصور تساعد في توضيح تجربتك</li>
              </ul>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReviewPage; 
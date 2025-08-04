import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import CreateOfferForm from '../../components/offers/CreateOfferForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeft, 
  AlertCircle, 
  Clock, 
  MapPin, 
  User, 
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import Button from '../../components/ui/Button';

const CreateOfferPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { useServiceRequest, useCreateOffer } = useApi();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    timeline: {
      startDate: '',
      duration: '',
      estimatedDays: ''
    },
    scopeOfWork: '',
    materialsIncluded: [],
    warranty: '',
    paymentSchedule: {
      deposit: '',
      milestone: '',
      final: ''
    },
    additionalServices: [],
    terms: '',
    availability: {
      immediate: false,
      specificDate: '',
      flexible: false
    }
  });

  const serviceRequestQuery = useServiceRequest(requestId || '');
  const createOfferMutation = useCreateOffer();

  const request = serviceRequestQuery.data?.data;
  const isLoading = serviceRequestQuery.isLoading;
  const error = serviceRequestQuery.error;

  // Check if user is a provider
  useEffect(() => {
    if (user && !user.roles.includes('provider')) {
      showToast('يجب أن تكون مزود خدمة لإنشاء عرض', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, showToast]);

  // Check if user already has an offer for this request
  useEffect(() => {
    if (request && user) {
      const hasExistingOffer = request.offers?.some(
        (offer: any) => offer.providerId === user.id
      );
      if (hasExistingOffer) {
        showToast('لديك عرض مسبق لهذا الطلب', 'warning');
        navigate(`/requests/${requestId}`);
      }
    }
  }, [request, user, requestId, navigate, showToast]);

  const handleSubmit = async (offerData: any) => {
    if (!requestId || !user) return;

    setIsSubmitting(true);
    try {
      const result = await createOfferMutation.mutateAsync({
        requestId,
        ...offerData
      });

      if (result) {
        showToast('تم إنشاء العرض بنجاح!', 'success');
        navigate(`/offers/${result._id}`, {
          state: { 
            message: 'تم إنشاء العرض بنجاح! سيتم إخطار صاحب الطلب.',
            type: 'success'
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to create offer:', error);
      showToast(
        error?.message || 'حدث خطأ أثناء إنشاء العرض',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/requests/${requestId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'عاجل';
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return 'غير محدد';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="جاري تحميل تفاصيل الطلب..." />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              حدث خطأ في تحميل الطلب
            </h3>
            <p className="text-gray-600 mb-4">
              يرجى المحاولة مرة أخرى
            </p>
            <Button onClick={() => serviceRequestQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              الطلب غير موجود
            </h3>
            <p className="text-gray-600 mb-4">
              قد يكون الطلب قد تم حذفه أو إزالته
            </p>
            <Button onClick={() => navigate('/requests')}>
              العودة إلى الطلبات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 space-x-reverse mb-4">
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-text-primary">
              إنشاء عرض جديد
            </h1>
          </div>
          <p className="text-text-secondary">
            قدم عرضك لطلب الخدمة هذا. تأكد من أن عرضك تنافسي وعادل.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                تفاصيل الطلب
              </h3>

              <div className="space-y-4">
                {/* Request Title */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {request.title || 'طلب خدمة'}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {request.description}
                  </p>
                </div>

                {/* Category */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {request.category?.name} - {request.subcategory?.name}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {request.location?.governorate}, {request.location?.city}
                  </span>
                </div>

                {/* Urgency */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                    {getUrgencyText(request.urgency)}
                  </span>
                </div>

                {/* Budget Range */}
                {request.budget && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      الميزانية: {request.budget.toLocaleString()} ج.م
                    </span>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    تاريخ النشر: {formatDate(request.createdAt)}
                  </span>
                </div>

                {/* Seeker Info */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {request.seekerId?.firstName} {request.seekerId?.lastName}
                  </span>
                </div>

                {/* Offers Count */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">عدد العروض</span>
                    <span className="text-sm font-medium text-gray-900">
                      {request.offers?.length || 0} عرض
                    </span>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 نصائح لعرض ناجح
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• اقرأ الطلب بعناية</li>
                    <li>• قدم سعراً تنافسياً</li>
                    <li>• اذكر تفاصيل العمل</li>
                    <li>• حدد جدول زمني واقعي</li>
                    <li>• اذكر الضمان المقدم</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Offer Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {isSubmitting ? (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" text="جاري إنشاء العرض..." />
                </div>
              ) : (
                <CreateOfferForm
                  request={request}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  initialData={formData}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateOfferPage; 
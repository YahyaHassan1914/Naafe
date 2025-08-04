import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import OfferDetails from '../../components/offers/OfferDetails';
import OfferActions from '../../components/offers/OfferActions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  DollarSign,
  Calendar,
  User,
  MapPin,
  FileText,
  Star
} from 'lucide-react';
import Button from '../../components/ui/Button';

const OfferDetailsPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { useOffer, useAcceptOffer, useRejectOffer, useUpdateOffer } = useApi();

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);

  const offerQuery = useOffer(offerId || '');
  const acceptOfferMutation = useAcceptOffer();
  const rejectOfferMutation = useRejectOffer();
  const updateOfferMutation = useUpdateOffer();

  const offer = offerQuery.data?.data;
  const isLoading = offerQuery.isLoading;
  const error = offerQuery.error;

  // Check if user has permission to view this offer
  useEffect(() => {
    if (offer && user) {
      const isOwner = offer.providerId === user.id;
      const isRequestOwner = offer.requestId?.seekerId === user.id;
      
      if (!isOwner && !isRequestOwner && !user.roles.includes('admin')) {
        showToast('ليس لديك صلاحية لعرض هذا العرض', 'error');
        navigate('/offers');
      }
    }
  }, [offer, user, navigate, showToast]);

  const handleAcceptOffer = async () => {
    if (!offerId) return;

    setIsActionLoading(true);
    try {
      const result = await acceptOfferMutation.mutateAsync(offerId);
      if (result) {
        showToast('تم قبول العرض بنجاح!', 'success');
        offerQuery.refetch();
      }
    } catch (error: any) {
      console.error('Failed to accept offer:', error);
      showToast(
        error?.message || 'حدث خطأ أثناء قبول العرض',
        'error'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectOffer = async (reason?: string) => {
    if (!offerId) return;

    setIsActionLoading(true);
    try {
      const result = await rejectOfferMutation.mutateAsync({
        offerId,
        reason
      });
      if (result) {
        showToast('تم رفض العرض', 'info');
        offerQuery.refetch();
      }
    } catch (error: any) {
      console.error('Failed to reject offer:', error);
      showToast(
        error?.message || 'حدث خطأ أثناء رفض العرض',
        'error'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartNegotiation = () => {
    setShowNegotiation(true);
  };

  const handleUpdateOffer = async (updatedData: any) => {
    if (!offerId) return;

    setIsActionLoading(true);
    try {
      const result = await updateOfferMutation.mutateAsync({
        offerId,
        ...updatedData
      });
      if (result) {
        showToast('تم تحديث العرض بنجاح!', 'success');
        offerQuery.refetch();
        setShowNegotiation(false);
      }
    } catch (error: any) {
      console.error('Failed to update offer:', error);
      showToast(
        error?.message || 'حدث خطأ أثناء تحديث العرض',
        'error'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'accepted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'negotiating':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'expired':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'accepted':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      case 'negotiating':
        return 'قيد التفاوض';
      case 'expired':
        return 'منتهي الصلاحية';
      default:
        return 'غير محدد';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      case 'negotiating':
        return <MessageSquare className="h-5 w-5" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="جاري تحميل تفاصيل العرض..." />
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
              حدث خطأ في تحميل العرض
            </h3>
            <p className="text-gray-600 mb-4">
              يرجى المحاولة مرة أخرى
            </p>
            <Button onClick={() => offerQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!offer) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              العرض غير موجود
            </h3>
            <p className="text-gray-600 mb-4">
              قد يكون العرض قد تم حذفه أو إزالته
            </p>
            <Button onClick={() => navigate('/offers')}>
              العودة إلى العروض
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner = offer.providerId === user?.id;
  const isRequestOwner = offer.requestId?.seekerId === user?.id;
  const canAccept = isRequestOwner && offer.status === 'pending';
  const canReject = isRequestOwner && ['pending', 'negotiating'].includes(offer.status);
  const canNegotiate = (isOwner || isRequestOwner) && ['pending', 'negotiating'].includes(offer.status);

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 space-x-reverse mb-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary">
                تفاصيل العرض
              </h1>
              <p className="text-text-secondary mt-1">
                عرض لطلب: {offer.requestId?.title || 'طلب خدمة'}
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(offer.status)}`}>
                {getStatusText(offer.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <OfferDetails 
                offer={offer}
                showNegotiation={showNegotiation}
                onStartNegotiation={handleStartNegotiation}
                onUpdateOffer={handleUpdateOffer}
                isActionLoading={isActionLoading}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ملخص الطلب
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {offer.requestId?.category?.name} - {offer.requestId?.subcategory?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {offer.requestId?.location?.governorate}, {offer.requestId?.location?.city}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {offer.requestId?.seekerId?.firstName} {offer.requestId?.seekerId?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      تاريخ النشر: {formatDate(offer.requestId?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  معلومات المزود
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {offer.providerId?.firstName} {offer.providerId?.lastName}
                      </p>
                      {offer.providerId?.rating && (
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{offer.providerId.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {offer.providerId?.location?.governorate}, {offer.providerId?.location?.city}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      عضو منذ: {formatDate(offer.providerId?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  الإجراءات
                </h3>
                <OfferActions
                  offer={offer}
                  isOwner={isOwner}
                  isRequestOwner={isRequestOwner}
                  canAccept={canAccept}
                  canReject={canReject}
                  canNegotiate={canNegotiate}
                  onAccept={handleAcceptOffer}
                  onReject={handleRejectOffer}
                  onNegotiate={handleStartNegotiation}
                  isLoading={isActionLoading}
                />
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  الجدول الزمني
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">تاريخ العرض</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(offer.createdAt)}
                    </span>
                  </div>
                  {offer.updatedAt && offer.updatedAt !== offer.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">آخر تحديث</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(offer.updatedAt)}
                      </span>
                    </div>
                  )}
                  {offer.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">تاريخ انتهاء الصلاحية</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(offer.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OfferDetailsPage; 
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Calendar, 
  MessageCircle, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Share2
} from 'lucide-react';
import { serviceRequestService } from '../../services';

const ServiceRequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { useServiceRequest, useOffersByRequest } = useApi();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const serviceRequestQuery = useServiceRequest(id || '');
  const offersQuery = useOffersByRequest(id || '');

  const request = serviceRequestQuery.data?.data;
  const offers = offersQuery.data?.data || [];
  const isLoading = serviceRequestQuery.isLoading || offersQuery.isLoading;
  const error = serviceRequestQuery.error || offersQuery.error;

  const isOwner = user && request && request.seekerId._id === user.id;
  const isProvider = user && user.roles.includes('provider');
  const canEdit = isOwner && request && serviceRequestService.canEdit(request, user.id);
  const canCancel = request && user && serviceRequestService.canCancel(request, user.id);
  const hasApplied = isProvider && offers.some(offer => offer.providerId === user?.id);

  // Handler functions
  const handleEdit = () => navigate(`/requests/${id}/edit`);
  const handleApply = () => navigate(`/requests/${id}/apply`);
  const handleContact = () => {
    if (!request) return;
    navigate(`/chat/new?seeker=${request.seekerId._id}`);
  };
  const handleViewOffers = () => navigate(`/requests/${id}/offers`);
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: request?.description || 'طلب خدمة',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط إلى الحافظة');
    }
  };

  const handleDelete = async () => {
    if (!request || !user) return;
    
    setIsDeleting(true);
    try {
      await serviceRequestService.deleteServiceRequest(request._id);
      navigate('/requests', {
        state: {
          message: 'تم حذف طلب الخدمة بنجاح',
          type: 'success'
        }
      });
    } catch (error: any) {
      console.error('Failed to delete service request:', error);
      alert(error?.message || 'حدث خطأ أثناء حذف طلب الخدمة');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ أقل من ساعة';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 48) return 'منذ يوم';
    if (diffInHours < 168) return `منذ ${Math.floor(diffInHours / 24)} أيام`;
    return formatDate(dateString);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'negotiating': return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'assigned': return <User className="w-5 h-5 text-purple-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <LoadingSpinner size="lg" text="جاري تحميل تفاصيل الطلب..." />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <Layout>
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="mb-4">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-4">
                {error ? 'حدث خطأ أثناء تحميل الطلب' : 'الطلب غير موجود'}
              </h1>
              <p className="text-text-secondary mb-6">
                {error ? 'يرجى المحاولة مرة أخرى' : 'قد يكون الطلب قد تم حذفه أو إزالته'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate(-1)}>
                  رجوع
                </Button>
                <Button variant="outline" onClick={() => navigate('/requests')}>
                  عرض جميع الطلبات
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>رجوع</span>
              </Button>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text-primary">
                  تفاصيل طلب الخدمة
                </h1>
                <p className="text-text-secondary">
                  {request.category} - {request.subcategory}
                </p>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2 space-x-reverse"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة</span>
                </Button>

                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <Edit className="w-4 h-4" />
                    <span>تعديل</span>
                  </Button>
                )}

                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 space-x-reverse text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Success message */}
          {location.state?.message && (
            <div className={`mb-6 p-4 rounded-lg ${
              location.state.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {location.state.message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    حالة الطلب
                  </h2>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getStatusIcon(request.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${serviceRequestService.getStatusColor(request.status)}`}>
                      {serviceRequestService.getStatusName(request.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-secondary">تاريخ النشر:</span>
                    <span className="font-medium">{formatTimeAgo(request.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-secondary">ينتهي في:</span>
                    <span className="font-medium">{serviceRequestService.formatExpirationTime(request)}</span>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <MessageCircle className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-secondary">عدد العروض:</span>
                    <span className="font-medium">{offers.length}</span>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <AlertCircle className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-secondary">الأولوية:</span>
                    <span className="font-medium">{serviceRequestService.getUrgencyName(request.urgency)}</span>
                  </div>
                </div>
              </div>

              {/* Request Description */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  وصف الطلب
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
              </div>

              {/* Custom Answers */}
              {request.answers && request.answers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">
                    إجابات إضافية
                  </h2>
                  <div className="space-y-4">
                    {request.answers.map((answer, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <h3 className="font-medium text-text-primary mb-2">
                          {answer.question}
                        </h3>
                        <p className="text-text-secondary">
                          {answer.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {request.images && request.images.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">
                    الصور المرفقة
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {request.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(image.url, '_blank')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            عرض
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  الموقع
                </h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-primary">
                    {request.location.governorate}، {request.location.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Requester Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  معلومات صاحب الطلب
                </h2>
                <div className="flex items-center space-x-3 space-x-reverse mb-4">
                  <img
                    src={request.seekerId.avatarUrl || '/default-avatar.png'}
                    alt={request.seekerId.name.first}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div>
                    <h3 className="font-medium text-text-primary">
                      {request.seekerId.name.first} {request.seekerId.name.last}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      عضو منذ {formatDate(request.seekerId.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleContact}
                    className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل مع صاحب الطلب</span>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  الإجراءات
                </h2>
                <div className="space-y-3">
                  {isProvider && !hasApplied && request.status === 'open' && (
                    <Button
                      variant="primary"
                      onClick={handleApply}
                      className="w-full"
                    >
                      تقدم للعمل
                    </Button>
                  )}

                  {isProvider && hasApplied && (
                    <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-800">لقد تقدمت لهذا الطلب</p>
                    </div>
                  )}

                  {offers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleViewOffers}
                      className="w-full"
                    >
                      عرض العروض ({offers.length})
                    </Button>
                  )}

                  {request.assignedTo && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">تم التعيين لـ:</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <img
                          src={request.assignedTo.avatarUrl || '/default-avatar.png'}
                          alt={request.assignedTo.name.first}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-green-700">
                          {request.assignedTo.name.first} {request.assignedTo.name.last}
                        </span>
                      </div>
                      {request.assignedTo.providerProfile && (
                        <div className="flex items-center space-x-1 space-x-reverse mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-green-700">
                            {request.assignedTo.providerProfile.rating.toFixed(1)} 
                            ({request.assignedTo.providerProfile.totalJobsCompleted} مهمة)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  إحصائيات سريعة
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">عدد العروض</span>
                    <span className="font-medium">{offers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">الأولوية</span>
                    <span className="font-medium">{serviceRequestService.getUrgencyName(request.urgency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">تاريخ النشر</span>
                    <span className="font-medium">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">آخر تحديث</span>
                    <span className="font-medium">{formatDate(request.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                تأكيد الحذف
              </h3>
              <p className="text-text-secondary mb-6">
                هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex space-x-3 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'جاري الحذف...' : 'حذف'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ServiceRequestDetailsPage; 
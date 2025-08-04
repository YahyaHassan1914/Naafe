import React from 'react';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  Star,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Button from '../ui/Button';

interface OfferCardProps {
  offer: any;
  onClick: () => void;
  viewMode: 'grid' | 'list';
  showActions?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onClick,
  viewMode,
  showActions = true
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'negotiating':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
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

  const calculatePaymentBreakdown = () => {
    const deposit = offer.paymentSchedule?.deposit || 0;
    const milestone = offer.paymentSchedule?.milestone || 0;
    const final = offer.paymentSchedule?.final || 0;
    const total = offer.price || 0;

    return {
      deposit: { amount: deposit, percentage: total > 0 ? Math.round((deposit / total) * 100) : 0 },
      milestone: { amount: milestone, percentage: total > 0 ? Math.round((milestone / total) * 100) : 0 },
      final: { amount: final, percentage: total > 0 ? Math.round((final / total) * 100) : 0 }
    };
  };

  const paymentBreakdown = calculatePaymentBreakdown();

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                عرض لطلب: {offer.requestId?.title || 'طلب خدمة'}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(offer.status)}`}>
                {getStatusText(offer.status)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(offer.requestId?.urgency)}`}>
                {getUrgencyText(offer.requestId?.urgency)}
              </span>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price and Timeline */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(offer.price)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    {offer.timeline?.startDate ? formatDate(offer.timeline.startDate) : 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">
                    {offer.timeline?.duration || 'غير محدد'}
                  </span>
                </div>
              </div>

              {/* Request Details */}
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
                    {offer.providerId?.firstName} {offer.providerId?.lastName}
                  </span>
                  {offer.providerId?.rating && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-600">{offer.providerId.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">جدول الدفع</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>عند البدء:</span>
                    <span>{formatCurrency(paymentBreakdown.deposit.amount)} ({paymentBreakdown.deposit.percentage}%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>عند الإنجاز:</span>
                    <span>{formatCurrency(paymentBreakdown.milestone.amount)} ({paymentBreakdown.milestone.percentage}%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>عند التسليم:</span>
                    <span>{formatCurrency(paymentBreakdown.final.amount)} ({paymentBreakdown.final.percentage}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope of Work Preview */}
            {offer.scopeOfWork && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {offer.scopeOfWork}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2 space-x-reverse mr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {offer.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle negotiation
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>تاريخ العرض: {formatDate(offer.createdAt)}</span>
            <span>رقم العرض: #{offer._id.slice(-6)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(offer.status)}`}>
            {getStatusText(offer.status)}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(offer.requestId?.urgency)}`}>
            {getUrgencyText(offer.requestId?.urgency)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(offer.createdAt)}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        عرض لطلب: {offer.requestId?.title || 'طلب خدمة'}
      </h3>

      {/* Price */}
      <div className="flex items-center space-x-2 space-x-reverse mb-4">
        <DollarSign className="h-5 w-5 text-green-600" />
        <span className="text-xl font-bold text-gray-900">
          {formatCurrency(offer.price)}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-600">
            {offer.timeline?.startDate ? formatDate(offer.timeline.startDate) : 'غير محدد'}
          </span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Clock className="h-4 w-4 text-purple-600" />
          <span className="text-sm text-gray-600">
            {offer.timeline?.duration || 'غير محدد'}
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
            {offer.providerId?.firstName} {offer.providerId?.lastName}
          </span>
          {offer.providerId?.rating && (
            <div className="flex items-center space-x-1 space-x-reverse">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600">{offer.providerId.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scope Preview */}
      {offer.scopeOfWork && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {offer.scopeOfWork}
          </p>
        </div>
      )}

      {/* Payment Breakdown */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-700 mb-2">جدول الدفع</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>عند البدء:</span>
            <span>{paymentBreakdown.deposit.percentage}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>عند الإنجاز:</span>
            <span>{paymentBreakdown.milestone.percentage}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>عند التسليم:</span>
            <span>{paymentBreakdown.final.percentage}%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            عرض التفاصيل
          </Button>
          {offer.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle negotiation
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          رقم العرض: #{offer._id.slice(-6)}
        </div>
      </div>
    </div>
  );
};

export default OfferCard; 
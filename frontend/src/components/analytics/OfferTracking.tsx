import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar, MapPin, User, MessageSquare, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';

interface OfferTrackingData {
  offerId: string;
  requestId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'negotiating';
  price: number;
  timeline: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  responseTime: number; // in minutes
  negotiationDuration: number; // in minutes
  viewCount: number;
  messageCount: number;
  counterOffers: number;
  finalPrice?: number;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  provider: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    completedJobs: number;
  };
  client: {
    id: string;
    name: string;
    avatar?: string;
  };
  request: {
    id: string;
    title: string;
    category: string;
    subcategory: string;
    urgency: string;
    location: {
      governorate: string;
      city: string;
    };
  };
  timeline: Array<{
    timestamp: string;
    action: string;
    description: string;
    actor: string;
  }>;
  performance: {
    responseTimeRank: number; // percentile
    priceCompetitiveness: number; // percentile
    negotiationEffectiveness: number; // percentile
    overallScore: number; // 0-100
  };
}

interface OfferTrackingProps {
  offerId: string;
  showDetails?: boolean;
}

const OfferTracking: React.FC<OfferTrackingProps> = ({
  offerId,
  showDetails = true
}) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(showDetails);

  // API hooks
  const { data: trackingData, loading, error } = useApi(`/analytics/offers/${offerId}/tracking`);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ساعة ${remainingMinutes > 0 ? `${remainingMinutes} دقيقة` : ''}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-100 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'expired': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'negotiating': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      case 'negotiating': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    return 'يحتاج تحسين';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">تعذر تحميل بيانات التتبع</p>
        </div>
      </div>
    );
  }

  const data = trackingData as OfferTrackingData;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusColor(data.status)}`}>
              {getStatusIcon(data.status)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">تتبع العرض #{data.offerId}</h3>
              <p className="text-sm text-gray-500">{data.request.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(data.status)}`}>
              {data.status === 'accepted' ? 'مقبول' :
               data.status === 'rejected' ? 'مرفوض' :
               data.status === 'pending' ? 'قيد المراجعة' :
               data.status === 'expired' ? 'منتهي الصلاحية' :
               data.status === 'negotiating' ? 'قيد المفاوضة' : data.status}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              <Eye className="w-4 h-4 ml-2" />
              {expanded ? 'إخفاء' : 'عرض'}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">السعر</p>
            <p className="font-medium text-gray-900">{formatCurrency(data.price)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">وقت الاستجابة</p>
            <p className="font-medium text-gray-900">{formatDuration(data.responseTime)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">المشاهدات</p>
            <p className="font-medium text-gray-900">{data.viewCount}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">الرسائل</p>
            <p className="font-medium text-gray-900">{data.messageCount}</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 space-y-6">
          {/* Performance Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">مقاييس الأداء</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">الدرجة الإجمالية</p>
                <p className={`text-lg font-bold ${getPerformanceColor(data.performance.overallScore)}`}>
                  {data.performance.overallScore}/100
                </p>
                <p className="text-xs text-gray-500">{getPerformanceLabel(data.performance.overallScore)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">سرعة الاستجابة</p>
                <p className="text-lg font-bold text-gray-900">{data.performance.responseTimeRank}%</p>
                <p className="text-xs text-gray-500">أسرع من {100 - data.performance.responseTimeRank}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">تنافسية السعر</p>
                <p className="text-lg font-bold text-gray-900">{data.performance.priceCompetitiveness}%</p>
                <p className="text-xs text-gray-500">أفضل من {100 - data.performance.priceCompetitiveness}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">فعالية المفاوضة</p>
                <p className="text-lg font-bold text-gray-900">{data.performance.negotiationEffectiveness}%</p>
                <p className="text-xs text-gray-500">أفضل من {100 - data.performance.negotiationEffectiveness}%</p>
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">تفاصيل العرض</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">السعر المقترح:</span>
                  <span className="font-medium">{formatCurrency(data.price)}</span>
                </div>
                {data.finalPrice && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">السعر النهائي:</span>
                    <span className="font-medium">{formatCurrency(data.finalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">المدة المقترحة:</span>
                  <span className="font-medium">{data.timeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">العروض المضادة:</span>
                  <span className="font-medium">{data.counterOffers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">مدة المفاوضة:</span>
                  <span className="font-medium">{formatDuration(data.negotiationDuration)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">تفاصيل الطلب</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">الفئة:</span>
                  <span className="font-medium">{data.request.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">النوع:</span>
                  <span className="font-medium">{data.request.subcategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">الاستعجال:</span>
                  <span className="font-medium">{data.request.urgency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">الموقع:</span>
                  <span className="font-medium">{data.request.location.governorate} - {data.request.location.city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الجدول الزمني</h4>
            <div className="space-y-3">
              {data.timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{event.action}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">بواسطة: {event.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">معلومات مقدم الخدمة</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{data.provider.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>التقييم: {data.provider.rating}/5</span>
                  <span>الوظائف المكتملة: {data.provider.completedJobs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Details */}
          {data.status === 'rejected' && data.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">سبب الرفض</h4>
              <p className="text-sm text-red-700">{data.rejectionReason}</p>
            </div>
          )}

          {data.status === 'accepted' && data.acceptedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">تم القبول</h4>
              <p className="text-sm text-green-700">تم قبول العرض في {formatTimestamp(data.acceptedAt)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfferTracking; 
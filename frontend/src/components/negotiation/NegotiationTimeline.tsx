import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, MessageSquare, User, Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'offer_created' | 'counter_offer' | 'offer_accepted' | 'offer_rejected' | 'message' | 'status_update';
  timestamp: string;
  title: string;
  description: string;
  actor: {
    id: string;
    name: string;
    role: 'client' | 'provider';
    avatar?: string;
  };
  data?: {
    price?: number;
    previousPrice?: number;
    timeline?: string;
    scope?: string;
    paymentSchedule?: string;
    reason?: string;
    status?: string;
  };
}

interface NegotiationTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const NegotiationTimeline: React.FC<NegotiationTimelineProps> = ({
  events,
  loading = false
}) => {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'offer_created':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'counter_offer':
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      case 'offer_accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offer_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
      case 'status_update':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'offer_created':
        return 'border-blue-200 bg-blue-50';
      case 'counter_offer':
        return 'border-orange-200 bg-orange-50';
      case 'offer_accepted':
        return 'border-green-200 bg-green-50';
      case 'offer_rejected':
        return 'border-red-200 bg-red-50';
      case 'message':
        return 'border-gray-200 bg-gray-50';
      case 'status_update':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'منذ لحظات';
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else if (diffInDays < 7) {
      return `منذ ${diffInDays} يوم`;
    } else {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderEventDetails = (event: TimelineEvent) => {
    if (event.type === 'counter_offer' && event.data) {
      const priceDifference = event.data.previousPrice && event.data.price 
        ? event.data.price - event.data.previousPrice 
        : 0;
      const pricePercentage = event.data.previousPrice && event.data.price
        ? ((priceDifference / event.data.previousPrice) * 100)
        : 0;

      return (
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">السعر:</span>
              <span className="font-medium mr-2">{event.data.price} ريال</span>
              {priceDifference !== 0 && (
                <span className={`text-xs ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {priceDifference > 0 ? '+' : ''}{priceDifference} ريال ({pricePercentage > 0 ? '+' : ''}{pricePercentage.toFixed(1)}%)
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-600">المدة:</span>
              <span className="font-medium mr-2">{event.data.timeline}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">النطاق:</span>
              <p className="text-sm mt-1">{event.data.scope}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">جدول الدفع:</span>
              <p className="text-sm mt-1">{event.data.paymentSchedule}</p>
            </div>
            {event.data.reason && (
              <div className="col-span-2">
                <span className="text-gray-600">السبب:</span>
                <p className="text-sm mt-1 text-gray-700">{event.data.reason}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (event.type === 'status_update' && event.data?.status) {
      return (
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">الحالة الجديدة:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.data.status === 'accepted' ? 'bg-green-100 text-green-800' :
              event.data.status === 'rejected' ? 'bg-red-100 text-red-800' :
              event.data.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {event.data.status === 'accepted' ? 'مقبول' :
               event.data.status === 'rejected' ? 'مرفوض' :
               event.data.status === 'pending' ? 'قيد المراجعة' :
               event.data.status}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <Clock className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm">لا توجد أحداث في المفاوضات</p>
          <p className="text-xs">ستظهر هنا جميع التحديثات والرسائل</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">جدول المفاوضات</h3>
          <p className="text-sm text-gray-500">تاريخ كامل للمفاوضات والتحديثات</p>
        </div>
      </div>

      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative">
            {/* Timeline Line */}
            {index < events.length - 1 && (
              <div className="absolute top-8 left-4 w-0.5 h-16 bg-gray-200 transform -translate-x-1/2"></div>
            )}

            {/* Event */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getEventColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`p-4 rounded-lg border ${getEventColor(event.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.actor.role === 'provider' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {event.actor.role === 'provider' ? 'مقدم الخدمة' : 'العميل'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{event.actor.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTimestamp(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event-specific details */}
                  {renderEventDetails(event)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">دليل الأحداث</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>عرض أولي</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span>عرض مضاد</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>عرض مقبول</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>عرض مرفوض</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span>رسالة</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span>تحديث حالة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegotiationTimeline; 
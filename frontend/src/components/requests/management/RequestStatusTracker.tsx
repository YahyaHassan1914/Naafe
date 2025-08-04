import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  MapPin,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  icon: React.ReactNode;
  timestamp?: string;
  details?: string;
}

interface RequestStatusTrackerProps {
  requestId: string;
  currentStatus: string;
  steps: StatusStep[];
  estimatedTime?: string;
  providerName?: string;
  providerLocation?: string;
  lastUpdate?: string;
  className?: string;
}

const RequestStatusTracker: React.FC<RequestStatusTrackerProps> = ({
  requestId,
  currentStatus,
  steps,
  estimatedTime,
  providerName,
  providerLocation,
  lastUpdate,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'current':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.status === 'current');
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            حالة الطلب
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            رقم الطلب: {requestId}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {getProgressPercentage()}%
          </div>
          <div className="text-sm text-gray-600">
            مكتمل
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Provider Info */}
      {providerName && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {providerName}
              </h4>
              {providerLocation && (
                <div className="flex items-center space-x-1 space-x-reverse text-sm text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{providerLocation}</span>
                </div>
              )}
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              التواصل
            </button>
          </div>
        </div>
      )}

      {/* Status Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className="absolute right-5 top-8 w-0.5 h-8 bg-gray-200" />
            )}

            <div className="flex items-start space-x-4 space-x-reverse">
              {/* Status Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStatusColor(step.status)}`}>
                {getStatusIcon(step.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">
                      {step.timestamp}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>
                {step.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estimated Time */}
      {estimatedTime && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>الوقت المتوقع للانتهاء: {estimatedTime}</span>
          </div>
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <div className="mt-4 flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>آخر تحديث: {lastUpdate}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex space-x-3 space-x-reverse">
          <button className="flex items-center space-x-2 space-x-reverse text-sm text-blue-600 hover:text-blue-700">
            <MessageSquare className="h-4 w-4" />
            <span>إرسال رسالة</span>
          </button>
          <button className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 hover:text-gray-700">
            <AlertCircle className="h-4 w-4" />
            <span>الإبلاغ عن مشكلة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestStatusTracker;

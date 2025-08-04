import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Shield, 
  Award,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import Badge from '../ui/Badge';

interface ApplicationStatus {
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_info';
  currentStep: number;
  steps: {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    completedAt?: string;
    notes?: string;
  }[];
  submittedAt: string;
  estimatedCompletion?: string;
  adminNotes?: string;
}

interface ApplicationStatusTrackerProps {
  className?: string;
}

const ApplicationStatusTracker: React.FC<ApplicationStatusTrackerProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  const { data: applicationStatus, isLoading } = useApi('/provider/application/status');

  const statusConfig = {
    pending: {
      label: 'قيد الانتظار',
      color: 'warning',
      icon: Clock
    },
    under_review: {
      label: 'قيد المراجعة',
      color: 'status',
      icon: FileText
    },
    approved: {
      label: 'تمت الموافقة',
      color: 'success',
      icon: CheckCircle
    },
    rejected: {
      label: 'مرفوض',
      color: 'error',
      icon: AlertCircle
    },
    needs_info: {
      label: 'يحتاج معلومات إضافية',
      color: 'warning',
      icon: AlertCircle
    }
  };

  const stepConfig = {
    pending: {
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
      icon: Clock
    },
    in_progress: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Clock
    },
    completed: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    failed: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: AlertCircle
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!applicationStatus) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 text-center ${className}`}>
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد طلب مقدم</h3>
        <p className="text-gray-500">لم تقم بتقديم طلب للانضمام كمحترف بعد</p>
      </div>
    );
  }

  const status = applicationStatus as ApplicationStatus;
  const currentStatusConfig = statusConfig[status.status];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-deep-teal">حالة طلب الانضمام</h2>
          <p className="text-gray-600">تتبع تقدم طلبك للانضمام كمحترف</p>
        </div>
        <Badge variant={currentStatusConfig.color as any}>
          <currentStatusConfig.icon className="w-4 h-4 mr-2" />
          {currentStatusConfig.label}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {status.steps.map((step, index) => {
          const stepStyle = stepConfig[step.status];
          const StepIcon = stepStyle.icon;
          
          return (
            <div key={step.id} className="flex items-start space-x-4">
              {/* Step Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${stepStyle.bgColor}`}>
                <StepIcon className={`w-5 h-5 ${stepStyle.color}`} />
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  {step.completedAt && (
                    <span className="text-sm text-gray-500">
                      {new Date(step.completedAt).toLocaleDateString('ar-SA')}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{step.description}</p>
                
                {step.notes && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{step.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">تاريخ التقديم</h4>
            <p className="text-gray-600">
              {new Date(status.submittedAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          {status.estimatedCompletion && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">الوقت المتوقع للانتهاء</h4>
              <p className="text-gray-600">
                {new Date(status.estimatedCompletion).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {status.adminNotes && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">ملاحظات من الإدارة</h4>
            <p className="text-blue-800">{status.adminNotes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {status.status === 'needs_info' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-semibold text-yellow-900">معلومات إضافية مطلوبة</h4>
            </div>
            <p className="text-yellow-800 mb-3">
              يرجى تقديم المعلومات الإضافية المطلوبة لتتمكن من إكمال طلبك
            </p>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
              تحديث الطلب
            </button>
          </div>
        )}

        {status.status === 'rejected' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-semibold text-red-900">تم رفض الطلب</h4>
            </div>
            <p className="text-red-800 mb-3">
              للأسف، تم رفض طلبك. يمكنك إعادة التقديم بعد 30 يوم من تاريخ الرفض
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              إعادة التقديم
            </button>
          </div>
        )}

        {status.status === 'approved' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-green-900">تمت الموافقة!</h4>
            </div>
            <p className="text-green-800 mb-3">
              تهانينا! تمت الموافقة على طلبك. يمكنك الآن البدء في العمل كمحترف
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              الانتقال إلى لوحة التحكم
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatusTracker; 
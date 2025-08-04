import React from 'react';
import { CheckCircle, Clock, AlertCircle, Shield, UserCheck } from 'lucide-react';
import Badge from '../ui/Badge';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'in-progress';
  completedAt?: string;
  notes?: string;
}

interface VerificationStatusProps {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  steps?: VerificationStep[];
  submittedAt?: string;
  reviewedAt?: string;
  explanation?: string;
  className?: string;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  steps = [],
  submittedAt,
  reviewedAt,
  explanation,
  className = ''
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'none':
        return {
          icon: Shield,
          title: 'لم يتم التقديم',
          description: 'ابدأ عملية التحقق من هويتك',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          badgeVariant: 'secondary' as const
        };
      case 'pending':
        return {
          icon: Clock,
          title: 'قيد المراجعة',
          description: 'طلب التحقق قيد المراجعة من قبل فريقنا',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          badgeVariant: 'warning' as const
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'تم التحقق',
          description: 'تم التحقق من هويتك بنجاح',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          badgeVariant: 'success' as const
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          title: 'مرفوض',
          description: explanation || 'تم رفض طلب التحقق',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeVariant: 'error' as const
        };
      default:
        return null;
    }
  };

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getProgressPercentage = () => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Overview */}
      <div className={`${statusInfo.bgColor} border border-gray-200 rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bgColor.replace('bg-', 'bg-').replace('-50', '-100')}`}>
              <statusInfo.icon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${statusInfo.color} mb-1`}>
                {statusInfo.title}
              </h3>
              <p className="text-gray-600">{statusInfo.description}</p>
              {submittedAt && (
                <p className="text-sm text-gray-500 mt-1">
                  تم التقديم في: {new Date(submittedAt).toLocaleDateString('ar-SA')}
                </p>
              )}
              {reviewedAt && (
                <p className="text-sm text-gray-500">
                  تم المراجعة في: {new Date(reviewedAt).toLocaleDateString('ar-SA')}
                </p>
              )}
            </div>
          </div>
          <Badge variant={statusInfo.badgeVariant}>
            {statusInfo.title}
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      {steps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">تقدم التحقق</h3>
            <span className="text-sm text-gray-500">
              {Math.round(getProgressPercentage())}% مكتمل
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 mt-1">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    {step.status === 'completed' && (
                      <Badge variant="success" className="text-xs">مكتمل</Badge>
                    )}
                    {step.status === 'failed' && (
                      <Badge variant="error" className="text-xs">فشل</Badge>
                    )}
                    {step.status === 'in-progress' && (
                      <Badge variant="warning" className="text-xs">قيد التنفيذ</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  {step.completedAt && (
                    <p className="text-xs text-gray-500">
                      تم الإكمال في: {new Date(step.completedAt).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                  {step.notes && (
                    <p className="text-xs text-blue-600 mt-1">{step.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Benefits */}
      {status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">مزايا التحقق</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">زيادة الثقة مع المستخدمين</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">الوصول إلى ميزات متقدمة</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">أولوية في النتائج</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">شهادة تحقق رسمية</span>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Details */}
      {status === 'rejected' && explanation && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-900">سبب الرفض</h3>
          </div>
          <p className="text-sm text-red-800">{explanation}</p>
          <div className="mt-4 p-3 bg-white border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">الخطوات التالية</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• راجع سبب الرفض بعناية</li>
              <li>• قم بتصحيح المشاكل المذكورة</li>
              <li>• أعد تقديم طلب التحقق</li>
              <li>• تواصل مع الدعم الفني إذا كنت بحاجة للمساعدة</li>
            </ul>
          </div>
        </div>
      )}

      {/* Pending Status Info */}
      {status === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">معلومات المراجعة</h3>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            طلب التحقق قيد المراجعة من قبل فريقنا المتخصص. عادة ما تستغرق المراجعة 1-3 أيام عمل.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>• مراجعة المستندات المرفوعة</div>
            <div>• التحقق من صحة المعلومات</div>
            <div>• تقييم الخبرة والمؤهلات</div>
            <div>• إجراء المقابلة إذا لزم الأمر</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus; 
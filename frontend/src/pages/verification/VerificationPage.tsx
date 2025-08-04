import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import VerificationWizard from '../../components/verification/VerificationWizard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface VerificationStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  step: string;
  completedSteps: string[];
  submittedAt?: string;
  reviewedAt?: string;
  explanation?: string;
  data?: any;
}

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showWizard, setShowWizard] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  // API hooks
  const { data: statusData, loading: statusLoading, refetch: refetchStatus } = useApi('/verification/status');

  useEffect(() => {
    if (statusData?.success) {
      setVerificationStatus(statusData.data);
    }
  }, [statusData]);

  const handleStartVerification = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = (verificationData: any) => {
    setShowWizard(false);
    showSuccess('تم إرسال طلب التحقق بنجاح');
    refetchStatus();
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const getStatusInfo = () => {
    if (!verificationStatus) return null;

    switch (verificationStatus.status) {
      case 'none':
        return {
          icon: Shield,
          title: 'لم يتم التقديم',
          description: 'ابدأ عملية التحقق من هويتك لفتح الميزات الإضافية',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          action: 'ابدأ التحقق'
        };
      case 'pending':
        return {
          icon: Clock,
          title: 'قيد المراجعة',
          description: 'طلب التحقق قيد المراجعة من قبل فريقنا',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          action: 'عرض التفاصيل'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'تم التحقق',
          description: 'تم التحقق من هويتك بنجاح',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          action: 'عرض الشهادة'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          title: 'مرفوض',
          description: verificationStatus.explanation || 'تم رفض طلب التحقق',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          action: 'إعادة التقديم'
        };
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (!verificationStatus) return null;

    switch (verificationStatus.status) {
      case 'pending':
        return <Badge variant="warning">قيد المراجعة</Badge>;
      case 'approved':
        return <Badge variant="success">تم التحقق</Badge>;
      case 'rejected':
        return <Badge variant="error">مرفوض</Badge>;
      default:
        return <Badge variant="secondary">لم يتم التقديم</Badge>;
    }
  };

  const statusInfo = getStatusInfo();

  if (statusLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تحقق من الهوية</h1>
          <p className="text-gray-600">
            التحقق من هويتك يساعد في بناء الثقة مع المستخدمين الآخرين وفتح الميزات الإضافية
          </p>
        </div>

        {/* Status Card */}
        {statusInfo && (
          <div className={`${statusInfo.bgColor} border border-gray-200 rounded-xl p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bgColor.replace('bg-', 'bg-').replace('-50', '-100')}`}>
                  <statusInfo.icon className={`w-6 h-6 ${statusInfo.color}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${statusInfo.color} mb-1`}>
                    {statusInfo.title}
                  </h2>
                  <p className="text-gray-600">{statusInfo.description}</p>
                  {verificationStatus?.submittedAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      تم التقديم في: {new Date(verificationStatus.submittedAt).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                <Button
                  onClick={handleStartVerification}
                  variant={verificationStatus?.status === 'approved' ? 'outline' : 'primary'}
                >
                  {statusInfo.action}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">زيادة الثقة</h3>
            <p className="text-sm text-gray-600">
              المستخدمون يثقون أكثر بالمحترفين المؤكدين
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">ميزات إضافية</h3>
            <p className="text-sm text-gray-600">
              الوصول إلى ميزات متقدمة وفرص أكثر
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">حماية البيانات</h3>
            <p className="text-sm text-gray-600">
              بياناتك محمية ومشفرة بأمان
            </p>
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">خطوات التحقق</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">المعلومات الشخصية</h4>
                <p className="text-sm text-gray-600">تأكيد هويتك الشخصية والبيانات الأساسية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">رفع المستندات</h4>
                <p className="text-sm text-gray-600">رفع الوثائق المطلوبة للتحقق</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">الخبرة والمؤهلات</h4>
                <p className="text-sm text-gray-600">إضافة خبراتك ومؤهلاتك المهنية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">4</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">المقابلة</h4>
                <p className="text-sm text-gray-600">مقابلة قصيرة لتأكيد مهاراتك</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">5</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">المراجعة والموافقة</h4>
                <p className="text-sm text-gray-600">مراجعة الطلب والموافقة النهائية</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Modal */}
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <VerificationWizard
                onComplete={handleWizardComplete}
                onCancel={handleWizardCancel}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerificationPage; 
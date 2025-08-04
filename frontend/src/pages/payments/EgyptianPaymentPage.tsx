import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import EgyptianPaymentSystem from '../../components/payments/EgyptianPaymentSystem';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface PaymentRequest {
  _id: string;
  amount: number;
  currency: string;
  description: string;
  requestId?: string;
  offerId?: string;
  type: 'service_request' | 'offer' | 'subscription' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

interface EgyptianPaymentPageProps {
  className?: string;
}

const EgyptianPaymentPage: React.FC<EgyptianPaymentPageProps> = ({ className = '' }) => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment request details
  const { data: paymentData, isLoading: paymentLoading } = useApi(`/payments/${paymentId}`);

  useEffect(() => {
    if (paymentData) {
      setPaymentRequest(paymentData);
    }
  }, [paymentData]);

  useEffect(() => {
    setIsLoading(paymentLoading);
  }, [paymentLoading]);

  const handlePaymentComplete = (transaction: any) => {
    showToast('تم الدفع بنجاح! سيتم توجيهك للصفحة التالية', 'success');
    
    // Redirect based on payment type
    setTimeout(() => {
      if (paymentRequest?.type === 'service_request') {
        navigate(`/requests/${paymentRequest.requestId}`);
      } else if (paymentRequest?.type === 'offer') {
        navigate(`/offers/${paymentRequest.offerId}`);
      } else {
        navigate('/dashboard');
      }
    }, 2000);
  };

  const handlePaymentCancel = () => {
    navigate(-1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل الدفع...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentRequest) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">خطأ في تحميل الدفع</h3>
          <p className="text-gray-600 mb-4">
            {error || 'لم يتم العثور على تفاصيل الدفع'}
          </p>
          <Button onClick={handleBack}>
            العودة للصفحة السابقة
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(paymentRequest.expiresAt) < new Date();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-deep-teal">الدفع الآمن</h1>
                <p className="text-sm text-gray-600">اختر طريقة الدفع المناسبة لك</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>دفع آمن</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4" />
                <span>مشفر</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment System */}
          <div className="lg:col-span-2">
            {isExpired ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center">
                  <Clock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">انتهت صلاحية الدفع</h3>
                  <p className="text-gray-600 mb-4">
                    انتهت صلاحية رابط الدفع. يرجى إنشاء طلب دفع جديد.
                  </p>
                  <Button onClick={handleBack}>
                    العودة للصفحة السابقة
                  </Button>
                </div>
              </div>
            ) : (
              <EgyptianPaymentSystem
                amount={paymentRequest.amount}
                currency={paymentRequest.currency}
                onPaymentComplete={handlePaymentComplete}
                onPaymentCancel={handlePaymentCancel}
              />
            )}
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-deep-teal mb-4">تفاصيل الدفع</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">المبلغ:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-deep-teal">
                      {paymentRequest.amount} {paymentRequest.currency}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">نوع الدفع:</span>
                  <Badge variant="info">
                    {paymentRequest.type === 'service_request' && 'طلب خدمة'}
                    {paymentRequest.type === 'offer' && 'عرض'}
                    {paymentRequest.type === 'subscription' && 'اشتراك'}
                    {paymentRequest.type === 'other' && 'أخرى'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">الحالة:</span>
                  <Badge 
                    variant="primary"
                    className={paymentRequest.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {paymentRequest.status === 'pending' && 'في الانتظار'}
                    {paymentRequest.status === 'completed' && 'مكتمل'}
                    {paymentRequest.status === 'cancelled' && 'ملغي'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="text-sm font-medium">
                    {new Date(paymentRequest.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">تاريخ الانتهاء:</span>
                  <span className="text-sm font-medium">
                    {new Date(paymentRequest.expiresAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-deep-teal mb-4">تفاصيل الخدمة</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-700">{paymentRequest.description}</p>
                  </div>
                </div>

                {paymentRequest.requestId && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">رقم الطلب:</span>
                      <div className="font-mono text-sm font-medium">{paymentRequest.requestId}</div>
                    </div>
                  </div>
                )}

                {paymentRequest.offerId && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">رقم العرض:</span>
                      <div className="font-mono text-sm font-medium">{paymentRequest.offerId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">معلومات الأمان</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• جميع المدفوعات مشفرة ومؤمنة</li>
                    <li>• لا نخزن بيانات البطاقات الائتمانية</li>
                    <li>• نستخدم أحدث تقنيات الأمان</li>
                    <li>• ضمان استرداد الأموال في حالة المشاكل</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">طرق الدفع المتاحة</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• فودافون كاش (فوري)</li>
                    <li>• ميزة (فوري)</li>
                    <li>• فوري (خلال 24 ساعة)</li>
                    <li>• تحويل بنكي (خلال 48 ساعة)</li>
                    <li>• الدفع عند الاستلام</li>
                    <li>• بطاقات ائتمان (فوري)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-2">الدعم الفني</h4>
                  <p className="text-sm text-green-800 mb-3">
                    إذا واجهت أي مشكلة في الدفع، لا تتردد في التواصل معنا
                  </p>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex items-center gap-2">
                      <span>📧 البريد الإلكتروني:</span>
                      <span className="font-medium">support@naafe.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📱 الواتساب:</span>
                      <span className="font-medium">+20 123 456 7890</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EgyptianPaymentPage; 
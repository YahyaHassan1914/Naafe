import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Banknote, 
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Info,
  Shield,
  Lock,
  QrCode,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import FormTextarea from '../ui/FormTextarea';
import Badge from '../ui/Badge';

interface PaymentMethod {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  processingTime: string;
  verificationRequired: boolean;
  instructions: string[];
  requirements: string[];
}

interface PaymentTransaction {
  _id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'verified' | 'rejected';
  transactionId?: string;
  referenceNumber?: string;
  paymentProof?: string;
  verifiedBy?: {
    _id: string;
    name: { first: string; last: string };
  };
  verifiedAt?: Date;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EgyptianPaymentSystemProps {
  amount: number;
  currency?: string;
  onPaymentComplete?: (transaction: PaymentTransaction) => void;
  onPaymentCancel?: () => void;
  className?: string;
}

const EGYPTIAN_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'vodafone_cash',
    name: 'Vodafone Cash',
    displayName: 'فودافون كاش',
    description: 'الدفع عبر تطبيق فودافون كاش',
    icon: 'smartphone',
    isAvailable: true,
    fees: { percentage: 1.5, fixed: 0, currency: 'EGP' },
    processingTime: 'فوري',
    verificationRequired: false,
    instructions: [
      'افتح تطبيق فودافون كاش',
      'اختر "إرسال أموال"',
      'أدخل رقم الهاتف: 01234567890',
      'أدخل المبلغ المطلوب',
      'أرسل المال وأحفظ إيصال التحويل'
    ],
    requirements: [
      'رقم هاتف مسجل في فودافون كاش',
      'رصيد كافي في المحفظة',
      'إيصال التحويل كدليل'
    ]
  },
  {
    id: 'meeza',
    name: 'Meeza',
    displayName: 'ميزة',
    description: 'الدفع عبر محفظة ميزة الرقمية',
    icon: 'wallet',
    isAvailable: true,
    fees: { percentage: 1.0, fixed: 0, currency: 'EGP' },
    processingTime: 'فوري',
    verificationRequired: false,
    instructions: [
      'افتح تطبيق ميزة',
      'اختر "تحويل"',
      'أدخل رقم المحفظة: 1234567890123456',
      'أدخل المبلغ المطلوب',
      'أرسل التحويل وأحفظ الإيصال'
    ],
    requirements: [
      'محفظة ميزة مسجلة',
      'رصيد كافي',
      'إيصال التحويل'
    ]
  },
  {
    id: 'fawry',
    name: 'Fawry',
    displayName: 'فوري',
    description: 'الدفع عبر شبكة فوري',
    icon: 'building2',
    isAvailable: true,
    fees: { percentage: 2.5, fixed: 0, currency: 'EGP' },
    processingTime: 'خلال 24 ساعة',
    verificationRequired: true,
    instructions: [
      'اذهب لأقرب فرع فوري',
      'أخبر الموظف أنك تريد دفع فاتورة',
      'أعطه رقم الفاتورة: FAW-123456789',
      'ادفع المبلغ المطلوب',
      'احتفظ بالإيصال'
    ],
    requirements: [
      'رقم الهوية الوطنية',
      'رقم الفاتورة',
      'إيصال الدفع من فوري'
    ]
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    displayName: 'تحويل بنكي',
    description: 'التحويل المباشر للبنك',
    icon: 'building2',
    isAvailable: true,
    fees: { percentage: 0, fixed: 0, currency: 'EGP' },
    processingTime: 'خلال 48 ساعة',
    verificationRequired: true,
    instructions: [
      'اذهب لفرع البنك أو استخدم الإنترنت بانكنج',
      'اختر "تحويل"',
      'أدخل بيانات الحساب:',
      '  - اسم البنك: البنك الأهلي المصري',
      '  - رقم الحساب: 1234567890123456',
      '  - اسم المستفيد: نافعة للتكنولوجيا',
      'أدخل المبلغ وأرسل التحويل',
      'احتفظ بإيصال التحويل'
    ],
    requirements: [
      'إيصال التحويل البنكي',
      'صورة من الإيصال',
      'تأكيد من البنك'
    ]
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    displayName: 'الدفع عند الاستلام',
    description: 'الدفع نقداً عند إتمام الخدمة',
    icon: 'banknote',
    isAvailable: true,
    fees: { percentage: 0, fixed: 0, currency: 'EGP' },
    processingTime: 'عند إتمام الخدمة',
    verificationRequired: true,
    instructions: [
      'اختر "الدفع عند الاستلام"',
      'سيتم الاتصال بك لتأكيد الموعد',
      'احضر المبلغ المطلوب نقداً',
      'ادفع للمحترف عند إتمام الخدمة',
      'احصل على إيصال الدفع'
    ],
    requirements: [
      'الهوية الوطنية',
      'المبلغ المطلوب نقداً',
      'إيصال الدفع من المحترف'
    ]
  },
  {
    id: 'stripe',
    name: 'Credit Card',
    displayName: 'بطاقة ائتمان',
    description: 'الدفع عبر البطاقات الائتمانية',
    icon: 'creditCard',
    isAvailable: true,
    fees: { percentage: 2.9, fixed: 30, currency: 'EGP' },
    processingTime: 'فوري',
    verificationRequired: false,
    instructions: [
      'أدخل بيانات البطاقة الائتمانية',
      'تأكد من صحة البيانات',
      'اضغط "دفع"',
      'ستتم معالجة الدفع فوراً'
    ],
    requirements: [
      'بطاقة ائتمان صالحة',
      'رصيد كافي',
      'رمز الأمان CVV'
    ]
  }
];

const EgyptianPaymentSystem: React.FC<EgyptianPaymentSystemProps> = ({
  amount,
  currency = 'EGP',
  onPaymentComplete,
  onPaymentCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<File | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);

  // Calculate fees
  const calculateFees = (method: PaymentMethod) => {
    const percentageFee = (amount * method.fees.percentage) / 100;
    const totalFees = percentageFee + method.fees.fixed;
    return {
      percentageFee,
      fixedFee: method.fees.fixed,
      totalFees,
      totalAmount: amount + totalFees
    };
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowPaymentForm(true);
    setPaymentData({});
    setUploadedProof(null);
    setShowInstructions(false);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);

    try {
      // Create payment transaction
      const transactionData = {
        amount,
        currency,
        method: selectedMethod.id,
        paymentData,
        proofFile: uploadedProof
      };

      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transactionData)
      });

      if (response.ok) {
        const newTransaction = await response.json();
        setTransaction(newTransaction);
        
        if (selectedMethod.verificationRequired) {
          showToast('تم إرسال طلب الدفع. سيتم التحقق من الدفع خلال 24 ساعة', 'success');
        } else {
          showToast('تم الدفع بنجاح!', 'success');
          onPaymentComplete?.(newTransaction);
        }
      } else {
        showToast('خطأ في معالجة الدفع', 'error');
      }
    } catch (error) {
      showToast('خطأ في معالجة الدفع', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedProof(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم نسخ النص', 'success');
  };

  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone': return <Smartphone className="w-6 h-6" />;
      case 'wallet': return <Wallet className="w-6 h-6" />;
      case 'building2': return <Building2 className="w-6 h-6" />;
      case 'banknote': return <Banknote className="w-6 h-6" />;
      case 'creditCard': return <CreditCard className="w-6 h-6" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'verified': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'processing': return 'قيد المعالجة';
      case 'completed': return 'مكتمل';
      case 'verified': return 'متحقق';
      case 'failed': return 'فشل';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  if (transaction) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="mb-4">
            {transaction.status === 'completed' || transaction.status === 'verified' ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            ) : transaction.status === 'failed' || transaction.status === 'rejected' ? (
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            ) : (
              <Clock className="w-16 h-16 text-yellow-500 mx-auto" />
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-deep-teal mb-2">
            {transaction.status === 'completed' || transaction.status === 'verified' 
              ? 'تم الدفع بنجاح!' 
              : transaction.status === 'failed' || transaction.status === 'rejected'
              ? 'فشل في الدفع'
              : 'طلب الدفع في الانتظار'
            }
          </h3>
          
          <div className="mb-4">
            <Badge 
              variant="primary" 
              className={`text-sm ${getStatusColor(transaction.status)}`}
            >
              {getStatusLabel(transaction.status)}
            </Badge>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">المبلغ:</span>
                <div className="font-semibold">{transaction.amount} {transaction.currency}</div>
              </div>
              <div>
                <span className="text-gray-600">طريقة الدفع:</span>
                <div className="font-semibold">
                  {EGYPTIAN_PAYMENT_METHODS.find(m => m.id === transaction.method)?.displayName}
                </div>
              </div>
              <div>
                <span className="text-gray-600">رقم المعاملة:</span>
                <div className="font-semibold">{transaction._id}</div>
              </div>
              <div>
                <span className="text-gray-600">التاريخ:</span>
                <div className="font-semibold">
                  {new Date(transaction.createdAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          </div>

          {transaction.verificationNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">ملاحظات التحقق:</h4>
              <p className="text-blue-800 text-sm">{transaction.verificationNotes}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                setTransaction(null);
                setSelectedMethod(null);
                setShowPaymentForm(false);
              }}
              variant="outline"
            >
              دفع جديد
            </Button>
            <Button
              onClick={() => onPaymentComplete?.(transaction)}
            >
              متابعة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-deep-teal">اختر طريقة الدفع</h2>
            <p className="text-gray-600">اختر طريقة الدفع المناسبة لك</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">المبلغ المطلوب</div>
            <div className="text-2xl font-bold text-deep-teal">{amount} {currency}</div>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EGYPTIAN_PAYMENT_METHODS.map((method) => {
            const fees = calculateFees(method);
            return (
              <div
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod?.id === method.id 
                    ? 'border-deep-teal bg-deep-teal/5' 
                    : 'border-gray-200 hover:border-deep-teal/50'
                }`}
                onClick={() => handleMethodSelect(method)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-deep-teal">
                    {getMethodIcon(method.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{method.displayName}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الرسوم:</span>
                    <span className="font-medium">
                      {method.fees.percentage > 0 && `${method.fees.percentage}%`}
                      {method.fees.fixed > 0 && ` + ${method.fees.fixed} ${method.fees.currency}`}
                      {method.fees.percentage === 0 && method.fees.fixed === 0 && 'مجاناً'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الوقت:</span>
                    <span className="font-medium">{method.processingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع:</span>
                    <span className="font-bold text-deep-teal">{fees.totalAmount} {currency}</span>
                  </div>
                </div>

                {method.verificationRequired && (
                  <div className="mt-3 flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    يتطلب تحقق يدوي
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && selectedMethod && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-deep-teal">
              {getMethodIcon(selectedMethod.icon)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-deep-teal">{selectedMethod.displayName}</h3>
              <p className="text-gray-600">{selectedMethod.description}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="mb-3"
            >
              {showInstructions ? 'إخفاء التعليمات' : 'عرض التعليمات'}
            </Button>

            {showInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">خطوات الدفع:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  {selectedMethod.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">تفاصيل الدفع</h4>
              
              {selectedMethod.id === 'vodafone_cash' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">رقم الهاتف:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('01234567890')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-mono text-lg font-semibold">01234567890</div>
                  </div>
                  
                  <FormInput
                    label="رقم التحويل"
                    placeholder="أدخل رقم التحويل من فودافون كاش"
                    value={paymentData.transactionId || ''}
                    onChange={(value) => setPaymentData({ ...paymentData, transactionId: value })}
                  />
                </div>
              )}

              {selectedMethod.id === 'meeza' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">رقم المحفظة:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('1234567890123456')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-mono text-lg font-semibold">1234567890123456</div>
                  </div>
                  
                  <FormInput
                    label="رقم التحويل"
                    placeholder="أدخل رقم التحويل من ميزة"
                    value={paymentData.transactionId || ''}
                    onChange={(value) => setPaymentData({ ...paymentData, transactionId: value })}
                  />
                </div>
              )}

              {selectedMethod.id === 'fawry' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">رقم الفاتورة:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('FAW-123456789')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-mono text-lg font-semibold">FAW-123456789</div>
                  </div>
                  
                  <FormInput
                    label="رقم الإيصال"
                    placeholder="أدخل رقم إيصال فوري"
                    value={paymentData.referenceNumber || ''}
                    onChange={(value) => setPaymentData({ ...paymentData, referenceNumber: value })}
                  />
                </div>
              )}

              {selectedMethod.id === 'bank_transfer' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">اسم البنك:</span>
                        <div className="font-semibold">البنك الأهلي المصري</div>
                      </div>
                      <div>
                        <span className="text-gray-600">رقم الحساب:</span>
                        <div className="font-mono font-semibold">1234567890123456</div>
                      </div>
                      <div>
                        <span className="text-gray-600">اسم المستفيد:</span>
                        <div className="font-semibold">نافعة للتكنولوجيا</div>
                      </div>
                    </div>
                  </div>
                  
                  <FormInput
                    label="رقم التحويل"
                    placeholder="أدخل رقم التحويل البنكي"
                    value={paymentData.transactionId || ''}
                    onChange={(value) => setPaymentData({ ...paymentData, transactionId: value })}
                  />
                </div>
              )}

              {selectedMethod.id === 'cod' && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">معلومات مهمة</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      سيتم الاتصال بك لتأكيد الموعد. احضر المبلغ المطلوب نقداً عند إتمام الخدمة.
                    </p>
                  </div>
                  
                  <FormInput
                    label="رقم الهوية"
                    placeholder="أدخل رقم الهوية الوطنية"
                    value={paymentData.nationalId || ''}
                    onChange={(value) => setPaymentData({ ...paymentData, nationalId: value })}
                  />
                </div>
              )}

              {selectedMethod.id === 'stripe' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4" />
                      <span>معلومات البطاقة محمية ومشفرة</span>
                    </div>
                  </div>
                  
                  <FormInput
                    label="رقم البطاقة"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber || ''}
                    onChange={(value) => setPaymentData({ ...paymentData, cardNumber: value })}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="تاريخ الانتهاء"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate || ''}
                      onChange={(value) => setPaymentData({ ...paymentData, expiryDate: value })}
                    />
                    <FormInput
                      label="رمز الأمان"
                      placeholder="CVV"
                      value={paymentData.cvv || ''}
                      onChange={(value) => setPaymentData({ ...paymentData, cvv: value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">ملخص الدفع</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المبلغ الأساسي:</span>
                    <span>{amount} {currency}</span>
                  </div>
                  {calculateFees(selectedMethod).percentageFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">رسوم الخدمة:</span>
                      <span>{calculateFees(selectedMethod).percentageFee} {currency}</span>
                    </div>
                  )}
                  {calculateFees(selectedMethod).fixedFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">رسوم ثابتة:</span>
                      <span>{calculateFees(selectedMethod).fixedFee} {currency}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>المجموع:</span>
                    <span className="text-deep-teal">{calculateFees(selectedMethod).totalAmount} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Proof Upload */}
              {selectedMethod.verificationRequired && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">إرفاق إيصال الدفع</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer">
                      <span className="text-deep-teal hover:text-deep-teal/80">
                        اختر ملف إيصال الدفع
                      </span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, PDF (الحد الأقصى 5MB)
                    </p>
                  </div>
                  {uploadedProof && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      {uploadedProof.name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMethod(null);
                setShowPaymentForm(false);
                setPaymentData({});
                setUploadedProof(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  دفع آمن
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EgyptianPaymentSystem; 
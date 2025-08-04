import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Shield, AlertCircle, CheckCircle, Clock, Bank, Smartphone, Receipt } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';

interface PaymentFormProps {
  amount: number;
  offerId: string;
  requestId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'cod' | 'bank_transfer' | 'cash' | 'vodafone_cash' | 'meeza' | 'fawry';
  icon: React.ComponentType<any>;
  description: string;
  processingTime: string;
  fees: string;
  available: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  offerId,
  requestId,
  onSuccess,
  onError,
  onCancel
}) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    bankAccount: '',
    phoneNumber: '',
    referenceNumber: ''
  });

  // API hooks
  const { mutate: processPayment, loading: processingPayment } = useApi('/payments/process', 'POST');
  const { mutate: createPaymentIntent, loading: creatingIntent } = useApi('/payments/create-intent', 'POST');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'بطاقة ائتمان',
      type: 'stripe',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      processingTime: 'فوري',
      fees: '2.9% + 30¢',
      available: true
    },
    {
      id: 'cod',
      name: 'الدفع عند الاستلام',
      type: 'cod',
      icon: Receipt,
      description: 'ادفع عند اكتمال الخدمة',
      processingTime: 'عند الإنجاز',
      fees: 'بدون رسوم',
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'تحويل بنكي',
      type: 'bank_transfer',
      icon: Bank,
      description: 'تحويل مباشر للبنك',
      processingTime: '1-2 يوم عمل',
      fees: 'بدون رسوم',
      available: true
    },
    {
      id: 'cash',
      name: 'نقداً',
      type: 'cash',
      icon: DollarSign,
      description: 'دفع نقدي مباشر',
      processingTime: 'فوري',
      fees: 'بدون رسوم',
      available: true
    },
    {
      id: 'vodafone_cash',
      name: 'فودافون كاش',
      type: 'vodafone_cash',
      icon: Smartphone,
      description: 'محفظة فودافون الرقمية',
      processingTime: 'فوري',
      fees: '1-2%',
      available: true
    },
    {
      id: 'meeza',
      name: 'ميزة',
      type: 'meeza',
      icon: Smartphone,
      description: 'محفظة ميزة الرقمية',
      processingTime: 'فوري',
      fees: '1-2%',
      available: true
    },
    {
      id: 'fawry',
      name: 'فوري',
      type: 'fawry',
      icon: Receipt,
      description: 'شبكة فوري للدفع',
      processingTime: 'فوري',
      fees: '2-3%',
      available: true
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const calculateFees = (method: PaymentMethod) => {
    if (method.type === 'stripe') {
      return amount * 0.029 + 0.30;
    } else if (method.type === 'vodafone_cash' || method.type === 'meeza') {
      return amount * 0.02;
    } else if (method.type === 'fawry') {
      return amount * 0.025;
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMethod) {
      newErrors.method = 'يرجى اختيار طريقة الدفع';
    }

    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (method?.type === 'stripe') {
      if (!paymentDetails.cardNumber.trim()) {
        newErrors.cardNumber = 'رقم البطاقة مطلوب';
      } else if (paymentDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = 'رقم البطاقة يجب أن يكون 16 رقم';
      }

      if (!paymentDetails.expiryDate.trim()) {
        newErrors.expiryDate = 'تاريخ انتهاء الصلاحية مطلوب';
      } else if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
        newErrors.expiryDate = 'التنسيق يجب أن يكون MM/YY';
      }

      if (!paymentDetails.cvv.trim()) {
        newErrors.cvv = 'رمز الأمان مطلوب';
      } else if (paymentDetails.cvv.length < 3 || paymentDetails.cvv.length > 4) {
        newErrors.cvv = 'رمز الأمان يجب أن يكون 3-4 أرقام';
      }

      if (!paymentDetails.cardholderName.trim()) {
        newErrors.cardholderName = 'اسم حامل البطاقة مطلوب';
      }
    }

    if (method?.type === 'bank_transfer' && !paymentDetails.bankAccount.trim()) {
      newErrors.bankAccount = 'رقم الحساب البنكي مطلوب';
    }

    if ((method?.type === 'vodafone_cash' || method?.type === 'meeza') && !paymentDetails.phoneNumber.trim()) {
      newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedMethod(methodId);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    const method = paymentMethods.find(m => m.id === selectedMethod);

    try {
      const paymentData = {
        amount,
        offerId,
        requestId,
        paymentMethod: method?.type,
        paymentDetails,
        userId: user?.id
      };

      if (method?.type === 'stripe') {
        // Create payment intent for Stripe
        const intentResponse = await createPaymentIntent({
          amount,
          currency: 'SAR',
          paymentMethod: 'card'
        });

        // Process Stripe payment
        const response = await processPayment({
          ...paymentData,
          paymentIntentId: intentResponse.paymentIntentId
        });

        onSuccess(response);
      } else {
        // Process other payment methods
        const response = await processPayment(paymentData);
        onSuccess(response);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError('حدث خطأ في معالجة الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
  const fees = selectedMethodData ? calculateFees(selectedMethodData) : 0;
  const totalAmount = amount + fees;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">إتمام الدفع</h2>
          <p className="text-sm text-gray-500">اختر طريقة الدفع المناسبة لك</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">ملخص الدفع</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">مبلغ الخدمة:</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          {fees > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">رسوم المعاملة:</span>
              <span className="font-medium">{formatCurrency(fees)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>المجموع:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">طريقة الدفع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const methodFees = calculateFees(method);
              const methodTotal = amount + methodFees;
              
              return (
                <div
                  key={method.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.available && handlePaymentMethodChange(method.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                        {selectedMethod === method.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{method.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>الرسوم: {method.fees}</span>
                        <span>المجموع: {formatCurrency(methodTotal)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{method.processingTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.method && (
            <p className="text-red-600 text-sm mt-2">{errors.method}</p>
          )}
        </div>

        {/* Payment Details */}
        {selectedMethod && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">تفاصيل الدفع</h3>
            
            {selectedMethod === 'stripe' && (
              <div className="space-y-4">
                <FormInput
                  label="رقم البطاقة"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  error={errors.cardNumber}
                  maxLength={19}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="تاريخ انتهاء الصلاحية"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                    placeholder="MM/YY"
                    error={errors.expiryDate}
                    maxLength={5}
                  />
                  <FormInput
                    label="رمز الأمان"
                    value={paymentDetails.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    error={errors.cvv}
                    maxLength={4}
                  />
                </div>
                
                <FormInput
                  label="اسم حامل البطاقة"
                  value={paymentDetails.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  placeholder="الاسم كما يظهر على البطاقة"
                  error={errors.cardholderName}
                />
              </div>
            )}

            {selectedMethod === 'bank_transfer' && (
              <div className="space-y-4">
                <FormInput
                  label="رقم الحساب البنكي"
                  value={paymentDetails.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  placeholder="أدخل رقم الحساب البنكي"
                  error={errors.bankAccount}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">تعليمات التحويل البنكي</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    سيتم إرسال تفاصيل الحساب البنكي عبر البريد الإلكتروني. 
                    يرجى الاحتفاظ بإيصال التحويل للمراجعة.
                  </p>
                </div>
              </div>
            )}

            {(selectedMethod === 'vodafone_cash' || selectedMethod === 'meeza') && (
              <div className="space-y-4">
                <FormInput
                  label="رقم الهاتف"
                  value={paymentDetails.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="05xxxxxxxx"
                  error={errors.phoneNumber}
                />
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">دفع رقمي</span>
                  </div>
                  <p className="text-sm text-green-700">
                    سيتم إرسال رابط الدفع إلى رقم هاتفك. 
                    تأكد من أن المحفظة الرقمية مفعلة.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'cod' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">الدفع عند الاستلام</span>
                </div>
                <p className="text-sm text-yellow-700">
                  لن تدفع أي مبلغ الآن. الدفع سيتم عند اكتمال الخدمة ورضاك عنها.
                </p>
              </div>
            )}

            {selectedMethod === 'cash' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">دفع نقدي</span>
                </div>
                <p className="text-sm text-green-700">
                  الدفع سيتم نقداً عند بدء الخدمة. تأكد من توفر المبلغ المطلوب.
                </p>
              </div>
            )}

            {selectedMethod === 'fawry' && (
              <div className="space-y-4">
                <FormInput
                  label="رقم المرجع"
                  value={paymentDetails.referenceNumber}
                  onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                  placeholder="أدخل رقم المرجع (اختياري)"
                />
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-900">شبكة فوري</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    يمكنك الدفع من خلال أي من فروع فوري أو الصيدليات أو محطات البنزين.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-900">حماية وأمان</span>
          </div>
          <p className="text-sm text-gray-600">
            جميع المعاملات محمية بتقنيات التشفير المتقدمة. 
            لن نشارك معلوماتك المالية مع أي طرف ثالث.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            loading={isProcessing || processingPayment || creatingIntent}
            disabled={!selectedMethod || isProcessing}
            className="flex-1"
          >
            {selectedMethod === 'cod' ? 'تأكيد الطلب' : 'إتمام الدفع'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm; 
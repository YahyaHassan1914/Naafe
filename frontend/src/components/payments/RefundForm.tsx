import React, { useState } from 'react';
import { AlertCircle, DollarSign, FileText, Upload, XCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface RefundFormProps {
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  onSuccess: (refundData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface RefundReason {
  id: string;
  label: string;
  description: string;
  requiresEvidence: boolean;
}

const RefundForm: React.FC<RefundFormProps> = ({
  paymentId,
  amount,
  currency,
  paymentMethod,
  onSuccess,
  onError,
  onCancel
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(amount);
  const [evidence, setEvidence] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API hooks
  const { mutate: requestRefund, loading: requestingRefund } = useApi('/payments/refund', 'POST');

  const refundReasons: RefundReason[] = [
    {
      id: 'service_not_provided',
      label: 'لم يتم تقديم الخدمة',
      description: 'مقدم الخدمة لم يقدم الخدمة المتفق عليها',
      requiresEvidence: true
    },
    {
      id: 'poor_quality',
      label: 'جودة سيئة',
      description: 'الخدمة المقدمة لا تفي بالمعايير المتفق عليها',
      requiresEvidence: true
    },
    {
      id: 'cancellation',
      label: 'إلغاء الخدمة',
      description: 'تم إلغاء الخدمة قبل البدء',
      requiresEvidence: false
    },
    {
      id: 'overcharging',
      label: 'فرض رسوم زائدة',
      description: 'تم فرض رسوم أكثر من المتفق عليه',
      requiresEvidence: true
    },
    {
      id: 'incomplete_work',
      label: 'عمل غير مكتمل',
      description: 'الخدمة لم تكتمل كما هو متفق عليه',
      requiresEvidence: true
    },
    {
      id: 'other',
      label: 'أسباب أخرى',
      description: 'سبب آخر يرجى توضيحه',
      requiresEvidence: false
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedReason) {
      newErrors.reason = 'يرجى اختيار سبب الاسترداد';
    }

    if (!description.trim()) {
      newErrors.description = 'يرجى إضافة وصف مفصل';
    } else if (description.trim().length < 20) {
      newErrors.description = 'الوصف يجب أن يكون 20 حرف على الأقل';
    }

    if (refundAmount <= 0) {
      newErrors.amount = 'مبلغ الاسترداد يجب أن يكون أكبر من صفر';
    } else if (refundAmount > amount) {
      newErrors.amount = 'مبلغ الاسترداد لا يمكن أن يتجاوز المبلغ الأصلي';
    }

    const selectedReasonData = refundReasons.find(r => r.id === selectedReason);
    if (selectedReasonData?.requiresEvidence && evidence.length === 0) {
      newErrors.evidence = 'يرجى إرفاق دليل على المشكلة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setErrors(prev => ({
        ...prev,
        evidence: 'بعض الملفات غير صالحة. يرجى التأكد من أن الملفات صور أو PDF وحجمها أقل من 5MB'
      }));
    }

    setEvidence(prev => [...prev, ...validFiles]);
    if (errors.evidence) {
      setErrors(prev => ({ ...prev, evidence: '' }));
    }
  };

  const removeFile = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('paymentId', paymentId);
      formData.append('reason', selectedReason);
      formData.append('description', description);
      formData.append('amount', refundAmount.toString());
      formData.append('currency', currency);

      evidence.forEach((file, index) => {
        formData.append(`evidence_${index}`, file);
      });

      const response = await requestRefund(formData);
      onSuccess(response);
    } catch (error) {
      console.error('Refund request error:', error);
      onError('حدث خطأ في طلب الاسترداد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedReasonData = refundReasons.find(r => r.id === selectedReason);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">طلب استرداد المال</h2>
          <p className="text-sm text-gray-500">أخبرنا عن سبب طلب الاسترداد</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">تفاصيل الدفع</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">المبلغ الأصلي:</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">طريقة الدفع:</span>
            <span className="font-medium">{paymentMethod}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Refund Reason */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">سبب الاسترداد</h3>
          <div className="space-y-3">
            {refundReasons.map((reason) => (
              <div
                key={reason.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedReason(reason.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center mt-1">
                    {selectedReason === reason.id && (
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{reason.label}</h4>
                    <p className="text-sm text-gray-500">{reason.description}</p>
                    {reason.requiresEvidence && (
                      <div className="flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-600">يتطلب دليل</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.reason && (
            <p className="text-red-600 text-sm mt-2">{errors.reason}</p>
          )}
        </div>

        {/* Refund Amount */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">مبلغ الاسترداد</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="full_refund"
                name="refund_type"
                checked={refundAmount === amount}
                onChange={() => setRefundAmount(amount)}
                className="w-4 h-4 text-red-600"
              />
              <label htmlFor="full_refund" className="flex-1">
                <div className="font-medium text-gray-900">استرداد كامل</div>
                <div className="text-sm text-gray-500">{formatCurrency(amount)}</div>
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="partial_refund"
                name="refund_type"
                checked={refundAmount !== amount}
                onChange={() => setRefundAmount(amount * 0.5)}
                className="w-4 h-4 text-red-600"
              />
              <label htmlFor="partial_refund" className="flex-1">
                <div className="font-medium text-gray-900">استرداد جزئي</div>
                <div className="text-sm text-gray-500">أدخل المبلغ المطلوب</div>
              </label>
            </div>
            
            {refundAmount !== amount && (
              <div className="ml-7">
                <FormInput
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  placeholder="أدخل مبلغ الاسترداد"
                  error={errors.amount}
                  min={0}
                  max={amount}
                  step={0.01}
                />
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">وصف مفصل</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اشرح بالتفصيل سبب طلب الاسترداد. كلما كان الوصف أكثر تفصيلاً، كلما كان من الأسهل معالجة طلبك."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={4}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-2">{errors.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {description.length}/500 حرف
          </p>
        </div>

        {/* Evidence Upload */}
        {selectedReasonData?.requiresEvidence && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">إرفاق دليل</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  اسحب الملفات هنا أو انقر للاختيار
                </p>
                <p className="text-xs text-gray-500">
                  الصور أو PDF، الحد الأقصى 5MB لكل ملف
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="inline-block mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200"
                >
                  اختيار ملفات
                </label>
              </div>
            </div>
            
            {evidence.length > 0 && (
              <div className="mt-4 space-y-2">
                {evidence.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.evidence && (
              <p className="text-red-600 text-sm mt-2">{errors.evidence}</p>
            )}
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-900">معلومات مهمة</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• سيتم مراجعة طلبك خلال 24-48 ساعة</li>
            <li>• قد نتواصل معك للحصول على معلومات إضافية</li>
            <li>• الاسترداد سيتم بنفس طريقة الدفع الأصلية</li>
            <li>• قد تستغرق عملية الاسترداد 3-5 أيام عمل</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            loading={isProcessing || requestingRefund}
            disabled={!selectedReason || isProcessing}
            className="flex-1"
            variant="danger"
          >
            تقديم طلب الاسترداد
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

export default RefundForm; 
import React, { useState } from 'react';
import { AlertCircle, X, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import FormTextarea from '../ui/FormTextarea';

interface RequestCancellationProps {
  requestId: string;
  requestTitle: string;
  onCancel: (reason: string) => Promise<void>;
  onClose: () => void;
  className?: string;
}

const RequestCancellation: React.FC<RequestCancellationProps> = ({
  requestId,
  requestTitle,
  onCancel,
  onClose,
  className = ''
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancellationReasons = [
    'تم حل المشكلة بنفسي',
    'وجدت مزود خدمة آخر',
    'تغيرت الخطط',
    'مشكلة في الموقع',
    'أسباب شخصية',
    'أخرى'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('يرجى إدخال سبب الإلغاء');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCancel(reason);
    } catch (error: any) {
      setError(error?.message || 'حدث خطأ أثناء إلغاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-text-primary">
            إلغاء طلب الخدمة
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-text-secondary mb-2">
          أنت على وشك إلغاء الطلب التالي:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="font-medium text-text-primary">{requestTitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            سبب الإلغاء
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {cancellationReasons.map((cancelReason) => (
              <button
                key={cancelReason}
                type="button"
                onClick={() => setReason(cancelReason)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  reason === cancelReason
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {cancelReason}
              </button>
            ))}
          </div>
          <FormTextarea
            value={reason}
            onChange={setReason}
            placeholder="أو اكتب سبب الإلغاء..."
            rows={3}
          />
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">
                تحذير مهم
              </h4>
              <p className="text-sm text-yellow-700">
                لا يمكن التراجع عن إلغاء الطلب. سيتم إخطار جميع المزودين الذين تقدموا للعمل.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RequestCancellation; 
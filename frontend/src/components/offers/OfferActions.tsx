import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface OfferActionsProps {
  offer: any;
  isOwner: boolean;
  isRequestOwner: boolean;
  canAccept: boolean;
  canReject: boolean;
  canNegotiate: boolean;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  onNegotiate: () => void;
  isLoading: boolean;
}

const OfferActions: React.FC<OfferActionsProps> = ({
  offer,
  isOwner,
  isRequestOwner,
  canAccept,
  canReject,
  canNegotiate,
  onAccept,
  onReject,
  onNegotiate,
  isLoading
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = () => {
    if (confirm('هل أنت متأكد من قبول هذا العرض؟')) {
      onAccept();
    }
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handleQuickReject = () => {
    if (confirm('هل أنت متأكد من رفض هذا العرض؟')) {
      onReject();
    }
  };

  const getStatusMessage = () => {
    switch (offer.status) {
      case 'pending':
        return 'في انتظار رد صاحب الطلب';
      case 'accepted':
        return 'تم قبول العرض بنجاح';
      case 'rejected':
        return 'تم رفض العرض';
      case 'negotiating':
        return 'قيد التفاوض';
      case 'expired':
        return 'انتهت صلاحية العرض';
      default:
        return 'حالة غير معروفة';
    }
  };

  const getStatusColor = () => {
    switch (offer.status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'negotiating':
        return 'text-blue-600 bg-blue-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // If offer is already accepted/rejected/expired, show status only
  if (['accepted', 'rejected', 'expired'].includes(offer.status)) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center space-x-2 space-x-reverse">
            {offer.status === 'accepted' && <CheckCircle className="h-5 w-5" />}
            {offer.status === 'rejected' && <XCircle className="h-5 w-5" />}
            {offer.status === 'expired' && <AlertTriangle className="h-5 w-5" />}
            <span className="font-medium">{getStatusMessage()}</span>
          </div>
        </div>

        {offer.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">
              الخطوات التالية:
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• سيتم إخطار المزود بقبول العرض</li>
              <li>• يمكنك التواصل مع المزود لترتيب التفاصيل</li>
              <li>• سيتم إنشاء عقد العمل تلقائياً</li>
              <li>• يمكنك متابعة تقدم العمل من خلال المنصة</li>
            </ul>
          </div>
        )}

        {offer.status === 'rejected' && offer.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              سبب الرفض:
            </h4>
            <p className="text-sm text-red-700">
              {offer.rejectionReason}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show actions based on user role and offer status
  return (
    <div className="space-y-4">
      {/* Status Message */}
      <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
        <p className="text-sm font-medium">{getStatusMessage()}</p>
      </div>

      {/* Actions for Request Owner */}
      {isRequestOwner && (
        <div className="space-y-3">
          {canAccept && (
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span className="mr-2">قبول العرض</span>
            </Button>
          )}

          {canReject && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleQuickReject}
                disabled={isLoading}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="mr-2">رفض العرض</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                disabled={isLoading}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                <span className="mr-2">رفض مع سبب</span>
              </Button>
            </div>
          )}

          {canNegotiate && (
            <Button
              variant="outline"
              onClick={onNegotiate}
              disabled={isLoading}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="mr-2">بدء التفاوض</span>
            </Button>
          )}
        </div>
      )}

      {/* Actions for Offer Owner */}
      {isOwner && canNegotiate && (
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onNegotiate}
            disabled={isLoading}
            className="w-full"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="mr-2">تعديل العرض</span>
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              نصائح للعرض:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• يمكنك تعديل السعر والشروط</li>
              <li>• استجب بسرعة للرسائل</li>
              <li>• قدم تفاصيل واضحة</li>
              <li>• كن مرناً في التفاوض</li>
            </ul>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              رفض العرض
            </h3>
            
            <FormInput
              label="سبب الرفض (اختياري)"
              type="textarea"
              value={rejectReason}
              onChange={setRejectReason}
              placeholder="اشرح سبب رفض العرض..."
              rows={3}
            />

            <div className="flex space-x-3 space-x-reverse mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="mr-2">رفض العرض</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* General Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          معلومات مهمة:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• العرض صالح لمدة 7 أيام</li>
          <li>• يمكن التفاوض على الشروط</li>
          <li>• سيتم إخطارك بأي تحديثات</li>
          <li>• يمكنك التواصل مع الطرف الآخر</li>
        </ul>
      </div>
    </div>
  );
};

export default OfferActions; 
import React, { useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  Shield, 
  CreditCard,
  MessageSquare,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface OfferDetailsProps {
  offer: any;
  showNegotiation: boolean;
  onStartNegotiation: () => void;
  onUpdateOffer: (data: any) => void;
  isActionLoading: boolean;
}

const OfferDetails: React.FC<OfferDetailsProps> = ({
  offer,
  showNegotiation,
  onStartNegotiation,
  onUpdateOffer,
  isActionLoading
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    price: offer.price?.toString() || '',
    timeline: {
      startDate: offer.timeline?.startDate || '',
      duration: offer.timeline?.duration || '',
      estimatedDays: offer.timeline?.estimatedDays?.toString() || ''
    },
    scopeOfWork: offer.scopeOfWork || '',
    warranty: offer.warranty || '',
    terms: offer.terms || ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculatePaymentBreakdown = () => {
    const deposit = offer.paymentSchedule?.deposit || 0;
    const milestone = offer.paymentSchedule?.milestone || 0;
    const final = offer.paymentSchedule?.final || 0;
    const total = offer.price || 0;

    return {
      deposit: { amount: deposit, percentage: total > 0 ? Math.round((deposit / total) * 100) : 0 },
      milestone: { amount: milestone, percentage: total > 0 ? Math.round((milestone / total) * 100) : 0 },
      final: { amount: final, percentage: total > 0 ? Math.round((final / total) * 100) : 0 }
    };
  };

  const paymentBreakdown = calculatePaymentBreakdown();

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData({
      price: offer.price?.toString() || '',
      timeline: {
        startDate: offer.timeline?.startDate || '',
        duration: offer.timeline?.duration || '',
        estimatedDays: offer.timeline?.estimatedDays?.toString() || ''
      },
      scopeOfWork: offer.scopeOfWork || '',
      warranty: offer.warranty || '',
      terms: offer.terms || ''
    });
  };

  const handleSaveEdit = () => {
    onUpdateOffer({
      price: parseFloat(editData.price),
      timeline: {
        ...editData.timeline,
        estimatedDays: parseInt(editData.timeline.estimatedDays) || 0
      },
      scopeOfWork: editData.scopeOfWork,
      warranty: editData.warranty,
      terms: editData.terms
    });
    setEditMode(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  if (showNegotiation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">تحديث العرض</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartNegotiation()}
          >
            إلغاء
          </Button>
        </div>

        <div className="space-y-6">
          {/* Price */}
          <div>
            <FormInput
              label="السعر الإجمالي (ج.م)"
              type="number"
              value={editData.price}
              onChange={(value) => handleInputChange('price', value)}
              placeholder="أدخل السعر الإجمالي"
              required
            />
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="تاريخ البدء"
              type="date"
              value={editData.timeline.startDate}
              onChange={(value) => handleNestedChange('timeline', 'startDate', value)}
              required
            />
            <FormInput
              label="مدة العمل"
              value={editData.timeline.duration}
              onChange={(value) => handleNestedChange('timeline', 'duration', value)}
              placeholder="مثال: 3 أيام، أسبوع واحد"
              required
            />
            <FormInput
              label="عدد الأيام المتوقع"
              type="number"
              value={editData.timeline.estimatedDays}
              onChange={(value) => handleNestedChange('timeline', 'estimatedDays', value)}
              placeholder="عدد الأيام"
            />
          </div>

          {/* Scope of Work */}
          <div>
            <FormInput
              label="نطاق العمل"
              type="textarea"
              value={editData.scopeOfWork}
              onChange={(value) => handleInputChange('scopeOfWork', value)}
              placeholder="اشرح بالتفصيل ما ستفعله وكيف ستنفذ العمل..."
              required
              rows={4}
            />
          </div>

          {/* Warranty */}
          <div>
            <FormInput
              label="تفاصيل الضمان"
              type="textarea"
              value={editData.warranty}
              onChange={(value) => handleInputChange('warranty', value)}
              placeholder="اشرح الضمان المقدم على العمل والمواد..."
              rows={3}
            />
          </div>

          {/* Terms */}
          <div>
            <FormInput
              label="الشروط الخاصة"
              type="textarea"
              value={editData.terms}
              onChange={(value) => handleInputChange('terms', value)}
              placeholder="أي شروط أو أحكام إضافية تريد إضافتها..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 space-x-reverse pt-4">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isActionLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isActionLoading}
            >
              {isActionLoading ? 'جاري الحفظ...' : 'حفظ التحديثات'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">تفاصيل العرض</h2>
          <p className="text-gray-600 mt-1">
            عرض من {offer.providerId?.firstName} {offer.providerId?.lastName}
          </p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={onStartNegotiation}
            className="flex items-center space-x-1 space-x-reverse"
          >
            <MessageSquare className="h-4 w-4" />
            <span>تفاوض</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center space-x-1 space-x-reverse"
          >
            <Edit className="h-4 w-4" />
            <span>تعديل</span>
          </Button>
        </div>
      </div>

      {/* Price Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">السعر والدفع</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span className="text-lg font-semibold text-green-800">السعر الإجمالي</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(offer.price)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">جدول الدفع</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">عند البدء</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(paymentBreakdown.deposit.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {paymentBreakdown.deposit.percentage}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">عند الإنجاز</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(paymentBreakdown.milestone.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {paymentBreakdown.milestone.percentage}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">عند التسليم</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(paymentBreakdown.final.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {paymentBreakdown.final.percentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">الجدول الزمني</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">تاريخ البدء</span>
            </div>
            <div className="text-sm text-blue-900">
              {offer.timeline?.startDate ? formatDate(offer.timeline.startDate) : 'غير محدد'}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">مدة العمل</span>
            </div>
            <div className="text-sm text-purple-900">
              {offer.timeline?.duration || 'غير محدد'}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">الأيام المتوقعة</span>
            </div>
            <div className="text-sm text-orange-900">
              {offer.timeline?.estimatedDays ? `${offer.timeline.estimatedDays} يوم` : 'غير محدد'}
            </div>
          </div>
        </div>

        {/* Availability */}
        {offer.availability && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">التوفر</h4>
            <div className="flex space-x-4 space-x-reverse">
              {offer.availability.immediate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  متاح للبدء فوراً
                </span>
              )}
              {offer.availability.flexible && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  مرن في المواعيد
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scope of Work */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل العمل</h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap">
            {offer.scopeOfWork || 'لم يتم تحديد تفاصيل العمل'}
          </p>
        </div>

        {/* Materials Included */}
        {offer.materialsIncluded && offer.materialsIncluded.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">المواد والأدوات المدرجة</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {offer.materialsIncluded.map((material: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">{material}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Services */}
        {offer.additionalServices && offer.additionalServices.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">خدمات إضافية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {offer.additionalServices.map((service: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{service}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Warranty */}
      {offer.warranty && (
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">الضمان</h3>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 whitespace-pre-wrap">
              {offer.warranty}
            </p>
          </div>
        </div>
      )}

      {/* Terms */}
      {offer.terms && (
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">الشروط والأحكام</h3>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 whitespace-pre-wrap">
              {offer.terms}
            </p>
          </div>
        </div>
      )}

      {/* Status History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تاريخ الحالة</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">تم إنشاء العرض</p>
              <p className="text-xs text-gray-500">
                {new Date(offer.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          {offer.updatedAt && offer.updatedAt !== offer.createdAt && (
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">تم تحديث العرض</p>
                <p className="text-xs text-gray-500">
                  {new Date(offer.updatedAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferDetails; 
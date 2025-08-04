import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  Shield, 
  CreditCard,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';

interface CreateOfferFormProps {
  request: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const CreateOfferForm: React.FC<CreateOfferFormProps> = ({
  request,
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    price: initialData?.price || '',
    timeline: {
      startDate: initialData?.timeline?.startDate || '',
      duration: initialData?.timeline?.duration || '',
      estimatedDays: initialData?.timeline?.estimatedDays || ''
    },
    scopeOfWork: initialData?.scopeOfWork || '',
    materialsIncluded: initialData?.materialsIncluded || [],
    warranty: initialData?.warranty || '',
    paymentSchedule: {
      deposit: initialData?.paymentSchedule?.deposit || '',
      milestone: initialData?.paymentSchedule?.milestone || '',
      final: initialData?.paymentSchedule?.final || ''
    },
    additionalServices: initialData?.additionalServices || [],
    terms: initialData?.terms || '',
    availability: {
      immediate: initialData?.availability?.immediate || false,
      specificDate: initialData?.availability?.specificDate || '',
      flexible: initialData?.availability?.flexible || false
    }
  });

  const [errors, setErrors] = useState<any>({});
  const [isValid, setIsValid] = useState(false);

  // Validation
  useEffect(() => {
    const newErrors: any = {};

    // Price validation
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'السعر مطلوب ويجب أن يكون أكبر من صفر';
    }

    // Timeline validation
    if (!formData.timeline.startDate) {
      newErrors.startDate = 'تاريخ البدء مطلوب';
    }
    if (!formData.timeline.duration) {
      newErrors.duration = 'مدة العمل مطلوبة';
    }

    // Scope of work validation
    if (!formData.scopeOfWork.trim()) {
      newErrors.scopeOfWork = 'تفاصيل العمل مطلوبة';
    }

    // Payment schedule validation
    const deposit = parseFloat(formData.paymentSchedule.deposit) || 0;
    const milestone = parseFloat(formData.paymentSchedule.milestone) || 0;
    const final = parseFloat(formData.paymentSchedule.final) || 0;
    const total = deposit + milestone + final;
    const price = parseFloat(formData.price) || 0;

    if (Math.abs(total - price) > 1) { // Allow 1 EGP difference for rounding
      newErrors.paymentSchedule = 'مجموع جدول الدفع يجب أن يساوي السعر الإجمالي';
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleAddMaterial = () => {
    const material = prompt('أدخل اسم المادة أو الأداة:');
    if (material && material.trim()) {
      setFormData(prev => ({
        ...prev,
        materialsIncluded: [...prev.materialsIncluded, material.trim()]
      }));
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materialsIncluded: prev.materialsIncluded.filter((_, i) => i !== index)
    }));
  };

  const handleAddService = () => {
    const service = prompt('أدخل اسم الخدمة الإضافية:');
    if (service && service.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalServices: [...prev.additionalServices, service.trim()]
      }));
    }
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(formData);
    }
  };

  const calculatePaymentPercentages = () => {
    const price = parseFloat(formData.price) || 0;
    const deposit = parseFloat(formData.paymentSchedule.deposit) || 0;
    const milestone = parseFloat(formData.paymentSchedule.milestone) || 0;
    const final = parseFloat(formData.paymentSchedule.final) || 0;

    return {
      deposit: price > 0 ? Math.round((deposit / price) * 100) : 0,
      milestone: price > 0 ? Math.round((milestone / price) * 100) : 0,
      final: price > 0 ? Math.round((final / price) * 100) : 0
    };
  };

  const percentages = calculatePaymentPercentages();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Price Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">السعر والدفع</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormInput
              label="السعر الإجمالي (ج.م)"
              type="number"
              value={formData.price}
              onChange={(value) => handleInputChange('price', value)}
              error={errors.price}
              placeholder="أدخل السعر الإجمالي"
              required
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">جدول الدفع</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">عند البدء</label>
                <input
                  type="number"
                  value={formData.paymentSchedule.deposit}
                  onChange={(e) => handleNestedChange('paymentSchedule', 'deposit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0"
                />
                {formData.paymentSchedule.deposit && (
                  <span className="text-xs text-gray-500">{percentages.deposit}%</span>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">عند الإنجاز</label>
                <input
                  type="number"
                  value={formData.paymentSchedule.milestone}
                  onChange={(e) => handleNestedChange('paymentSchedule', 'milestone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0"
                />
                {formData.paymentSchedule.milestone && (
                  <span className="text-xs text-gray-500">{percentages.milestone}%</span>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">عند التسليم</label>
                <input
                  type="number"
                  value={formData.paymentSchedule.final}
                  onChange={(e) => handleNestedChange('paymentSchedule', 'final', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0"
                />
                {formData.paymentSchedule.final && (
                  <span className="text-xs text-gray-500">{percentages.final}%</span>
                )}
              </div>
            </div>
            {errors.paymentSchedule && (
              <p className="text-xs text-red-600 mt-2">{errors.paymentSchedule}</p>
            )}
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
          <div>
            <FormInput
              label="تاريخ البدء"
              type="date"
              value={formData.timeline.startDate}
              onChange={(value) => handleNestedChange('timeline', 'startDate', value)}
              error={errors.startDate}
              required
            />
          </div>
          <div>
            <FormInput
              label="مدة العمل"
              value={formData.timeline.duration}
              onChange={(value) => handleNestedChange('timeline', 'duration', value)}
              error={errors.duration}
              placeholder="مثال: 3 أيام، أسبوع واحد"
              required
            />
          </div>
          <div>
            <FormInput
              label="عدد الأيام المتوقع"
              type="number"
              value={formData.timeline.estimatedDays}
              onChange={(value) => handleNestedChange('timeline', 'estimatedDays', value)}
              placeholder="عدد الأيام"
            />
          </div>
        </div>

        {/* Availability */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">التوفر</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={formData.availability.immediate}
                onChange={(e) => handleNestedChange('availability', 'immediate', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">متاح للبدء فوراً</span>
            </label>
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={formData.availability.flexible}
                onChange={(e) => handleNestedChange('availability', 'flexible', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">مرن في المواعيد</span>
            </label>
          </div>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل العمل</h3>
        </div>

        <div>
          <FormInput
            label="نطاق العمل"
            type="textarea"
            value={formData.scopeOfWork}
            onChange={(value) => handleInputChange('scopeOfWork', value)}
            error={errors.scopeOfWork}
            placeholder="اشرح بالتفصيل ما ستفعله وكيف ستنفذ العمل..."
            required
            rows={4}
          />
        </div>

        {/* Materials Included */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">المواد والأدوات المدرجة</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMaterial}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة</span>
            </Button>
          </div>
          <div className="space-y-2">
            {formData.materialsIncluded.map((material, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                  {material}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.materialsIncluded.length === 0 && (
              <p className="text-sm text-gray-500">لم يتم إضافة مواد أو أدوات</p>
            )}
          </div>
        </div>

        {/* Additional Services */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">خدمات إضافية</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddService}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة</span>
            </Button>
          </div>
          <div className="space-y-2">
            {formData.additionalServices.map((service, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                  {service}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(index)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.additionalServices.length === 0 && (
              <p className="text-sm text-gray-500">لم يتم إضافة خدمات إضافية</p>
            )}
          </div>
        </div>
      </div>

      {/* Warranty */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">الضمان</h3>
        </div>

        <FormInput
          label="تفاصيل الضمان"
          type="textarea"
          value={formData.warranty}
          onChange={(value) => handleInputChange('warranty', value)}
          placeholder="اشرح الضمان المقدم على العمل والمواد..."
          rows={3}
        />
      </div>

      {/* Terms */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <FileText className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">الشروط والأحكام</h3>
        </div>

        <FormInput
          label="الشروط الخاصة"
          type="textarea"
          value={formData.terms}
          onChange={(value) => handleInputChange('terms', value)}
          placeholder="أي شروط أو أحكام إضافية تريد إضافتها..."
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          <span className="text-sm text-gray-600">
            {isValid ? 'النموذج صحيح' : 'يرجى إكمال جميع الحقول المطلوبة'}
          </span>
        </div>

        <div className="flex space-x-3 space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
          >
            إرسال العرض
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreateOfferForm; 
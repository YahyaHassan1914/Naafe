import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Clock, FileText, Shield, CreditCard, Plus, X, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';

interface CounterOfferFormProps {
  originalOffer: {
    price: number;
    timeline: string;
    scope: string;
    paymentSchedule: string;
    warranty?: string;
    terms?: string;
  };
  onSubmit: (counterOffer: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CounterOfferForm: React.FC<CounterOfferFormProps> = ({
  originalOffer,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [counterOffer, setCounterOffer] = useState({
    price: originalOffer.price,
    timeline: originalOffer.timeline,
    scope: originalOffer.scope,
    paymentSchedule: originalOffer.paymentSchedule,
    warranty: originalOffer.warranty || '',
    terms: originalOffer.terms || '',
    reason: ''
  });

  const [materials, setMaterials] = useState<Array<{ name: string; quantity: string; cost: number }>>([]);
  const [services, setServices] = useState<Array<{ name: string; description: string; cost: number }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculatePriceDifference = () => {
    const difference = counterOffer.price - originalOffer.price;
    const percentage = (difference / originalOffer.price) * 100;
    return { difference, percentage };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!counterOffer.price || counterOffer.price <= 0) {
      newErrors.price = 'السعر مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (!counterOffer.timeline.trim()) {
      newErrors.timeline = 'المدة مطلوبة';
    }

    if (!counterOffer.scope.trim()) {
      newErrors.scope = 'نطاق العمل مطلوب';
    }

    if (!counterOffer.paymentSchedule.trim()) {
      newErrors.paymentSchedule = 'جدول الدفع مطلوب';
    }

    if (!counterOffer.reason.trim()) {
      newErrors.reason = 'سبب العرض المضاد مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const totalMaterialsCost = materials.reduce((sum, material) => sum + material.cost, 0);
    const totalServicesCost = services.reduce((sum, service) => sum + service.cost, 0);

    const finalCounterOffer = {
      ...counterOffer,
      materials,
      services,
      totalMaterialsCost,
      totalServicesCost,
      totalCost: counterOffer.price + totalMaterialsCost + totalServicesCost
    };

    onSubmit(finalCounterOffer);
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: '', quantity: '', cost: 0 }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: string | number) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setMaterials(updatedMaterials);
  };

  const addService = () => {
    setServices([...services, { name: '', description: '', cost: 0 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: string, value: string | number) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setServices(updatedServices);
  };

  const { difference, percentage } = calculatePriceDifference();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">إنشاء عرض مضاد</h3>
          <p className="text-sm text-gray-500">قم بتعديل شروط العرض حسب احتياجاتك</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 ml-2" />
          إلغاء
        </Button>
      </div>

      {/* Price Comparison */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">السعر الأصلي:</span>
            <span className="text-lg font-medium text-gray-900 mr-2">{originalOffer.price} ريال</span>
          </div>
          <div className="flex items-center gap-2">
            {difference !== 0 && (
              <>
                {difference > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className={`text-sm font-medium ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {difference > 0 ? '+' : ''}{difference} ريال ({percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Offer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="السعر (ريال)"
            type="number"
            value={counterOffer.price}
            onChange={(e) => setCounterOffer(prev => ({ ...prev, price: Number(e.target.value) }))}
            placeholder="أدخل السعر"
            error={errors.price}
            required
          />
          <FormInput
            label="المدة"
            value={counterOffer.timeline}
            onChange={(e) => setCounterOffer(prev => ({ ...prev, timeline: e.target.value }))}
            placeholder="مثال: 5 أيام"
            error={errors.timeline}
            required
          />
        </div>

        <FormInput
          label="نطاق العمل"
          value={counterOffer.scope}
          onChange={(e) => setCounterOffer(prev => ({ ...prev, scope: e.target.value }))}
          placeholder="وصف تفصيلي لنطاق العمل"
          error={errors.scope}
          required
          multiline
          rows={3}
        />

        <FormInput
          label="جدول الدفع"
          value={counterOffer.paymentSchedule}
          onChange={(e) => setCounterOffer(prev => ({ ...prev, paymentSchedule: e.target.value }))}
          placeholder="مثال: 50% مقدماً، 50% عند الإنجاز"
          error={errors.paymentSchedule}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="الضمان"
            value={counterOffer.warranty}
            onChange={(e) => setCounterOffer(prev => ({ ...prev, warranty: e.target.value }))}
            placeholder="مثال: ضمان سنة واحدة"
          />
          <FormInput
            label="الشروط والأحكام"
            value={counterOffer.terms}
            onChange={(e) => setCounterOffer(prev => ({ ...prev, terms: e.target.value }))}
            placeholder="شروط إضافية"
          />
        </div>

        {/* Materials Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">المواد المطلوبة</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMaterial}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة مادة
            </Button>
          </div>

          {materials.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">لا توجد مواد مضافة</p>
          ) : (
            <div className="space-y-3">
              {materials.map((material, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={material.name}
                      onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                      placeholder="اسم المادة"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                      placeholder="الكمية"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={material.cost}
                      onChange={(e) => updateMaterial(index, 'cost', Number(e.target.value))}
                      placeholder="التكلفة"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterial(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">الخدمات الإضافية</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addService}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة خدمة
            </Button>
          </div>

          {services.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">لا توجد خدمات إضافية</p>
          ) : (
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        placeholder="اسم الخدمة"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        value={service.cost}
                        onChange={(e) => updateService(index, 'cost', Number(e.target.value))}
                        placeholder="التكلفة"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeService(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <textarea
                    value={service.description}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    placeholder="وصف الخدمة"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reason for Counter Offer */}
        <FormInput
          label="سبب العرض المضاد"
          value={counterOffer.reason}
          onChange={(e) => setCounterOffer(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="اشرح سبب تعديل العرض..."
          error={errors.reason}
          required
          multiline
          rows={3}
        />

        {/* Total Cost Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">ملخص التكلفة</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">السعر الأساسي:</span>
              <span className="font-medium">{counterOffer.price} ريال</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">تكلفة المواد:</span>
              <span className="font-medium">{materials.reduce((sum, m) => sum + m.cost, 0)} ريال</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">تكلفة الخدمات:</span>
              <span className="font-medium">{services.reduce((sum, s) => sum + s.cost, 0)} ريال</span>
            </div>
            <div className="border-t border-blue-200 pt-2">
              <div className="flex justify-between font-medium text-blue-900">
                <span>إجمالي التكلفة:</span>
                <span>{counterOffer.price + materials.reduce((sum, m) => sum + m.cost, 0) + services.reduce((sum, s) => sum + s.cost, 0)} ريال</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 ml-2" />
            إرسال العرض المضاد
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CounterOfferForm; 
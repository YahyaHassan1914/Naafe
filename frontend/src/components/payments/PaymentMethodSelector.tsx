import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Shield, Plus, Edit, Trash2, CheckCircle, AlertCircle, Bank, Smartphone, Receipt } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface PaymentMethod {
  id: string;
  type: 'stripe' | 'cod' | 'bank_transfer' | 'cash' | 'vodafone_cash' | 'meeza' | 'fawry';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  isDefault: boolean;
  isVerified: boolean;
  lastUsed?: string;
  cardLast4?: string;
  bankName?: string;
  phoneNumber?: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod?: string;
  onSelect: (methodId: string) => void;
  showAddNew?: boolean;
  showManage?: boolean;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
  showAddNew = true,
  showManage = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [newMethod, setNewMethod] = useState({
    type: 'stripe' as PaymentMethod['type'],
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    bankAccount: '',
    bankName: '',
    phoneNumber: ''
  });

  // API hooks
  const { data: paymentMethods, loading, error, refetch } = useApi('/payments/methods');
  const { mutate: addPaymentMethod, loading: addingMethod } = useApi('/payments/methods', 'POST');
  const { mutate: updatePaymentMethod, loading: updatingMethod } = useApi('/payments/methods', 'PUT');
  const { mutate: deletePaymentMethod, loading: deletingMethod } = useApi('/payments/methods', 'DELETE');
  const { mutate: setDefaultMethod, loading: settingDefault } = useApi('/payments/methods/default', 'PUT');

  const paymentMethodTypes: Omit<PaymentMethod, 'id' | 'isDefault' | 'isVerified' | 'lastUsed'>[] = [
    {
      type: 'stripe',
      name: 'بطاقة ائتمان',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard
    },
    {
      type: 'cod',
      name: 'الدفع عند الاستلام',
      description: 'ادفع عند اكتمال الخدمة',
      icon: Receipt
    },
    {
      type: 'bank_transfer',
      name: 'تحويل بنكي',
      description: 'تحويل مباشر للبنك',
      icon: Bank
    },
    {
      type: 'cash',
      name: 'نقداً',
      description: 'دفع نقدي مباشر',
      icon: DollarSign
    },
    {
      type: 'vodafone_cash',
      name: 'فودافون كاش',
      description: 'محفظة فودافون الرقمية',
      icon: Smartphone
    },
    {
      type: 'meeza',
      name: 'ميزة',
      description: 'محفظة ميزة الرقمية',
      icon: Smartphone
    },
    {
      type: 'fawry',
      name: 'فوري',
      description: 'شبكة فوري للدفع',
      icon: Receipt
    }
  ];

  const getMethodIcon = (type: PaymentMethod['type']) => {
    const method = paymentMethodTypes.find(m => m.type === type);
    return method?.icon || CreditCard;
  };

  const getMethodName = (type: PaymentMethod['type']) => {
    const method = paymentMethodTypes.find(m => m.type === type);
    return method?.name || type;
  };

  const getMethodDescription = (type: PaymentMethod['type']) => {
    const method = paymentMethodTypes.find(m => m.type === type);
    return method?.description || '';
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

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const methodData = {
        type: newMethod.type,
        ...(newMethod.type === 'stripe' && {
          cardNumber: newMethod.cardNumber.replace(/\s/g, ''),
          expiryDate: newMethod.expiryDate,
          cvv: newMethod.cvv,
          cardholderName: newMethod.cardholderName
        }),
        ...(newMethod.type === 'bank_transfer' && {
          bankAccount: newMethod.bankAccount,
          bankName: newMethod.bankName
        }),
        ...((newMethod.type === 'vodafone_cash' || newMethod.type === 'meeza') && {
          phoneNumber: newMethod.phoneNumber
        })
      };

      await addPaymentMethod(methodData);
      setShowAddForm(false);
      setNewMethod({
        type: 'stripe',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        bankAccount: '',
        bankName: '',
        phoneNumber: ''
      });
      refetch();
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  const handleUpdateMethod = async (methodId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const methodData = {
        id: methodId,
        ...(newMethod.type === 'stripe' && {
          cardNumber: newMethod.cardNumber.replace(/\s/g, ''),
          expiryDate: newMethod.expiryDate,
          cvv: newMethod.cvv,
          cardholderName: newMethod.cardholderName
        }),
        ...(newMethod.type === 'bank_transfer' && {
          bankAccount: newMethod.bankAccount,
          bankName: newMethod.bankName
        }),
        ...((newMethod.type === 'vodafone_cash' || newMethod.type === 'meeza') && {
          phoneNumber: newMethod.phoneNumber
        })
      };

      await updatePaymentMethod(methodData);
      setShowEditForm(null);
      refetch();
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
      return;
    }

    try {
      await deletePaymentMethod({ id: methodId });
      refetch();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefaultMethod({ id: methodId });
      refetch();
    } catch (error) {
      console.error('Error setting default method:', error);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">خطأ في تحميل طرق الدفع</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">طرق الدفع</h3>
            <p className="text-sm text-gray-500">اختر طريقة الدفع المفضلة لديك</p>
          </div>
          {showAddNew && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={showAddForm}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة طريقة دفع
            </Button>
          )}
        </div>
      </div>

      {/* Add New Method Form */}
      {showAddForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAddMethod} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع طريقة الدفع
              </label>
              <select
                value={newMethod.type}
                onChange={(e) => setNewMethod(prev => ({ ...prev, type: e.target.value as PaymentMethod['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {paymentMethodTypes.map(method => (
                  <option key={method.type} value={method.type}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {newMethod.type === 'stripe' && (
              <div className="space-y-4">
                <FormInput
                  label="رقم البطاقة"
                  value={newMethod.cardNumber}
                  onChange={(e) => setNewMethod(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="تاريخ انتهاء الصلاحية"
                    value={newMethod.expiryDate}
                    onChange={(e) => setNewMethod(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                  <FormInput
                    label="رمز الأمان"
                    value={newMethod.cvv}
                    onChange={(e) => setNewMethod(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
                <FormInput
                  label="اسم حامل البطاقة"
                  value={newMethod.cardholderName}
                  onChange={(e) => setNewMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                  placeholder="الاسم كما يظهر على البطاقة"
                />
              </div>
            )}

            {newMethod.type === 'bank_transfer' && (
              <div className="space-y-4">
                <FormInput
                  label="اسم البنك"
                  value={newMethod.bankName}
                  onChange={(e) => setNewMethod(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="اسم البنك"
                />
                <FormInput
                  label="رقم الحساب"
                  value={newMethod.bankAccount}
                  onChange={(e) => setNewMethod(prev => ({ ...prev, bankAccount: e.target.value }))}
                  placeholder="رقم الحساب البنكي"
                />
              </div>
            )}

            {(newMethod.type === 'vodafone_cash' || newMethod.type === 'meeza') && (
              <FormInput
                label="رقم الهاتف"
                value={newMethod.phoneNumber}
                onChange={(e) => setNewMethod(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="05xxxxxxxx"
              />
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                loading={addingMethod}
                className="flex-1"
              >
                إضافة طريقة الدفع
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="divide-y divide-gray-200">
        {paymentMethods?.methods?.length === 0 ? (
          <div className="p-6 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">لا توجد طرق دفع</h4>
            <p className="text-gray-600">أضف طريقة دفع للبدء</p>
          </div>
        ) : (
          paymentMethods?.methods?.map((method: PaymentMethod) => {
            const Icon = getMethodIcon(method.type);
            const isEditing = showEditForm === method.id;
            
            return (
              <div key={method.id} className="p-6">
                {isEditing ? (
                  <form onSubmit={(e) => handleUpdateMethod(method.id, e)} className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-6 h-6 text-gray-600" />
                      <h4 className="font-medium text-gray-900">{getMethodName(method.type)}</h4>
                    </div>
                    
                    {method.type === 'stripe' && (
                      <div className="space-y-4">
                        <FormInput
                          label="رقم البطاقة"
                          value={newMethod.cardNumber}
                          onChange={(e) => setNewMethod(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            label="تاريخ انتهاء الصلاحية"
                            value={newMethod.expiryDate}
                            onChange={(e) => setNewMethod(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                          <FormInput
                            label="رمز الأمان"
                            value={newMethod.cvv}
                            onChange={(e) => setNewMethod(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                        <FormInput
                          label="اسم حامل البطاقة"
                          value={newMethod.cardholderName}
                          onChange={(e) => setNewMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                          placeholder="الاسم كما يظهر على البطاقة"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        loading={updatingMethod}
                        size="sm"
                      >
                        حفظ التغييرات
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditForm(null)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-gray-900">{getMethodName(method.type)}</h4>
                          {method.isDefault && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              افتراضي
                            </span>
                          )}
                          {method.isVerified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-2">{getMethodDescription(method.type)}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {method.cardLast4 && (
                            <span>آخر 4 أرقام: {method.cardLast4}</span>
                          )}
                          {method.bankName && (
                            <span>البنك: {method.bankName}</span>
                          )}
                          {method.phoneNumber && (
                            <span>الهاتف: {method.phoneNumber}</span>
                          )}
                          {method.lastUsed && (
                            <span>آخر استخدام: {new Date(method.lastUsed).toLocaleDateString('ar-SA')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!selectedMethod && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelect(method.id)}
                        >
                          اختيار
                        </Button>
                      )}
                      
                      {showManage && (
                        <>
                          {!method.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(method.id)}
                              loading={settingDefault}
                            >
                              تعيين كافتراضي
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowEditForm(method.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMethod(method.id)}
                            loading={deletingMethod}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector; 
import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Download, Filter, Search, Calendar, Receipt, Bank, Smartphone } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';

interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'stripe' | 'cod' | 'bank_transfer' | 'cash' | 'vodafone_cash' | 'meeza' | 'fawry';
  transactionId?: string;
  referenceNumber?: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  refundedAt?: string;
  offerId: string;
  requestId: string;
  provider: {
    id: string;
    name: string;
    avatar?: string;
  };
  client: {
    id: string;
    name: string;
    avatar?: string;
  };
  request: {
    id: string;
    title: string;
    category: string;
  };
  fees: number;
  platformFee: number;
  providerAmount: number;
}

interface PaymentHistoryProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  userId,
  showFilters = true,
  limit
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // API hooks
  const { data: paymentHistory, loading, error } = useApi(
    `/payments/history?userId=${userId || user?.id}&limit=${limit || 50}`
  );

  const formatCurrency = (amount: number, currency: string = 'SAR') => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-100 border-red-200';
      case 'refunded': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'cancelled': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'refunded': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'pending': return 'قيد المعالجة';
      case 'failed': return 'فشل';
      case 'refunded': return 'مسترد';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'stripe': return <CreditCard className="w-4 h-4" />;
      case 'cod': return <Receipt className="w-4 h-4" />;
      case 'bank_transfer': return <Bank className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'vodafone_cash':
      case 'meeza': return <Smartphone className="w-4 h-4" />;
      case 'fawry': return <Receipt className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'stripe': return 'بطاقة ائتمان';
      case 'cod': return 'الدفع عند الاستلام';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'cash': return 'نقداً';
      case 'vodafone_cash': return 'فودافون كاش';
      case 'meeza': return 'ميزة';
      case 'fawry': return 'فوري';
      default: return method;
    }
  };

  const filterPayments = (payments: PaymentHistoryItem[]) => {
    return payments.filter(payment => {
      const matchesSearch = searchTerm === '' || 
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const paymentDate = new Date(payment.createdAt);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            matchesDate = diffInDays === 0;
            break;
          case 'week':
            matchesDate = diffInDays <= 7;
            break;
          case 'month':
            matchesDate = diffInDays <= 30;
            break;
          case 'year':
            matchesDate = diffInDays <= 365;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  };

  const sortPayments = (payments: PaymentHistoryItem[]) => {
    return [...payments].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const exportPayments = () => {
    if (!paymentHistory?.payments) return;

    const filteredPayments = sortPayments(filterPayments(paymentHistory.payments));
    const csvData = [
      ['التاريخ', 'المبلغ', 'الحالة', 'طريقة الدفع', 'الوصف', 'رقم المعاملة'],
      ...filteredPayments.map(payment => [
        formatDate(payment.createdAt),
        formatCurrency(payment.amount, payment.currency),
        getStatusLabel(payment.status),
        getPaymentMethodLabel(payment.paymentMethod),
        payment.description,
        payment.transactionId || payment.referenceNumber || '-'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !paymentHistory) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600">تعذر تحميل سجل المدفوعات</p>
        </div>
      </div>
    );
  }

  const filteredPayments = sortPayments(filterPayments(paymentHistory.payments));

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">سجل المدفوعات</h2>
            <p className="text-sm text-gray-500">عرض جميع المعاملات المالية</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportPayments}
            disabled={filteredPayments.length === 0}
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <FormInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في المدفوعات..."
                className="pl-10"
              />
            </div>
            
            <UnifiedSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'جميع الحالات' },
                { value: 'completed', label: 'مكتمل' },
                { value: 'pending', label: 'قيد المعالجة' },
                { value: 'failed', label: 'فشل' },
                { value: 'refunded', label: 'مسترد' },
                { value: 'cancelled', label: 'ملغي' }
              ]}
            />
            
            <UnifiedSelect
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              options={[
                { value: 'all', label: 'جميع الطرق' },
                { value: 'stripe', label: 'بطاقة ائتمان' },
                { value: 'cod', label: 'الدفع عند الاستلام' },
                { value: 'bank_transfer', label: 'تحويل بنكي' },
                { value: 'cash', label: 'نقداً' },
                { value: 'vodafone_cash', label: 'فودافون كاش' },
                { value: 'meeza', label: 'ميزة' },
                { value: 'fawry', label: 'فوري' }
              ]}
            />
            
            <UnifiedSelect
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'جميع التواريخ' },
                { value: 'today', label: 'اليوم' },
                { value: 'week', label: 'آخر أسبوع' },
                { value: 'month', label: 'آخر شهر' },
                { value: 'year', label: 'آخر سنة' }
              ]}
            />
            
            <UnifiedSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'date', label: 'التاريخ' },
                { value: 'amount', label: 'المبلغ' },
                { value: 'status', label: 'الحالة' }
              ]}
            />
          </div>
        )}
      </div>

      {/* Payment List */}
      <div className="divide-y divide-gray-200">
        {filteredPayments.length === 0 ? (
          <div className="p-6 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مدفوعات</h3>
            <p className="text-gray-600">لم يتم العثور على مدفوعات تطابق المعايير المحددة</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{payment.description}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                      <span>•</span>
                      <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
                      {payment.transactionId && (
                        <>
                          <span>•</span>
                          <span>رقم المعاملة: {payment.transactionId}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">المبلغ:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(payment.amount, payment.currency)}</span>
                      </div>
                      {payment.fees > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">الرسوم:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(payment.fees, payment.currency)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">صافي المبلغ:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(payment.providerAmount, payment.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.status === 'completed' && payment.completedAt && (
                      <div>مكتمل في {formatDate(payment.completedAt)}</div>
                    )}
                    {payment.status === 'refunded' && payment.refundedAt && (
                      <div>مسترد في {formatDate(payment.refundedAt)}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">مقدم الخدمة:</span>
                    <span className="font-medium text-gray-900 mr-2">{payment.provider.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">العميل:</span>
                    <span className="font-medium text-gray-900 mr-2">{payment.client.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">الفئة:</span>
                    <span className="font-medium text-gray-900 mr-2">{payment.request.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredPayments.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              عرض {filteredPayments.length} من {paymentHistory.payments.length} معاملة
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">إجمالي المدفوعات:</span>
                <span className="font-medium text-gray-900 mr-2">
                  {formatCurrency(
                    filteredPayments
                      .filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-500">إجمالي الرسوم:</span>
                <span className="font-medium text-gray-900 mr-2">
                  {formatCurrency(
                    filteredPayments
                      .filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.fees, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory; 
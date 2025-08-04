import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  FileText,
  Shield,
  Lock,
  Copy,
  ExternalLink,
  Info,
  Phone,
  Mail,
  Building2,
  Smartphone,
  Wallet,
  Banknote,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import FormTextarea from '../ui/FormTextarea';
import Badge from '../ui/Badge';

interface PaymentTransaction {
  _id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'verified' | 'rejected';
  transactionId?: string;
  referenceNumber?: string;
  paymentProof?: string;
  paymentData?: any;
  user: {
    _id: string;
    name: { first: string; last: string };
    email: string;
    phone: string;
    avatarUrl?: string;
  };
  verifiedBy?: {
    _id: string;
    name: { first: string; last: string };
  };
  verifiedAt?: Date;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentVerificationSystemProps {
  className?: string;
}

const PAYMENT_METHODS = [
  { value: 'all', label: 'جميع الطرق' },
  { value: 'vodafone_cash', label: 'فودافون كاش' },
  { value: 'meeza', label: 'ميزة' },
  { value: 'fawry', label: 'فوري' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'cod', label: 'الدفع عند الاستلام' },
  { value: 'stripe', label: 'بطاقة ائتمان' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'pending', label: 'في الانتظار' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'verified', label: 'متحقق' },
  { value: 'rejected', label: 'مرفوض' }
];

const PaymentVerificationSystem: React.FC<PaymentVerificationSystemProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch payment transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useApi('/admin/payments');

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData);
    }
  }, [transactionsData]);

  const handleVerifyPayment = async (transaction: PaymentTransaction, isApproved: boolean, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${transaction._id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: isApproved ? 'verified' : 'rejected',
          verificationNotes: notes || (isApproved ? 'تم التحقق من الدفع' : 'تم رفض الدفع')
        })
      });

      if (response.ok) {
        showToast(
          isApproved ? 'تم التحقق من الدفع بنجاح' : 'تم رفض الدفع', 
          'success'
        );
        
        // Update local state
        setTransactions(prev => prev.map(t => 
          t._id === transaction._id 
            ? { 
                ...t, 
                status: isApproved ? 'verified' : 'rejected',
                verifiedBy: { _id: user?._id || '', name: { first: user?.name?.first || '', last: user?.name?.last || '' } },
                verifiedAt: new Date(),
                verificationNotes: notes || (isApproved ? 'تم التحقق من الدفع' : 'تم رفض الدفع')
              }
            : t
        ));
      } else {
        showToast('خطأ في تحديث حالة الدفع', 'error');
      }
    } catch (error) {
      showToast('خطأ في تحديث حالة الدفع', 'error');
    }
  };

  const handleViewDetails = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        transaction.user.name.first.toLowerCase().includes(searchLower) ||
        transaction.user.name.last.toLowerCase().includes(searchLower) ||
        transaction.user.email.toLowerCase().includes(searchLower) ||
        transaction.user.phone.includes(searchQuery) ||
        transaction.transactionId?.toLowerCase().includes(searchLower) ||
        transaction.referenceNumber?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Method filter
    if (filterMethod !== 'all' && transaction.method !== filterMethod) return false;

    // Status filter
    if (filterStatus !== 'all' && transaction.status !== filterStatus) return false;

    return true;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'user':
        comparison = `${a.user.name.first} ${a.user.name.last}`.localeCompare(`${b.user.name.first} ${b.user.name.last}`);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'vodafone_cash': return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'meeza': return <Wallet className="w-5 h-5 text-purple-600" />;
      case 'fawry': return <Building2 className="w-5 h-5 text-orange-600" />;
      case 'bank_transfer': return <Building2 className="w-5 h-5 text-green-600" />;
      case 'cod': return <Banknote className="w-5 h-5 text-yellow-600" />;
      case 'stripe': return <CreditCard className="w-5 h-5 text-indigo-600" />;
      default: return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'vodafone_cash': return 'فودافون كاش';
      case 'meeza': return 'ميزة';
      case 'fawry': return 'فوري';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'cod': return 'الدفع عند الاستلام';
      case 'stripe': return 'بطاقة ائتمان';
      default: return method;
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم نسخ النص', 'success');
  };

  if (transactionsLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل المعاملات...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-deep-teal">التحقق من المدفوعات</h1>
            <p className="text-gray-600">مراجعة والتحقق من المدفوعات اليدوية</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">
              {transactions.length} معاملة
            </Badge>
            <Badge variant="warning">
              {transactions.filter(t => t.status === 'pending').length} في الانتظار
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <FormInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="البحث في المعاملات..."
              className="w-full"
            />
          </div>
          <FormSelect
            value={filterMethod}
            onChange={setFilterMethod}
            options={PAYMENT_METHODS}
            placeholder="طريقة الدفع"
          />
          <FormSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={STATUS_OPTIONS}
            placeholder="حالة الدفع"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-gray-600">ترتيب حسب:</span>
          <FormSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'createdAt', label: 'تاريخ الإنشاء' },
              { value: 'amount', label: 'المبلغ' },
              { value: 'user', label: 'المستخدم' },
              { value: 'status', label: 'الحالة' }
            ]}
            className="w-48"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {sortedTransactions.map((transaction) => (
          <div key={transaction._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getMethodIcon(transaction.method)}
                <div>
                  <h3 className="font-semibold text-deep-teal">
                    {transaction.amount} {transaction.currency}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getMethodLabel(transaction.method)} • {transaction.user.name.first} {transaction.user.name.last}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="primary" 
                  className={`text-sm ${getStatusColor(transaction.status)}`}
                >
                  {getStatusLabel(transaction.status)}
                </Badge>
                {transaction.verificationRequired && (
                  <Badge variant="warning" className="text-sm">
                    يتطلب تحقق
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">المستخدم:</h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    {transaction.user.avatarUrl ? (
                      <img 
                        src={transaction.user.avatarUrl} 
                        alt={`${transaction.user.name.first} ${transaction.user.name.last}`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {transaction.user.name.first} {transaction.user.name.last}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{transaction.user.email}</div>
                <div className="text-sm text-gray-500">{transaction.user.phone}</div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">تفاصيل المعاملة:</h4>
                <div className="text-sm text-gray-600">
                  <div>رقم المعاملة: {transaction._id}</div>
                  {transaction.transactionId && (
                    <div>رقم التحويل: {transaction.transactionId}</div>
                  )}
                  {transaction.referenceNumber && (
                    <div>رقم الإيصال: {transaction.referenceNumber}</div>
                  )}
                  <div>التاريخ: {new Date(transaction.createdAt).toLocaleDateString('ar-EG')}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">حالة التحقق:</h4>
                <div className="text-sm text-gray-600">
                  {transaction.verifiedBy ? (
                    <>
                      <div>تم التحقق بواسطة: {transaction.verifiedBy.name.first} {transaction.verifiedBy.name.last}</div>
                      <div>التاريخ: {transaction.verifiedAt ? new Date(transaction.verifiedAt).toLocaleDateString('ar-EG') : 'غير محدد'}</div>
                    </>
                  ) : (
                    <div>لم يتم التحقق بعد</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">الإجراءات:</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewDetails(transaction)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    تفاصيل
                  </Button>
                  {transaction.paymentProof && (
                    <Button
                      onClick={() => window.open(transaction.paymentProof, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      الإيصال
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {transaction.verificationNotes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">ملاحظات التحقق:</h4>
                <p className="text-sm text-gray-600">{transaction.verificationNotes}</p>
              </div>
            )}

            {transaction.status === 'pending' && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  يتطلب تحقق يدوي من الإدارة
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const notes = prompt('ملاحظات التحقق (اختياري):');
                      handleVerifyPayment(transaction, true, notes || undefined);
                    }}
                    size="sm"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    قبول
                  </Button>
                  <Button
                    onClick={() => {
                      const notes = prompt('سبب الرفض:');
                      if (notes) {
                        handleVerifyPayment(transaction, false, notes);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد معاملات</h3>
            <p className="text-gray-600">
              لم يتم العثور على معاملات تطابق معايير البحث
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-deep-teal">
                تفاصيل المعاملة - {selectedTransaction._id}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">معلومات المعاملة</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">المبلغ:</span>
                      <div className="font-semibold">{selectedTransaction.amount} {selectedTransaction.currency}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <div className="font-semibold">{getMethodLabel(selectedTransaction.method)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">الحالة:</span>
                      <Badge 
                        variant="primary" 
                        className={`text-sm ${getStatusColor(selectedTransaction.status)}`}
                      >
                        {getStatusLabel(selectedTransaction.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ الإنشاء:</span>
                      <div className="font-semibold">
                        {new Date(selectedTransaction.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                    {selectedTransaction.transactionId && (
                      <div>
                        <span className="text-gray-600">رقم التحويل:</span>
                        <div className="font-mono font-semibold">{selectedTransaction.transactionId}</div>
                      </div>
                    )}
                    {selectedTransaction.referenceNumber && (
                      <div>
                        <span className="text-gray-600">رقم الإيصال:</span>
                        <div className="font-mono font-semibold">{selectedTransaction.referenceNumber}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">معلومات المستخدم</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">الاسم:</span>
                      <div className="font-semibold">
                        {selectedTransaction.user.name.first} {selectedTransaction.user.name.last}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">البريد الإلكتروني:</span>
                      <div className="font-semibold">{selectedTransaction.user.email}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">رقم الهاتف:</span>
                      <div className="font-semibold">{selectedTransaction.user.phone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTransaction.paymentData && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">بيانات الدفع</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedTransaction.paymentData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedTransaction.paymentProof && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">إيصال الدفع</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img 
                      src={selectedTransaction.paymentProof} 
                      alt="Payment Proof"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              )}

              {selectedTransaction.verificationNotes && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">ملاحظات التحقق</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{selectedTransaction.verificationNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationSystem; 
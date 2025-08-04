import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CreditCard, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import SearchAndFilter from '../components/UI/SearchAndFilter';
import Pagination from '../components/UI/Pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Breadcrumb from '../components/UI/Breadcrumb';
import SortableTable, { SortDirection } from '../components/UI/SortableTable';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

// Define types for API response
interface Payment {
  _id: string;
  jobRequestId: string;
  providerId: string;
  seekerId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  refundedAt?: string;
  jobRequest: {
    _id: string;
    title: string;
  };
  provider: {
    _id: string;
    name: { first: string; last: string };
    email: string;
  };
  seeker: {
    _id: string;
    name: { first: string; last: string };
    email: string;
  };
}

interface PaymentsApiResponse {
  payments: Payment[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const fetchPayments = async ({ page, search, filter, token }: { page: number; search: string; filter: string; token: string | null; }): Promise<PaymentsApiResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (search) params.append('search', search);
  if (filter && filter !== 'all') params.append('status', filter);
  
  const res = await fetch(`/api/admin/payments?${params.toString()}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('فشل تحميل المدفوعات');
  const data = await res.json();
  return {
    payments: data.data.payments || [],
    totalPages: data.data.totalPages || 1,
    totalItems: data.data.total || 0,
    itemsPerPage: data.data.limit || 10,
  };
};

const refundPayment = async (paymentId: string, reason: string, token: string | null) => {
  const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('فشل استرداد المدفوعات');
  return res.json();
};

const PAYMENT_STATUS_VARIANT_MAP: Record<string, 'status' | 'category' | 'premium' | 'top-rated' | 'urgency'> = {
  pending: 'warning',
  completed: 'success',
  failed: 'error',
  refunded: 'secondary',
  cancelled: 'error',
};

const AdminManagePayments: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<keyof Payment>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['admin-payments', page, searchTerm, filterStatus, accessToken],
    queryFn: () => fetchPayments({ page, search: searchTerm, filter: filterStatus, token: accessToken }),
    enabled: !!accessToken,
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      refundPayment(paymentId, reason, accessToken),
    onSuccess: () => {
      showSuccess('تم استرداد المدفوعات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundReason('');
    },
    onError: (error) => {
      showError('فشل استرداد المدفوعات');
    },
  });

  const handleRefund = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const confirmRefund = () => {
    if (!selectedPayment || !refundReason.trim()) return;
    refundMutation.mutate({ paymentId: selectedPayment._id, reason: refundReason });
  };

  const getStatusBadge = (payment: Payment) => {
    const variant = PAYMENT_STATUS_VARIANT_MAP[payment.status] || 'secondary';
    return <Badge variant={variant}>{payment.status}</Badge>;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currency || 'EGP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'transactionId' as keyof Payment,
      label: 'رقم المعاملة',
      sortable: true,
      render: (payment: Payment) => (
        <span className="font-mono text-sm">
          {payment.transactionId || payment.stripePaymentIntentId || 'غير متوفر'}
        </span>
      ),
    },
    {
      key: 'amount' as keyof Payment,
      label: 'المبلغ',
      sortable: true,
      render: (payment: Payment) => (
        <span className="font-semibold text-green-600">
          {formatAmount(payment.amount, payment.currency)}
        </span>
      ),
    },
    {
      key: 'status' as keyof Payment,
      label: 'الحالة',
      sortable: true,
      render: (payment: Payment) => getStatusBadge(payment),
    },
    {
      key: 'paymentMethod' as keyof Payment,
      label: 'طريقة الدفع',
      sortable: true,
      render: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <span className="capitalize">{payment.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: 'provider' as keyof Payment,
      label: 'المزود',
      sortable: false,
      render: (payment: Payment) => (
        <div>
          <div className="font-medium">
            {`${payment.provider.name.first} ${payment.provider.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{payment.provider.email}</div>
        </div>
      ),
    },
    {
      key: 'seeker' as keyof Payment,
      label: 'الطالب',
      sortable: false,
      render: (payment: Payment) => (
        <div>
          <div className="font-medium">
            {`${payment.seeker.name.first} ${payment.seeker.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{payment.seeker.email}</div>
        </div>
      ),
    },
    {
      key: 'jobRequest' as keyof Payment,
      label: 'الخدمة',
      sortable: false,
      render: (payment: Payment) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{payment.jobRequest.title}</div>
        </div>
      ),
    },
    {
      key: 'createdAt' as keyof Payment,
      label: 'تاريخ الدفع',
      sortable: true,
      render: (payment: Payment) => (
        <div>
          <div className="text-sm">{formatDate(payment.createdAt)}</div>
          {payment.completedAt && (
            <div className="text-xs text-gray-500">
              مكتمل: {formatDate(payment.completedAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as keyof Payment,
      label: 'الإجراءات',
      sortable: false,
      render: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/payments/${payment._id}`)}
            className="p-1"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {payment.status === 'completed' && !payment.refundedAt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRefund(payment)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'جميع المدفوعات' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'failed', label: 'فشل' },
    { value: 'refunded', label: 'مسترد' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-deep-teal mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">فشل تحميل بيانات المدفوعات</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'لوحة التحكم', href: '/admin' },
        { label: 'إدارة المدفوعات', href: '/admin/payments' }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-teal">إدارة المدفوعات</h1>
          <p className="text-gray-600 mt-2">إدارة جميع المدفوعات والمعاملات المالية</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/reports/payments')}>
            <Download className="w-4 h-4 mr-2" />
            تقرير المدفوعات
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المدفوعات</p>
              <p className="text-2xl font-bold text-deep-teal">
                {paymentsData?.totalItems || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المدفوعات المكتملة</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentsData?.payments?.filter(p => p.status === 'completed').length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">قيد الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">
                {paymentsData?.payments?.filter(p => p.status === 'pending').length || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المدفوعات الفاشلة</p>
              <p className="text-2xl font-bold text-red-600">
                {paymentsData?.payments?.filter(p => p.status === 'failed').length || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={filterStatus}
        onFilterChange={setFilterStatus}
        filterOptions={filterOptions}
        placeholder="البحث في المدفوعات..."
      />

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <SortableTable
          data={paymentsData?.payments || []}
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={(field, direction) => {
            setSortField(field);
            setSortDirection(direction);
          }}
          loading={isLoading}
          emptyMessage="لا توجد مدفوعات"
        />
      </div>

      {/* Pagination */}
      {paymentsData && paymentsData.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={paymentsData.totalPages}
          onPageChange={setPage}
          totalItems={paymentsData.totalItems}
          itemsPerPage={paymentsData.itemsPerPage}
        />
      )}

      {/* Refund Modal */}
      <ConfirmationModal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedPayment(null);
          setRefundReason('');
        }}
        onConfirm={confirmRefund}
        title="استرداد المدفوعات"
        message={`هل أنت متأكد من استرداد المدفوعات بقيمة ${selectedPayment ? formatAmount(selectedPayment.amount, selectedPayment.currency) : ''}؟`}
        confirmText="استرداد"
        cancelText="إلغاء"
        variant="danger"
        loading={refundMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            سبب الاسترداد
          </label>
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="أدخل سبب الاسترداد..."
            required
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default AdminManagePayments; 
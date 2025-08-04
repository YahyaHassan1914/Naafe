import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, Clock, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
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
interface Offer {
  _id: string;
  jobRequestId: string;
  providerId: string;
  seekerId: string;
  price: number;
  currency: string;
  estimatedDuration: number;
  description: string;
  status: string;
  isAccepted: boolean;
  isRejected: boolean;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  jobRequest: {
    _id: string;
    title: string;
    category: string;
    urgency: string;
  };
  provider: {
    _id: string;
    name: { first: string; last: string };
    email: string;
    isVerified: boolean;
  };
  seeker: {
    _id: string;
    name: { first: string; last: string };
    email: string;
  };
}

interface OffersApiResponse {
  offers: Offer[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const fetchOffers = async ({ page, search, filter, token }: { page: number; search: string; filter: string; token: string | null; }): Promise<OffersApiResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (search) params.append('search', search);
  if (filter && filter !== 'all') params.append('status', filter);
  
  const res = await fetch(`/api/admin/offers?${params.toString()}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('فشل تحميل العروض');
  const data = await res.json();
  return {
    offers: data.data.offers || [],
    totalPages: data.data.totalPages || 1,
    totalItems: data.data.total || 0,
    itemsPerPage: data.data.limit || 10,
  };
};

const updateOfferStatus = async (offerId: string, status: string, reason: string, token: string | null) => {
  const res = await fetch(`/api/admin/offers/${offerId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) throw new Error('فشل تحديث حالة العرض');
  return res.json();
};

const OFFER_STATUS_VARIANT_MAP: Record<string, 'status' | 'category' | 'premium' | 'top-rated' | 'urgency'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  expired: 'secondary',
  cancelled: 'error',
};

const AdminManageOffers: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<keyof Offer>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: offersData, isLoading, error } = useQuery({
    queryKey: ['admin-offers', page, searchTerm, filterStatus, accessToken],
    queryFn: () => fetchOffers({ page, search: searchTerm, filter: filterStatus, token: accessToken }),
    enabled: !!accessToken,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ offerId, status, reason }: { offerId: string; status: string; reason: string }) =>
      updateOfferStatus(offerId, status, reason, accessToken),
    onSuccess: () => {
      showSuccess('تم تحديث حالة العرض بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      setShowStatusModal(false);
      setSelectedOffer(null);
      setStatusReason('');
      setNewStatus('');
    },
    onError: (error) => {
      showError('فشل تحديث حالة العرض');
    },
  });

  const handleUpdateStatus = (offer: Offer, status: string) => {
    setSelectedOffer(offer);
    setNewStatus(status);
    setShowStatusModal(true);
  };

  const confirmUpdateStatus = () => {
    if (!selectedOffer || !statusReason.trim()) return;
    updateStatusMutation.mutate({ 
      offerId: selectedOffer._id, 
      status: newStatus, 
      reason: statusReason 
    });
  };

  const getStatusBadge = (offer: Offer) => {
    const variant = OFFER_STATUS_VARIANT_MAP[offer.status] || 'secondary';
    return <Badge variant={variant}>{offer.status}</Badge>;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currency || 'EGP',
    }).format(price);
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

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration} دقيقة`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${hours} ساعة`;
  };

  const columns = [
    {
      key: 'price' as keyof Offer,
      label: 'السعر',
      sortable: true,
      render: (offer: Offer) => (
        <span className="font-semibold text-green-600">
          {formatPrice(offer.price, offer.currency)}
        </span>
      ),
    },
    {
      key: 'status' as keyof Offer,
      label: 'الحالة',
      sortable: true,
      render: (offer: Offer) => getStatusBadge(offer),
    },
    {
      key: 'estimatedDuration' as keyof Offer,
      label: 'المدة المتوقعة',
      sortable: true,
      render: (offer: Offer) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{formatDuration(offer.estimatedDuration)}</span>
        </div>
      ),
    },
    {
      key: 'provider' as keyof Offer,
      label: 'المزود',
      sortable: false,
      render: (offer: Offer) => (
        <div>
          <div className="font-medium">
            {`${offer.provider.name.first} ${offer.provider.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{offer.provider.email}</div>
          {offer.provider.isVerified && (
            <Badge variant="success" className="text-xs mt-1">محقق</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'seeker' as keyof Offer,
      label: 'الطالب',
      sortable: false,
      render: (offer: Offer) => (
        <div>
          <div className="font-medium">
            {`${offer.seeker.name.first} ${offer.seeker.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{offer.seeker.email}</div>
        </div>
      ),
    },
    {
      key: 'jobRequest' as keyof Offer,
      label: 'الخدمة',
      sortable: false,
      render: (offer: Offer) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{offer.jobRequest.title}</div>
          <div className="text-sm text-gray-500">{offer.jobRequest.category}</div>
          <Badge variant="urgency" className="text-xs mt-1">
            {offer.jobRequest.urgency}
          </Badge>
        </div>
      ),
    },
    {
      key: 'description' as keyof Offer,
      label: 'الوصف',
      sortable: false,
      render: (offer: Offer) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>
        </div>
      ),
    },
    {
      key: 'createdAt' as keyof Offer,
      label: 'تاريخ العرض',
      sortable: true,
      render: (offer: Offer) => (
        <div>
          <div className="text-sm">{formatDate(offer.createdAt)}</div>
          {offer.acceptedAt && (
            <div className="text-xs text-green-600">
              مقبول: {formatDate(offer.acceptedAt)}
            </div>
          )}
          {offer.rejectedAt && (
            <div className="text-xs text-red-600">
              مرفوض: {formatDate(offer.rejectedAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as keyof Offer,
      label: 'الإجراءات',
      sortable: false,
      render: (offer: Offer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/offers/${offer._id}`)}
            className="p-1"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {offer.status === 'pending' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(offer, 'accepted')}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(offer, 'rejected')}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'جميع العروض' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'accepted', label: 'مقبول' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'expired', label: 'منتهي الصلاحية' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-deep-teal mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">فشل تحميل بيانات العروض</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'لوحة التحكم', href: '/admin' },
        { label: 'إدارة العروض', href: '/admin/offers' }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-teal">إدارة العروض</h1>
          <p className="text-gray-600 mt-2">إدارة جميع العروض المقدمة من المزودين</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/reports/offers')}>
            <Briefcase className="w-4 h-4 mr-2" />
            تقرير العروض
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي العروض</p>
              <p className="text-2xl font-bold text-deep-teal">
                {offersData?.totalItems || 0}
              </p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">العروض المقبولة</p>
              <p className="text-2xl font-bold text-green-600">
                {offersData?.offers?.filter(o => o.status === 'accepted').length || 0}
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
                {offersData?.offers?.filter(o => o.status === 'pending').length || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">العروض المرفوضة</p>
              <p className="text-2xl font-bold text-red-600">
                {offersData?.offers?.filter(o => o.status === 'rejected').length || 0}
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
        placeholder="البحث في العروض..."
      />

      {/* Offers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <SortableTable
          data={offersData?.offers || []}
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={(field, direction) => {
            setSortField(field);
            setSortDirection(direction);
          }}
          loading={isLoading}
          emptyMessage="لا توجد عروض"
        />
      </div>

      {/* Pagination */}
      {offersData && offersData.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={offersData.totalPages}
          onPageChange={setPage}
          totalItems={offersData.totalItems}
          itemsPerPage={offersData.itemsPerPage}
        />
      )}

      {/* Status Update Modal */}
      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOffer(null);
          setStatusReason('');
          setNewStatus('');
        }}
        onConfirm={confirmUpdateStatus}
        title={`تحديث حالة العرض إلى ${newStatus === 'accepted' ? 'مقبول' : 'مرفوض'}`}
        message={`هل أنت متأكد من تحديث حالة العرض؟`}
        confirmText="تحديث"
        cancelText="إلغاء"
        variant={newStatus === 'accepted' ? 'success' : 'danger'}
        loading={updateStatusMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            سبب التحديث
          </label>
          <textarea
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="أدخل سبب تحديث الحالة..."
            required
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default AdminManageOffers; 
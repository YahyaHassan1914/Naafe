import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Eye, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
interface Review {
  _id: string;
  jobRequestId: string;
  providerId: string;
  seekerId: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  isReported: boolean;
  reportReason?: string;
  createdAt: string;
  updatedAt: string;
  jobRequest: {
    _id: string;
    title: string;
    category: string;
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

interface ReviewsApiResponse {
  reviews: Review[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const fetchReviews = async ({ page, search, filter, rating, token }: { page: number; search: string; filter: string; rating: number; token: string | null; }): Promise<ReviewsApiResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (search) params.append('search', search);
  if (filter && filter !== 'all') params.append('isVerified', filter);
  if (rating > 0) params.append('rating', rating.toString());
  
  const res = await fetch(`/api/admin/reviews?${params.toString()}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('فشل تحميل التقييمات');
  const data = await res.json();
  return {
    reviews: data.data.reviews || [],
    totalPages: data.data.totalPages || 1,
    totalItems: data.data.total || 0,
    itemsPerPage: data.data.limit || 10,
  };
};

const deleteReview = async (reviewId: string, reason: string, token: string | null) => {
  const res = await fetch(`/api/admin/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('فشل حذف التقييم');
  return res.json();
};

const AdminManageReviews: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortField, setSortField] = useState<keyof Review>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const { data: reviewsData, isLoading, error } = useQuery({
    queryKey: ['admin-reviews', page, searchTerm, filterStatus, ratingFilter, accessToken],
    queryFn: () => fetchReviews({ page, search: searchTerm, filter: filterStatus, rating: ratingFilter, token: accessToken }),
    enabled: !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      deleteReview(reviewId, reason, accessToken),
    onSuccess: () => {
      showSuccess('تم حذف التقييم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setShowDeleteModal(false);
      setSelectedReview(null);
      setDeleteReason('');
    },
    onError: (error) => {
      showError('فشل حذف التقييم');
    },
  });

  const handleDelete = (review: Review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedReview || !deleteReason.trim()) return;
    deleteMutation.mutate({ reviewId: selectedReview._id, reason: deleteReason });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
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
      key: 'rating' as keyof Review,
      label: 'التقييم',
      sortable: true,
      render: (review: Review) => renderStars(review.rating),
    },
    {
      key: 'comment' as keyof Review,
      label: 'التعليق',
      sortable: false,
      render: (review: Review) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
          {review.isReported && (
            <div className="mt-1">
              <Badge variant="error" className="text-xs">مبلغ عنه</Badge>
              {review.reportReason && (
                <p className="text-xs text-red-600 mt-1">السبب: {review.reportReason}</p>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'isVerified' as keyof Review,
      label: 'الحالة',
      sortable: true,
      render: (review: Review) => (
        <div className="flex items-center gap-2">
          {review.isVerified ? (
            <Badge variant="success">محقق</Badge>
          ) : (
            <Badge variant="warning">غير محقق</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'provider' as keyof Review,
      label: 'المزود',
      sortable: false,
      render: (review: Review) => (
        <div>
          <div className="font-medium">
            {`${review.provider.name.first} ${review.provider.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{review.provider.email}</div>
          {review.provider.isVerified && (
            <Badge variant="success" className="text-xs mt-1">محقق</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'seeker' as keyof Review,
      label: 'الطالب',
      sortable: false,
      render: (review: Review) => (
        <div>
          <div className="font-medium">
            {`${review.seeker.name.first} ${review.seeker.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{review.seeker.email}</div>
        </div>
      ),
    },
    {
      key: 'jobRequest' as keyof Review,
      label: 'الخدمة',
      sortable: false,
      render: (review: Review) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{review.jobRequest.title}</div>
          <div className="text-sm text-gray-500">{review.jobRequest.category}</div>
        </div>
      ),
    },
    {
      key: 'createdAt' as keyof Review,
      label: 'تاريخ التقييم',
      sortable: true,
      render: (review: Review) => (
        <div className="text-sm">{formatDate(review.createdAt)}</div>
      ),
    },
    {
      key: 'actions' as keyof Review,
      label: 'الإجراءات',
      sortable: false,
      render: (review: Review) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/reviews/${review._id}`)}
            className="p-1"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(review)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'جميع التقييمات' },
    { value: 'true', label: 'محقق' },
    { value: 'false', label: 'غير محقق' },
  ];

  const ratingOptions = [
    { value: 0, label: 'جميع التقييمات' },
    { value: 5, label: '5 نجوم' },
    { value: 4, label: '4 نجوم' },
    { value: 3, label: '3 نجوم' },
    { value: 2, label: '2 نجوم' },
    { value: 1, label: '1 نجمة' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-deep-teal mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">فشل تحميل بيانات التقييمات</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'لوحة التحكم', href: '/admin' },
        { label: 'إدارة التقييمات', href: '/admin/reviews' }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-teal">إدارة التقييمات</h1>
          <p className="text-gray-600 mt-2">إدارة جميع التقييمات والتعليقات</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/reports/reviews')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            تقرير التقييمات
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي التقييمات</p>
              <p className="text-2xl font-bold text-deep-teal">
                {reviewsData?.totalItems || 0}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">متوسط التقييم</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reviewsData?.reviews?.length > 0 
                  ? (reviewsData.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsData.reviews.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">التقييمات المحققة</p>
              <p className="text-2xl font-bold text-green-600">
                {reviewsData?.reviews?.filter(r => r.isVerified).length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">التقييمات المبلغ عنها</p>
              <p className="text-2xl font-bold text-red-600">
                {reviewsData?.reviews?.filter(r => r.isReported).length || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في التقييمات..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حالة التحقق
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              التقييم
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <SortableTable
          data={reviewsData?.reviews || []}
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={(field, direction) => {
            setSortField(field);
            setSortDirection(direction);
          }}
          loading={isLoading}
          emptyMessage="لا توجد تقييمات"
        />
      </div>

      {/* Pagination */}
      {reviewsData && reviewsData.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={reviewsData.totalPages}
          onPageChange={setPage}
          totalItems={reviewsData.totalItems}
          itemsPerPage={reviewsData.itemsPerPage}
        />
      )}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedReview(null);
          setDeleteReason('');
        }}
        onConfirm={confirmDelete}
        title="حذف التقييم"
        message="هل أنت متأكد من حذف هذا التقييم؟ هذا الإجراء لا يمكن التراجع عنه."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        loading={deleteMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            سبب الحذف
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="أدخل سبب الحذف..."
            required
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default AdminManageReviews; 
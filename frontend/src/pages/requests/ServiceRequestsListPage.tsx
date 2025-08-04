import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Layout from '../../components/layout/Layout';
import RequestCard from '../../components/requests/RequestCard';
import RequestFilters from '../../components/requests/RequestFilters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const ServiceRequestsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { useServiceRequests } = useApi();
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    location: searchParams.get('location') || '',
    budgetMin: searchParams.get('budgetMin') || '',
    budgetMax: searchParams.get('budgetMax') || '',
    urgency: searchParams.get('urgency') || '',
    status: searchParams.get('status') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const serviceRequestsQuery = useServiceRequests({
    page: currentPage,
    limit: 12,
    ...filters
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    setSearchParams(params);
  }, [filters, currentPage, setSearchParams]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      location: '',
      budgetMin: '',
      budgetMax: '',
      urgency: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestClick = (request: any) => {
    navigate(`/requests/${request._id}`);
  };

  const handleEditRequest = (request: any) => {
    navigate(`/requests/${request._id}/edit`);
  };

  const handleCancelRequest = async (request: any) => {
    if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
      try {
        // TODO: Implement cancel request API call
        console.log('Cancelling request:', request._id);
        // Refresh the list
        serviceRequestsQuery.refetch();
      } catch (error) {
        console.error('Failed to cancel request:', error);
        alert('فشل في إلغاء الطلب');
      }
    }
  };

  const getTotalPages = () => {
    if (!serviceRequestsQuery.data?.data) return 0;
    return Math.ceil(serviceRequestsQuery.data.data.total / 12);
  };

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <Button
          key="prev"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          السابق
        </Button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <Button
          key="next"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          التالي
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 space-x-reverse">
        {pages}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        لا توجد طلبات
      </h3>
      <p className="text-text-secondary mb-6">
        {Object.values(filters).some(f => f) 
          ? 'لا توجد طلبات تطابق معايير البحث المحددة.'
          : 'لا توجد طلبات متاحة حالياً.'
        }
      </p>
      {Object.values(filters).some(f => f) && (
        <Button
          variant="outline"
          onClick={handleClearFilters}
        >
          مسح الفلاتر
        </Button>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" text="جاري تحميل الطلبات..." />
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        حدث خطأ في تحميل الطلبات
      </h3>
      <p className="text-text-secondary mb-6">
        {serviceRequestsQuery.error?.message || 'حدث خطأ غير متوقع'}
      </p>
      <Button
        variant="outline"
        onClick={() => serviceRequestsQuery.refetch()}
      >
        إعادة المحاولة
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                طلبات الخدمات
              </h1>
              <p className="text-text-secondary">
                استكشف طلبات الخدمات المتاحة وابحث عن الفرص المناسبة لك
              </p>
            </div>
            
            {user?.role === 'seeker' && (
              <Button
                variant="primary"
                onClick={() => navigate('/requests/create')}
              >
                إنشاء طلب جديد
              </Button>
            )}
          </div>

          {/* Stats */}
          {serviceRequestsQuery.data?.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-deep-teal">
                  {serviceRequestsQuery.data.data.total}
                </div>
                <div className="text-sm text-text-secondary">إجمالي الطلبات</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">
                  {serviceRequestsQuery.data.data.data.filter((r: any) => r.status === 'open').length}
                </div>
                <div className="text-sm text-text-secondary">طلبات مفتوحة</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">
                  {serviceRequestsQuery.data.data.data.filter((r: any) => r.status === 'in_progress').length}
                </div>
                <div className="text-sm text-text-secondary">قيد التنفيذ</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">
                  {serviceRequestsQuery.data.data.data.filter((r: any) => r.status === 'completed').length}
                </div>
                <div className="text-sm text-text-secondary">مكتملة</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
              </Button>
              
              {Object.values(filters).some(f => f) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
              
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <RequestFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {serviceRequestsQuery.isLoading ? (
          renderLoadingState()
        ) : serviceRequestsQuery.error ? (
          renderErrorState()
        ) : serviceRequestsQuery.data?.data?.data?.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-text-secondary">
                عرض {((currentPage - 1) * 12) + 1} - {Math.min(currentPage * 12, serviceRequestsQuery.data?.data?.total || 0)} من {serviceRequestsQuery.data?.data?.total || 0} طلب
              </p>
            </div>

            {/* Requests Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
              {serviceRequestsQuery.data?.data?.data?.map((request: any) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  variant={viewMode === 'list' ? 'detailed' : 'default'}
                  showActions={user?.role === 'seeker' && request.seeker?._id === user._id}
                  onEdit={handleEditRequest}
                  onCancel={handleCancelRequest}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8">
              {renderPagination()}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ServiceRequestsListPage; 
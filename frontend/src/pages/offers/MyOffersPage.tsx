import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import OfferCard from '../../components/offers/OfferCard';
import SearchBar from '../../components/search/SearchBar';
import FilterPanel from '../../components/search/FilterPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/Button';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  DollarSign, 
  Clock,
  Eye,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const MyOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { useMyOffers } = useApi();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const offersQuery = useMyOffers({
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
      search: '',
      status: '',
      priceMin: '',
      priceMax: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOfferClick = (offer: any) => {
    navigate(`/offers/${offer._id}`);
  };

  const handleCreateOffer = () => {
    navigate('/offers/create');
  };

  const offers = offersQuery.data?.data?.data || [];
  const totalOffers = offersQuery.data?.data?.total || 0;
  const totalPages = Math.ceil(totalOffers / 12);
  const isLoading = offersQuery.isLoading;
  const error = offersQuery.error;

  // Calculate statistics
  const stats = {
    total: totalOffers,
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    negotiating: offers.filter(o => o.status === 'negotiating').length,
    expired: offers.filter(o => o.status === 'expired').length,
    totalValue: offers.reduce((sum, o) => sum + (o.price || 0), 0),
    acceptedValue: offers
      .filter(o => o.status === 'accepted')
      .reduce((sum, o) => sum + (o.price || 0), 0)
  };

  const renderPagination = () => {
    const pages = [];
    const current = currentPage;
    const total = totalPages;

    // Always show first page
    if (total > 0) {
      pages.push(1);
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      if (i > 1 && i < total) {
        pages.push(i);
      }
    }

    // Always show last page
    if (total > 1) {
      pages.push(total);
    }

    return (
      <div className="flex items-center justify-center space-x-2 space-x-reverse">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
        >
          السابق
        </Button>

        {pages.map((page, index) => {
          // Add ellipsis if there's a gap
          const prevPage = pages[index - 1];
          const showEllipsis = prevPage && page - prevPage > 1;

          return (
            <React.Fragment key={page}>
              {showEllipsis && (
                <span className="px-2 py-1 text-sm text-gray-500">...</span>
              )}
              <Button
                variant={current === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            </React.Fragment>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === total}
        >
          التالي
        </Button>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        لا توجد عروض
      </h3>
      <p className="text-gray-600 mb-6">
        لم تقم بإنشاء أي عروض بعد
      </p>
      <Button onClick={handleCreateOffer}>
        إنشاء عرض جديد
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" text="جاري تحميل عروضك..." />
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        حدث خطأ في تحميل العروض
      </h3>
      <p className="text-gray-600 mb-4">
        يرجى المحاولة مرة أخرى
      </p>
      <Button onClick={() => offersQuery.refetch()}>
        إعادة المحاولة
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                عروضي
              </h1>
              <p className="text-gray-600 mt-1">
                إدارة جميع عروضك وطلبات الخدمة
              </p>
            </div>
            <Button onClick={handleCreateOffer} className="flex items-center space-x-2 space-x-reverse">
              <Plus className="h-4 w-4" />
              <span>عرض جديد</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                onSearch={(query) => handleFilterChange({ search: query })}
                placeholder="البحث في عروضك..."
                defaultValue={filters.search}
              />
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Filter className="h-4 w-4" />
                <span>فلاتر</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
              >
                مسح الكل
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t">
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onApplyFilters={() => setShowFilters(false)}
                variant="inline"
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">في الانتظار</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">مقبول</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats.accepted}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Loader2 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">قيد التفاوض</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats.negotiating}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي القيمة</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Intl.NumberFormat('ar-EG', {
                    style: 'currency',
                    currency: 'EGP'
                  }).format(stats.totalValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل القبول</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القيمة المقبولة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('ar-EG', {
                    style: 'currency',
                    currency: 'EGP'
                  }).format(stats.acceptedValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط السعر</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? new Intl.NumberFormat('ar-EG', {
                    style: 'currency',
                    currency: 'EGP'
                  }).format(Math.round(stats.totalValue / stats.total)) : '0 ج.م'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : offers.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Offers Grid/List */}
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {offers.map((offer) => (
                <OfferCard
                  key={offer._id}
                  offer={offer}
                  onClick={() => handleOfferClick(offer)}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MyOffersPage; 
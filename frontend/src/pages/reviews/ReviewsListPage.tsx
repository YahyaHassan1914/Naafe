import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Filter, SortAsc, SortDesc, Search, Users, Award } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import ReviewCard from '../../components/reviews/ReviewCard';
import ReviewStats from '../../components/reviews/ReviewStats';
import ReviewFilters from '../../components/reviews/ReviewFilters';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
  categories: string[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  isHelpful?: boolean;
  isUnhelpful?: boolean;
  reviewer: {
    id: string;
    name: string;
    avatar?: string;
  };
  provider: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    title: string;
    category: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentReviews: number;
  helpfulReviews: number;
  verifiedReviews: number;
  responseRate: number;
  averageResponseTime: number;
}

const ReviewsListPage: React.FC = () => {
  const { providerId } = useParams<{ providerId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    rating: undefined as number | undefined,
    dateRange: undefined as string | undefined,
    hasPhotos: undefined as boolean | undefined,
    verifiedOnly: undefined as boolean | undefined,
    helpfulOnly: undefined as boolean | undefined,
    category: undefined as string | undefined,
    searchTerm: undefined as string | undefined
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // API hooks
  const { data: reviewsData, loading, error, refetch } = useApi(
    `/reviews${providerId ? `/provider/${providerId}` : ''}`
  );

  const { data: statsData } = useApi(
    `/reviews/stats${providerId ? `?providerId=${providerId}` : ''}`
  );

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    // In a real app, you would refetch data with new filters
    // refetch({ filters: newFilters });
  };

  const handleClearFilters = () => {
    setFilters({
      rating: undefined,
      dateRange: undefined,
      hasPhotos: undefined,
      verifiedOnly: undefined,
      helpfulOnly: undefined,
      category: undefined,
      searchTerm: undefined
    });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleHelpful = (reviewId: string, isHelpful: boolean) => {
    // In a real app, you would update the review data
    console.log('Marked review as helpful:', reviewId, isHelpful);
  };

  const handleReport = (reviewId: string, reason: string) => {
    // In a real app, you would report the review
    console.log('Reported review:', reviewId, reason);
  };

  const handleReply = (reviewId: string, reply: string) => {
    // In a real app, you would add a reply
    console.log('Added reply to review:', reviewId, reply);
  };

  const sortReviews = (reviews: Review[]) => {
    return [...reviews].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'helpful':
          comparison = b.helpfulCount - a.helpfulCount;
          break;
        default:
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  };

  const filterReviews = (reviews: Review[]) => {
    return reviews.filter(review => {
      // Rating filter
      if (filters.rating && review.rating !== filters.rating) {
        return false;
      }

      // Date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const reviewDate = new Date(review.createdAt);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'week':
            if (diffInDays > 7) return false;
            break;
          case 'month':
            if (diffInDays > 30) return false;
            break;
          case 'year':
            if (diffInDays > 365) return false;
            break;
        }
      }

      // Photos filter
      if (filters.hasPhotos && (!review.photos || review.photos.length === 0)) {
        return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && !review.categories.includes(filters.category)) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          review.title.toLowerCase().includes(searchLower) ||
          review.comment.toLowerCase().includes(searchLower) ||
          review.reviewer.name.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">جاري تحميل التقييمات...</p>
        </div>
      </div>
    );
  }

  if (error || !reviewsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <Star className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطأ في التحميل</h2>
            <p className="text-gray-600 mb-6">تعذر تحميل التقييمات</p>
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const reviews: Review[] = reviewsData.reviews || [];
  const stats: ReviewStats = statsData?.stats || {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recentReviews: 0,
    helpfulReviews: 0,
    verifiedReviews: 0,
    responseRate: 0,
    averageResponseTime: 0
  };

  const filteredReviews = filterReviews(reviews);
  const sortedReviews = sortReviews(filteredReviews);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">التقييمات</h1>
              <p className="text-gray-600">
                {providerId ? 'تقييمات مقدم الخدمة' : 'جميع التقييمات'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                فلاتر
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats */}
            <ReviewStats stats={stats} />

            {/* Filters */}
            {showFilters && (
              <ReviewFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Sort and Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {sortedReviews.length} تقييم
                  </span>
                  
                  {/* Sort Options */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">ترتيب حسب:</span>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortBy(field);
                        setSortOrder(order as 'asc' | 'desc');
                      }}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1"
                    >
                      <option value="date-desc">الأحدث</option>
                      <option value="date-asc">الأقدم</option>
                      <option value="rating-desc">الأعلى تقييماً</option>
                      <option value="rating-asc">الأقل تقييماً</option>
                      <option value="helpful-desc">الأكثر فائدة</option>
                    </select>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <FormInput
                    value={filters.searchTerm || ''}
                    onChange={(e) => handleFiltersChange({ ...filters, searchTerm: e.target.value })}
                    placeholder="البحث في التقييمات..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {sortedReviews.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تقييمات</h3>
                  <p className="text-gray-600">
                    {filters.searchTerm || Object.values(filters).some(f => f !== undefined && f !== '')
                      ? 'لا توجد تقييمات تطابق الفلاتر المحددة'
                      : 'لم يتم نشر أي تقييمات بعد'
                    }
                  </p>
                </div>
              ) : (
                sortedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showProviderInfo={!providerId}
                    showServiceInfo={!providerId}
                    onHelpful={handleHelpful}
                    onReport={handleReport}
                    onReply={handleReply}
                  />
                ))
              )}
            </div>

            {/* Load More */}
            {sortedReviews.length > 0 && sortedReviews.length < reviews.length && (
              <div className="mt-8 text-center">
                <Button variant="outline">
                  تحميل المزيد
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsListPage; 
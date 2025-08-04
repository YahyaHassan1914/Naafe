import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  Grid,
  List,
  Eye,
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Badge from '../ui/Badge';

interface ServiceRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  urgency: 'asap' | 'this-week' | 'flexible';
  location: {
    governorate: string;
    city: string;
  };
  budget?: {
    min: number;
    max: number;
  };
  images: string[];
  createdAt: Date;
  expiresAt: Date;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  offerCount: number;
  viewCount: number;
  seeker: {
    _id: string;
    name: { first: string; last: string };
    avatarUrl?: string;
    rating: number;
    reviewCount: number;
    memberSince: Date;
  };
  matchScore?: number;
  matchReasons?: string[];
}

interface FilterOptions {
  searchQuery: string;
  category: string;
  subcategory: string;
  location: string;
  urgency: string;
  budgetRange: {
    min: number;
    max: number;
  };
  sortBy: string;
  viewMode: 'grid' | 'list';
  showMatchedOnly: boolean;
}

interface RequestBrowsingInterfaceProps {
  onRequestSelect?: (request: ServiceRequest) => void;
  onMakeOffer?: (request: ServiceRequest) => void;
  className?: string;
}

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الغربية', 'المنوفية', 'القليوبية',
  'البحيرة', 'كفر الشيخ', 'الدمياط', 'الدقهلية', 'الشرقية', 'بورسعيد', 'الإسماعيلية',
  'السويس', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر'
];

const URGENCY_OPTIONS = [
  { value: 'all', label: 'جميع الأولويات' },
  { value: 'asap', label: 'عاجل' },
  { value: 'this-week', label: 'هذا الأسبوع' },
  { value: 'flexible', label: 'مرن' }
];

const SORT_OPTIONS = [
  { value: 'match', label: 'الأفضل تطابقاً' },
  { value: 'recent', label: 'الأحدث' },
  { value: 'urgent', label: 'الأكثر إلحاحاً' },
  { value: 'budget_high', label: 'الأعلى ميزانية' },
  { value: 'budget_low', label: 'الأقل ميزانية' },
  { value: 'location', label: 'الأقرب' },
  { value: 'offers', label: 'الأقل عروض' }
];

const RequestBrowsingInterface: React.FC<RequestBrowsingInterfaceProps> = ({
  onRequestSelect,
  onMakeOffer,
  className = ''
}) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: '',
    subcategory: '',
    location: '',
    urgency: 'all',
    budgetRange: { min: 0, max: 10000 },
    sortBy: 'match',
    viewMode: 'grid',
    showMatchedOnly: true
  });

  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch data
  const { data: allRequests, isLoading: requestsLoading } = useApi('/requests');
  const { data: categories } = useApi('/categories');
  const { data: providerProfile } = useApi('/providers/profile');

  // Get subcategories for selected category
  const currentCategory = categories?.find((cat: any) => cat.name === filters.category);
  const subcategories = currentCategory?.subcategories || [];

  // Calculate match score for a request
  const calculateMatchScore = (request: ServiceRequest): number => {
    if (!providerProfile) return 0;

    let score = 0;
    const reasons: string[] = [];

    // Skills match (40% weight)
    const hasMatchingSkill = providerProfile.skills?.some((skill: any) => 
      skill.category === request.category && skill.subcategory === request.subcategory
    );
    if (hasMatchingSkill) {
      score += 0.4;
      reasons.push('مطابق لمهاراتك');
    }

    // Location match (30% weight)
    const locationMatch = providerProfile.location?.governorate === request.location.governorate;
    if (locationMatch) {
      score += 0.3;
      reasons.push('في منطقتك');
    }

    // Budget match (20% weight)
    if (request.budget) {
      const providerMinPrice = providerProfile.pricingRange?.min || 0;
      const providerMaxPrice = providerProfile.pricingRange?.max || 10000;
      
      const budgetOverlap = Math.min(providerMaxPrice, request.budget.max) - Math.max(providerMinPrice, request.budget.min);
      if (budgetOverlap > 0) {
        score += 0.2;
        reasons.push('ميزانية مناسبة');
      }
    }

    // Urgency match (10% weight)
    if (request.urgency === 'asap' && providerProfile.availability?.isAvailable) {
      score += 0.1;
      reasons.push('متاح للعمل العاجل');
    }

    return score;
  };

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];

    let filtered = allRequests.filter((request: ServiceRequest) => {
      // Only show open requests
      if (request.status !== 'open') return false;

      // Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const titleMatch = request.title.toLowerCase().includes(searchLower);
        const descriptionMatch = request.description.toLowerCase().includes(searchLower);
        const categoryMatch = request.category.toLowerCase().includes(searchLower);
        const subcategoryMatch = request.subcategory.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descriptionMatch && !categoryMatch && !subcategoryMatch) {
          return false;
        }
      }

      // Category filter
      if (filters.category && request.category !== filters.category) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategory && request.subcategory !== filters.subcategory) {
        return false;
      }

      // Location filter
      if (filters.location && request.location.governorate !== filters.location) {
        return false;
      }

      // Urgency filter
      if (filters.urgency !== 'all' && request.urgency !== filters.urgency) {
        return false;
      }

      // Budget range filter
      if (request.budget) {
        if (request.budget.min > filters.budgetRange.max || request.budget.max < filters.budgetRange.min) {
          return false;
        }
      }

      return true;
    });

    // Calculate match scores
    filtered = filtered.map(request => ({
      ...request,
      matchScore: calculateMatchScore(request),
      matchReasons: []
    }));

    // Filter by match score if enabled
    if (filters.showMatchedOnly) {
      filtered = filtered.filter(request => request.matchScore && request.matchScore > 0.3);
    }

    // Sort requests
    filtered.sort((a: ServiceRequest, b: ServiceRequest) => {
      switch (filters.sortBy) {
        case 'match':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'urgent':
          const urgencyOrder = { 'asap': 3, 'this-week': 2, 'flexible': 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        case 'budget_high':
          return (b.budget?.max || 0) - (a.budget?.max || 0);
        case 'budget_low':
          return (a.budget?.min || 0) - (b.budget?.min || 0);
        case 'offers':
          return a.offerCount - b.offerCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allRequests, filters, providerProfile]);

  // Generate search suggestions
  useEffect(() => {
    if (!allRequests || !filters.searchQuery) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = new Set<string>();
    const query = filters.searchQuery.toLowerCase();

    allRequests.forEach((request: ServiceRequest) => {
      if (request.title.toLowerCase().includes(query)) {
        suggestions.add(request.title);
      }
      if (request.category.toLowerCase().includes(query)) {
        suggestions.add(request.category);
      }
      if (request.subcategory.toLowerCase().includes(query)) {
        suggestions.add(request.subcategory);
      }
    });

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  }, [allRequests, filters.searchQuery]);

  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange('searchQuery', value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleFilterChange('searchQuery', suggestion);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      subcategory: '',
      location: '',
      urgency: 'all',
      budgetRange: { min: 0, max: 10000 },
      sortBy: 'match',
      viewMode: 'grid',
      showMatchedOnly: true
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ دقائق';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 168) return `منذ ${Math.floor(diffInHours / 24)} يوم`;
    return `منذ ${Math.floor(diffInHours / 168)} أسبوع`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'asap': return 'text-red-600 bg-red-50';
      case 'this-week': return 'text-orange-600 bg-orange-50';
      case 'flexible': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'asap': return 'عاجل';
      case 'this-week': return 'هذا الأسبوع';
      case 'flexible': return 'مرن';
      default: return urgency;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.location) count++;
    if (filters.urgency !== 'all') count++;
    if (filters.budgetRange.min > 0 || filters.budgetRange.max < 10000) count++;
    return count;
  };

  if (requestsLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الطلبات...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <FormInput
                value={filters.searchQuery}
                onChange={handleSearchChange}
                placeholder="ابحث عن طلبات الخدمات..."
                className="pr-10"
                onFocus={() => setShowSuggestions(true)}
              />
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-right px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            فلاتر
            {getActiveFiltersCount() > 0 && (
              <Badge variant="primary" className="text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleFilterChange('viewMode', 'grid')}
              className={`px-3 py-2 ${filters.viewMode === 'grid' ? 'bg-deep-teal text-white' : 'bg-white text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFilterChange('viewMode', 'list')}
              className={`px-3 py-2 ${filters.viewMode === 'list' ? 'bg-deep-teal text-white' : 'bg-white text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <FormSelect
                label="الفئة"
                value={filters.category}
                onChange={(value) => handleFilterChange('category', value)}
                options={[
                  { value: '', label: 'جميع الفئات' },
                  ...(categories?.map((cat: any) => ({ value: cat.name, label: cat.name })) || [])
                ]}
                placeholder="اختر الفئة"
              />

              {/* Subcategory */}
              <FormSelect
                label="التخصص"
                value={filters.subcategory}
                onChange={(value) => handleFilterChange('subcategory', value)}
                options={[
                  { value: '', label: 'جميع التخصصات' },
                  ...subcategories.map((sub: any) => ({ value: sub.name, label: sub.name }))
                ]}
                placeholder="اختر التخصص"
                disabled={!filters.category}
              />

              {/* Location */}
              <FormSelect
                label="الموقع"
                value={filters.location}
                onChange={(value) => handleFilterChange('location', value)}
                options={[
                  { value: '', label: 'جميع المحافظات' },
                  ...EGYPT_GOVERNORATES.map(gov => ({ value: gov, label: gov }))
                ]}
                placeholder="اختر المحافظة"
              />

              {/* Urgency */}
              <FormSelect
                label="الأولوية"
                value={filters.urgency}
                onChange={(value) => handleFilterChange('urgency', value)}
                options={URGENCY_OPTIONS}
                placeholder="مستوى الأولوية"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Sort By */}
              <FormSelect
                label="ترتيب حسب"
                value={filters.sortBy}
                onChange={(value) => handleFilterChange('sortBy', value)}
                options={SORT_OPTIONS}
                placeholder="ترتيب النتائج"
              />

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نطاق الميزانية (جنيه مصري)</label>
                <div className="flex gap-4">
                  <FormInput
                    type="number"
                    value={filters.budgetRange.min}
                    onChange={(value) => handleFilterChange('budgetRange', { ...filters.budgetRange, min: parseFloat(value) || 0 })}
                    placeholder="من"
                    className="flex-1"
                  />
                  <FormInput
                    type="number"
                    value={filters.budgetRange.max}
                    onChange={(value) => handleFilterChange('budgetRange', { ...filters.budgetRange, max: parseFloat(value) || 10000 })}
                    placeholder="إلى"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Match Only Toggle */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="showMatchedOnly"
                checked={filters.showMatchedOnly}
                onChange={(e) => handleFilterChange('showMatchedOnly', e.target.checked)}
                className="rounded border-gray-300 text-deep-teal focus:ring-deep-teal"
              />
              <label htmlFor="showMatchedOnly" className="text-sm text-gray-700">
                عرض الطلبات المطابقة لمهاراتي فقط
              </label>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="w-4 h-4 mr-2" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          تم العثور على <span className="font-semibold text-deep-teal">{filteredRequests.length}</span> طلب
        </p>
        {getActiveFiltersCount() > 0 && (
          <Badge variant="info" className="text-sm">
            {getActiveFiltersCount()} فلتر نشط
          </Badge>
        )}
      </div>

      {/* Requests Grid/List */}
      <div className={filters.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredRequests.map((request: ServiceRequest) => (
          <div
            key={request._id}
            className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
              filters.viewMode === 'list' ? 'p-6' : 'p-4'
            }`}
          >
            {filters.viewMode === 'grid' ? (
              // Grid View
              <div className="space-y-4">
                {/* Request Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-deep-teal text-lg mb-2 line-clamp-2">
                      {request.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="category" className="text-xs">
                        {request.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {request.subcategory}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant="primary" 
                      className={`text-xs ${getUrgencyColor(request.urgency)}`}
                    >
                      {getUrgencyLabel(request.urgency)}
                    </Badge>
                    {request.matchScore && request.matchScore > 0.7 && (
                      <Badge variant="success" className="text-xs">
                        تطابق عالي
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm line-clamp-3">
                  {request.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-semibold text-deep-teal">
                      {request.offerCount}
                    </div>
                    <div className="text-xs text-gray-600">عروض</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-semibold text-deep-teal">
                      {request.viewCount}
                    </div>
                    <div className="text-xs text-gray-600">مشاهدات</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-semibold text-deep-teal">
                      {getTimeAgo(request.createdAt)}
                    </div>
                    <div className="text-xs text-gray-600">منذ</div>
                  </div>
                </div>

                {/* Location & Budget */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{request.location.city}, {request.location.governorate}</span>
                  </div>
                  {request.budget && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatPrice(request.budget.min)} - {formatPrice(request.budget.max)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onRequestSelect?.(request)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    عرض التفاصيل
                  </Button>
                  <Button
                    onClick={() => onMakeOffer?.(request)}
                    size="sm"
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    تقديم عرض
                  </Button>
                </div>
              </div>
            ) : (
              // List View
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-deep-teal text-lg mb-2">
                        {request.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location.city}, {request.location.governorate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeAgo(request.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{request.offerCount} عروض</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="primary" 
                        className={`text-xs ${getUrgencyColor(request.urgency)}`}
                      >
                        {getUrgencyLabel(request.urgency)}
                      </Badge>
                      {request.matchScore && request.matchScore > 0.7 && (
                        <Badge variant="success" className="text-xs">
                          تطابق عالي
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {request.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="category" className="text-xs">
                        {request.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {request.subcategory}
                      </Badge>
                      {request.budget && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatPrice(request.budget.min)} - {formatPrice(request.budget.max)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onRequestSelect?.(request)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        عرض التفاصيل
                      </Button>
                      <Button
                        onClick={() => onMakeOffer?.(request)}
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        تقديم عرض
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
          <p className="text-gray-600 mb-4">
            {filters.showMatchedOnly 
              ? 'لا توجد طلبات مطابقة لمهاراتك حالياً'
              : 'لم نتمكن من العثور على طلبات تطابق معايير البحث الخاصة بك'
            }
          </p>
          <Button variant="outline" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
        </div>
      )}
    </div>
  );
};

export default RequestBrowsingInterface; 
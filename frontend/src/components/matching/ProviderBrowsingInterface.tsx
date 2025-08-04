import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  User, 
  Clock, 
  Award,
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  Grid,
  List
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Badge from '../ui/Badge';

interface Provider {
  _id: string;
  name: { first: string; last: string };
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  isTopRated: boolean;
  responseTime: number;
  skills: Array<{
    category: string;
    subcategory: string;
    verified: boolean;
    yearsOfExperience: number;
  }>;
  location: {
    governorate: string;
    city: string;
  };
  pricingRange: {
    min: number;
    max: number;
  };
  availability: {
    isAvailable: boolean;
    availableDays: string[];
    availableHours: {
      start: string;
      end: string;
    };
  };
  verificationLevel: 'basic' | 'skill' | 'approved';
  lastActive: Date;
  completionRate: number;
  averageResponseTime: number;
}

interface FilterOptions {
  searchQuery: string;
  category: string;
  subcategory: string;
  location: string;
  rating: number;
  priceRange: {
    min: number;
    max: number;
  };
  verificationLevel: string;
  availability: string;
  responseTime: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

interface ProviderBrowsingInterfaceProps {
  onProviderSelect?: (provider: Provider) => void;
  className?: string;
}

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الغربية', 'المنوفية', 'القليوبية',
  'البحيرة', 'كفر الشيخ', 'الدمياط', 'الدقهلية', 'الشرقية', 'بورسعيد', 'الإسماعيلية',
  'السويس', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر'
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'reviews', label: 'الأكثر تقييماً' },
  { value: 'response', label: 'الأسرع استجابة' },
  { value: 'experience', label: 'الأكثر خبرة' },
  { value: 'price_low', label: 'الأقل سعراً' },
  { value: 'price_high', label: 'الأعلى سعراً' },
  { value: 'distance', label: 'الأقرب' },
  { value: 'completion', label: 'الأعلى إنجازاً' }
];

const VERIFICATION_OPTIONS = [
  { value: 'all', label: 'جميع المستويات' },
  { value: 'approved', label: 'محقق ومصدق' },
  { value: 'skill', label: 'محقق المهارات' },
  { value: 'basic', label: 'محقق أساسي' }
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'available', label: 'متاح الآن' },
  { value: 'today', label: 'متاح اليوم' },
  { value: 'week', label: 'متاح هذا الأسبوع' }
];

const RESPONSE_TIME_OPTIONS = [
  { value: 'all', label: 'جميع الأوقات' },
  { value: '1h', label: 'أقل من ساعة' },
  { value: '4h', label: 'أقل من 4 ساعات' },
  { value: '24h', label: 'أقل من يوم' }
];

const ProviderBrowsingInterface: React.FC<ProviderBrowsingInterfaceProps> = ({
  onProviderSelect,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: '',
    subcategory: '',
    location: '',
    rating: 0,
    priceRange: { min: 0, max: 10000 },
    verificationLevel: 'all',
    availability: 'all',
    responseTime: 'all',
    sortBy: 'rating',
    viewMode: 'grid'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch data
  const { data: allProviders, isLoading: providersLoading } = useApi('/providers');
  const { data: categories } = useApi('/categories');

  // Get subcategories for selected category
  const currentCategory = categories?.find((cat: any) => cat.name === filters.category);
  const subcategories = currentCategory?.subcategories || [];

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    if (!allProviders) return [];

    let filtered = allProviders.filter((provider: Provider) => {
      // Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const nameMatch = `${provider.name.first} ${provider.name.last}`.toLowerCase().includes(searchLower);
        const skillsMatch = provider.skills.some(skill => 
          skill.category.toLowerCase().includes(searchLower) || 
          skill.subcategory.toLowerCase().includes(searchLower)
        );
        if (!nameMatch && !skillsMatch) return false;
      }

      // Category filter
      if (filters.category && !provider.skills.some(skill => skill.category === filters.category)) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategory && !provider.skills.some(skill => skill.subcategory === filters.subcategory)) {
        return false;
      }

      // Location filter
      if (filters.location && provider.location.governorate !== filters.location) {
        return false;
      }

      // Rating filter
      if (filters.rating > 0 && provider.rating < filters.rating) {
        return false;
      }

      // Price range filter
      if (provider.pricingRange.min > filters.priceRange.max || provider.pricingRange.max < filters.priceRange.min) {
        return false;
      }

      // Verification level filter
      if (filters.verificationLevel !== 'all' && provider.verificationLevel !== filters.verificationLevel) {
        return false;
      }

      // Availability filter
      if (filters.availability === 'available' && !provider.availability.isAvailable) {
        return false;
      }

      // Response time filter
      if (filters.responseTime !== 'all') {
        const responseHours = provider.averageResponseTime / 60;
        switch (filters.responseTime) {
          case '1h':
            if (responseHours > 1) return false;
            break;
          case '4h':
            if (responseHours > 4) return false;
            break;
          case '24h':
            if (responseHours > 24) return false;
            break;
        }
      }

      return true;
    });

    // Sort providers
    filtered.sort((a: Provider, b: Provider) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'response':
          return a.averageResponseTime - b.averageResponseTime;
        case 'experience':
          const aExp = a.skills.reduce((sum, skill) => sum + skill.yearsOfExperience, 0);
          const bExp = b.skills.reduce((sum, skill) => sum + skill.yearsOfExperience, 0);
          return bExp - aExp;
        case 'price_low':
          return a.pricingRange.min - b.pricingRange.min;
        case 'price_high':
          return b.pricingRange.max - a.pricingRange.max;
        case 'completion':
          return b.completionRate - a.completionRate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProviders, filters]);

  // Generate search suggestions
  useEffect(() => {
    if (!allProviders || !filters.searchQuery) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = new Set<string>();
    const query = filters.searchQuery.toLowerCase();

    allProviders.forEach((provider: Provider) => {
      // Add name suggestions
      if (provider.name.first.toLowerCase().includes(query)) {
        suggestions.add(provider.name.first);
      }
      if (provider.name.last.toLowerCase().includes(query)) {
        suggestions.add(provider.name.last);
      }

      // Add skill suggestions
      provider.skills.forEach(skill => {
        if (skill.category.toLowerCase().includes(query)) {
          suggestions.add(skill.category);
        }
        if (skill.subcategory.toLowerCase().includes(query)) {
          suggestions.add(skill.subcategory);
        }
      });
    });

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  }, [allProviders, filters.searchQuery]);

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
      rating: 0,
      priceRange: { min: 0, max: 10000 },
      verificationLevel: 'all',
      availability: 'all',
      responseTime: 'all',
      sortBy: 'rating',
      viewMode: 'grid'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ساعة`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} يوم`;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.location) count++;
    if (filters.rating > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.verificationLevel !== 'all') count++;
    if (filters.availability !== 'all') count++;
    if (filters.responseTime !== 'all') count++;
    return count;
  };

  if (providersLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل المحترفين...</p>
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
                placeholder="ابحث عن محترفين، مهارات، أو خدمات..."
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

              {/* Rating */}
              <FormSelect
                label="التقييم الأدنى"
                value={filters.rating.toString()}
                onChange={(value) => handleFilterChange('rating', parseFloat(value))}
                options={[
                  { value: '0', label: 'جميع التقييمات' },
                  { value: '3', label: '3 نجوم وأكثر' },
                  { value: '4', label: '4 نجوم وأكثر' },
                  { value: '4.5', label: '4.5 نجوم وأكثر' }
                ]}
                placeholder="التقييم الأدنى"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Verification Level */}
              <FormSelect
                label="مستوى التحقق"
                value={filters.verificationLevel}
                onChange={(value) => handleFilterChange('verificationLevel', value)}
                options={VERIFICATION_OPTIONS}
                placeholder="مستوى التحقق"
              />

              {/* Availability */}
              <FormSelect
                label="التوفر"
                value={filters.availability}
                onChange={(value) => handleFilterChange('availability', value)}
                options={AVAILABILITY_OPTIONS}
                placeholder="حالة التوفر"
              />

              {/* Response Time */}
              <FormSelect
                label="وقت الاستجابة"
                value={filters.responseTime}
                onChange={(value) => handleFilterChange('responseTime', value)}
                options={RESPONSE_TIME_OPTIONS}
                placeholder="وقت الاستجابة"
              />

              {/* Sort By */}
              <FormSelect
                label="ترتيب حسب"
                value={filters.sortBy}
                onChange={(value) => handleFilterChange('sortBy', value)}
                options={SORT_OPTIONS}
                placeholder="ترتيب النتائج"
              />
            </div>

            {/* Price Range */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">نطاق السعر (جنيه مصري)</label>
              <div className="flex gap-4">
                <FormInput
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(value) => handleFilterChange('priceRange', { ...filters.priceRange, min: parseFloat(value) || 0 })}
                  placeholder="من"
                  className="flex-1"
                />
                <FormInput
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(value) => handleFilterChange('priceRange', { ...filters.priceRange, max: parseFloat(value) || 10000 })}
                  placeholder="إلى"
                  className="flex-1"
                />
              </div>
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
          تم العثور على <span className="font-semibold text-deep-teal">{filteredProviders.length}</span> محترف
        </p>
        {getActiveFiltersCount() > 0 && (
          <Badge variant="info" className="text-sm">
            {getActiveFiltersCount()} فلتر نشط
          </Badge>
        )}
      </div>

      {/* Providers Grid/List */}
      <div className={filters.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredProviders.map((provider: Provider) => (
          <div
            key={provider._id}
            className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${
              filters.viewMode === 'list' ? 'p-6' : 'p-4'
            }`}
            onClick={() => onProviderSelect?.(provider)}
          >
            {filters.viewMode === 'grid' ? (
              // Grid View
              <div className="space-y-4">
                {/* Provider Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {provider.avatarUrl ? (
                        <img 
                          src={provider.avatarUrl} 
                          alt={`${provider.name.first} ${provider.name.last}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-deep-teal">
                        {provider.name.first} {provider.name.last}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{provider.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({provider.reviewCount} تقييم)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {provider.isVerified && (
                      <Badge variant="success" className="text-xs">محقق</Badge>
                    )}
                    {provider.isTopRated && (
                      <Badge variant="premium" className="text-xs">مميز</Badge>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">المهارات:</div>
                  <div className="flex flex-wrap gap-1">
                    {provider.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="category" className="text-xs">
                        {skill.subcategory}
                      </Badge>
                    ))}
                    {provider.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{provider.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-deep-teal">
                      {provider.completedJobs}
                    </div>
                    <div className="text-xs text-gray-600">مهمة مكتملة</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-deep-teal">
                      {formatResponseTime(provider.averageResponseTime)}
                    </div>
                    <div className="text-xs text-gray-600">وقت الاستجابة</div>
                  </div>
                </div>

                {/* Location & Pricing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{provider.location.city}, {provider.location.governorate}</span>
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatPrice(provider.pricingRange.min)} - {formatPrice(provider.pricingRange.max)}
                  </div>
                </div>
              </div>
            ) : (
              // List View
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {provider.avatarUrl ? (
                    <img 
                      src={provider.avatarUrl} 
                      alt={`${provider.name.first} ${provider.name.last}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-deep-teal text-lg">
                        {provider.name.first} {provider.name.last}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{provider.rating}</span>
                          <span>({provider.reviewCount} تقييم)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.location.city}, {provider.location.governorate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatResponseTime(provider.averageResponseTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {provider.isVerified && (
                        <Badge variant="success">محقق</Badge>
                      )}
                      {provider.isTopRated && (
                        <Badge variant="premium">مميز</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {provider.skills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="category" className="text-xs">
                          {skill.subcategory}
                        </Badge>
                      ))}
                      {provider.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.skills.length - 5}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600 text-lg">
                        {formatPrice(provider.pricingRange.min)} - {formatPrice(provider.pricingRange.max)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {provider.completedJobs} مهمة مكتملة
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد محترفون</h3>
          <p className="text-gray-600 mb-4">
            لم نتمكن من العثور على محترفين يطابقون معايير البحث الخاصة بك
          </p>
          <Button variant="outline" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProviderBrowsingInterface; 
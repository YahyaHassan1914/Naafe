import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Star, 
  Clock, 
  X,
  SlidersHorizontal,
  SortAsc,
  SortDesc
} from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/UnifiedSelect';
import { EGYPT_GOVERNORATES, EGYPT_CITIES } from '../../utils/constants';

interface SearchFilters {
  search: string;
  category: string;
  subcategory: string;
  location: string;
  city: string;
  priceMin: string;
  priceMax: string;
  rating: string;
  urgency: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  availability: string;
  verifiedOnly: boolean;
  topRatedOnly: boolean;
}

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (query: string) => void;
  onClearFilters: () => void;
  variant?: 'inline' | 'sidebar' | 'modal';
  placeholder?: string;
  searchType?: 'requests' | 'providers' | 'all';
  showAdvancedFilters?: boolean;
  className?: string;
  disabled?: boolean;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  variant = 'inline',
  placeholder = 'البحث عن الخدمات...',
  searchType = 'all',
  showAdvancedFilters = true,
  className = '',
  disabled = false
}) => {
  const { useCategories } = useApi();
  const categoriesQuery = useCategories();

  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const categories = categoriesQuery.data?.data || [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (localFilters.category && categories.length > 0) {
      const category = categories.find(cat => cat._id === localFilters.category);
      setSelectedCategory(category);
    }
  }, [localFilters.category, categories]);

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [field]: value };

    if (field === 'category') {
      newFilters.subcategory = '';
    }

    if (field === 'location') {
      newFilters.city = '';
    }

    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    if (variant === 'modal') {
      setShowFilters(false);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      search: '',
      category: '',
      subcategory: '',
      location: '',
      city: '',
      priceMin: '',
      priceMax: '',
      rating: '',
      urgency: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      availability: '',
      verifiedOnly: false,
      topRatedOnly: false
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = localFilters.search.trim();
    if (searchQuery) {
      onSearch(searchQuery);
    }
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(localFilters).some(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return false;
      if (typeof value === 'boolean') return value;
      return value && value !== '';
    });
  }, [localFilters]);

  const getSortOptions = () => {
    const baseOptions = [
      { value: 'createdAt', label: 'الأحدث' },
      { value: 'updatedAt', label: 'آخر تحديث' }
    ];

    if (searchType === 'requests' || searchType === 'all') {
      baseOptions.push(
        { value: 'deadline', label: 'الموعد النهائي' },
        { value: 'urgency', label: 'الأولوية' },
        { value: 'responses', label: 'عدد الردود' }
      );
    }

    if (searchType === 'providers' || searchType === 'all') {
      baseOptions.push(
        { value: 'rating', label: 'التقييم' },
        { value: 'completedJobs', label: 'المهام المكتملة' },
        { value: 'price', label: 'السعر' }
      );
    }

    return baseOptions;
  };

  const getUrgencyOptions = () => [
    { value: '', label: 'جميع الأولويات' },
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' },
    { value: 'urgent', label: 'عاجلة' }
  ];

  const getStatusOptions = () => [
    { value: '', label: 'جميع الحالات' },
    { value: 'open', label: 'مفتوح' },
    { value: 'negotiating', label: 'قيد التفاوض' },
    { value: 'assigned', label: 'تم التعيين' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  const getRatingOptions = () => [
    { value: '', label: 'جميع التقييمات' },
    { value: '4.5', label: '4.5+ نجوم' },
    { value: '4.0', label: '4.0+ نجوم' },
    { value: '3.5', label: '3.5+ نجوم' },
    { value: '3.0', label: '3.0+ نجوم' }
  ];

  const getAvailabilityOptions = () => [
    { value: '', label: 'جميع الأوقات' },
    { value: 'today', label: 'اليوم' },
    { value: 'tomorrow', label: 'غداً' },
    { value: 'this_week', label: 'هذا الأسبوع' },
    { value: 'next_week', label: 'الأسبوع القادم' }
  ];

  if (variant === 'inline') {
    return (
      <div className={`space-y-4 ${className}`}>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <FormInput
            type="text"
            value={localFilters.search}
            onChange={(value) => handleFilterChange('search', value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-12"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={disabled || !localFilters.search.trim()}
            className="absolute left-2 top-1/2 transform -translate-y-1/2"
          >
            بحث
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            disabled={disabled}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فلاتر متقدمة</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={disabled}
              className="flex items-center space-x-2 space-x-reverse text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              <span>مسح الفلاتر</span>
            </Button>
          )}
        </div>

        {showFilters && showAdvancedFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                فلاتر متقدمة
              </h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={disabled}
                >
                  مسح الكل
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyFilters}
                  disabled={disabled}
                >
                  تطبيق الفلاتر
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  الفئة الرئيسية
                </label>
                <UnifiedSelect
                  value={localFilters.category}
                  onChange={(value) => handleFilterChange('category', value)}
                  options={[
                    { value: '', label: 'جميع الفئات' },
                    ...categories.map(cat => ({ value: cat._id, label: cat.name }))
                  ]}
                  placeholder="اختر الفئة"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  الفئة الفرعية
                </label>
                <UnifiedSelect
                  value={localFilters.subcategory}
                  onChange={(value) => handleFilterChange('subcategory', value)}
                  options={[
                    { value: '', label: 'جميع الفئات الفرعية' },
                    ...(selectedCategory?.subcategories?.map((sub: any) => ({
                      value: sub._id,
                      label: sub.name
                    })) || [])
                  ]}
                  placeholder="اختر الفئة الفرعية"
                  disabled={disabled || !localFilters.category}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  المحافظة
                </label>
                <UnifiedSelect
                  value={localFilters.location}
                  onChange={(value) => handleFilterChange('location', value)}
                  options={[
                    { value: '', label: 'جميع المحافظات' },
                    ...EGYPT_GOVERNORATES.map(gov => ({ value: gov.name, label: gov.name }))
                  ]}
                  placeholder="اختر المحافظة"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  المدينة
                </label>
                <UnifiedSelect
                  value={localFilters.city}
                  onChange={(value) => handleFilterChange('city', value)}
                  options={[
                    { value: '', label: 'جميع المدن' },
                    ...(localFilters.location ? 
                      EGYPT_CITIES[localFilters.location]?.map(city => ({ value: city, label: city })) || []
                      : []
                    )
                  ]}
                  placeholder="اختر المدينة"
                  disabled={disabled || !localFilters.location}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  السعر الأدنى
                </label>
                <FormInput
                  type="number"
                  value={localFilters.priceMin}
                  onChange={(value) => handleFilterChange('priceMin', value)}
                  placeholder="0"
                  min={0}
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  السعر الأقصى
                </label>
                <FormInput
                  type="number"
                  value={localFilters.priceMax}
                  onChange={(value) => handleFilterChange('priceMax', value)}
                  placeholder="10000"
                  min={0}
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  التقييم
                </label>
                <UnifiedSelect
                  value={localFilters.rating}
                  onChange={(value) => handleFilterChange('rating', value)}
                  options={getRatingOptions()}
                  placeholder="اختر التقييم"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  الأولوية
                </label>
                <UnifiedSelect
                  value={localFilters.urgency}
                  onChange={(value) => handleFilterChange('urgency', value)}
                  options={getUrgencyOptions()}
                  placeholder="اختر الأولوية"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  الحالة
                </label>
                <UnifiedSelect
                  value={localFilters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={getStatusOptions()}
                  placeholder="اختر الحالة"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ترتيب حسب
                </label>
                <UnifiedSelect
                  value={localFilters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  options={getSortOptions()}
                  placeholder="اختر الترتيب"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.verifiedOnly}
                  onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 text-deep-teal focus:ring-deep-teal"
                />
                <span className="text-sm text-text-primary">المزودين المؤكدين فقط</span>
              </label>

              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.topRatedOnly}
                  onChange={(e) => handleFilterChange('topRatedOnly', e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 text-deep-teal focus:ring-deep-teal"
                />
                <span className="text-sm text-text-primary">الأعلى تقييماً فقط</span>
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`space-y-6 ${className}`}>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <FormInput
            type="text"
            value={localFilters.search}
            onChange={(value) => handleFilterChange('search', value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              الفلاتر
            </h3>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={disabled}
                className="text-red-600 hover:text-red-700"
              >
                مسح الكل
              </Button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              الفئة
            </label>
            <UnifiedSelect
              value={localFilters.category}
              onChange={(value) => handleFilterChange('category', value)}
              options={[
                { value: '', label: 'جميع الفئات' },
                ...categories.map(cat => ({ value: cat._id, label: cat.name }))
              ]}
              placeholder="اختر الفئة"
              disabled={disabled}
            />
          </div>

          {localFilters.category && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                الفئة الفرعية
              </label>
              <UnifiedSelect
                value={localFilters.subcategory}
                onChange={(value) => handleFilterChange('subcategory', value)}
                options={[
                  { value: '', label: 'جميع الفئات الفرعية' },
                  ...(selectedCategory?.subcategories?.map((sub: any) => ({
                    value: sub._id,
                    label: sub.name
                  })) || [])
                ]}
                placeholder="اختر الفئة الفرعية"
                disabled={disabled}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              المحافظة
            </label>
            <UnifiedSelect
              value={localFilters.location}
              onChange={(value) => handleFilterChange('location', value)}
              options={[
                { value: '', label: 'جميع المحافظات' },
                ...EGYPT_GOVERNORATES.map(gov => ({ value: gov.name, label: gov.name }))
              ]}
              placeholder="اختر المحافظة"
              disabled={disabled}
            />
          </div>

          {localFilters.location && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                المدينة
              </label>
              <UnifiedSelect
                value={localFilters.city}
                onChange={(value) => handleFilterChange('city', value)}
                options={[
                  { value: '', label: 'جميع المدن' },
                  ...(EGYPT_CITIES[localFilters.location]?.map(city => ({ value: city, label: city })) || [])
                ]}
                placeholder="اختر المدينة"
                disabled={disabled}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              نطاق السعر
            </label>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                type="number"
                value={localFilters.priceMin}
                onChange={(value) => handleFilterChange('priceMin', value)}
                placeholder="من"
                min={0}
                disabled={disabled}
              />
              <FormInput
                type="number"
                value={localFilters.priceMax}
                onChange={(value) => handleFilterChange('priceMax', value)}
                placeholder="إلى"
                min={0}
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              التقييم
            </label>
            <UnifiedSelect
              value={localFilters.rating}
              onChange={(value) => handleFilterChange('rating', value)}
              options={getRatingOptions()}
              placeholder="اختر التقييم"
              disabled={disabled}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleApplyFilters}
            disabled={disabled}
            className="w-full"
          >
            تطبيق الفلاتر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Button
        variant="outline"
        onClick={() => setShowFilters(true)}
        disabled={disabled}
        className="w-full flex items-center justify-center space-x-2 space-x-reverse"
      >
        <Filter className="w-4 h-4" />
        <span>فلاتر البحث</span>
      </Button>
    </div>
  );
};

export default SearchAndFilter; 
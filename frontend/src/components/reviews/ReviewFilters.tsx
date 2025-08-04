import React, { useState } from 'react';
import { Filter, Star, Calendar, ThumbsUp, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface ReviewFiltersProps {
  filters: {
    rating?: number;
    dateRange?: string;
    hasPhotos?: boolean;
    verifiedOnly?: boolean;
    helpfulOnly?: boolean;
    category?: string;
    searchTerm?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      rating: undefined,
      dateRange: undefined,
      hasPhotos: undefined,
      verifiedOnly: undefined,
      helpfulOnly: undefined,
      category: undefined,
      searchTerm: undefined
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== false
  );

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== false
  ).length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">تصفية التقييمات</h3>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 ml-1" />
                مسح الفلاتر
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <FormInput
            value={localFilters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="البحث في التقييمات..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Rating Filter */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">التقييم</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('rating', localFilters.rating === rating ? undefined : rating)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    localFilters.rating === rating
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm">{rating} نجوم</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الفترة الزمنية</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'all', label: 'جميع الفترات' },
                { value: 'week', label: 'آخر أسبوع' },
                { value: 'month', label: 'آخر شهر' },
                { value: 'year', label: 'آخر سنة' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('dateRange', localFilters.dateRange === option.value ? undefined : option.value)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    localFilters.dateRange === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">فئة التقييم</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: 'all', label: 'جميع الفئات' },
                { value: 'quality', label: 'جودة العمل' },
                { value: 'communication', label: 'التواصل' },
                { value: 'punctuality', label: 'الالتزام بالمواعيد' },
                { value: 'cleanliness', label: 'النظافة' },
                { value: 'professionalism', label: 'الاحترافية' },
                { value: 'value', label: 'قيمة مقابل السعر' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('category', localFilters.category === option.value ? undefined : option.value)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    localFilters.category === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">خيارات إضافية</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.hasPhotos || false}
                  onChange={(e) => handleFilterChange('hasPhotos', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">تقييمات تحتوي على صور</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.verifiedOnly || false}
                  onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">تقييمات موثقة فقط</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.helpfulOnly || false}
                  onChange={(e) => handleFilterChange('helpfulOnly', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">تقييمات مفيدة فقط</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">الفلاتر النشطة:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.rating && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {filters.rating} نجوم
              </span>
            )}
            {filters.dateRange && filters.dateRange !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {filters.dateRange === 'week' ? 'آخر أسبوع' :
                 filters.dateRange === 'month' ? 'آخر شهر' :
                 filters.dateRange === 'year' ? 'آخر سنة' : filters.dateRange}
              </span>
            )}
            {filters.category && filters.category !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {filters.category === 'quality' ? 'جودة العمل' :
                 filters.category === 'communication' ? 'التواصل' :
                 filters.category === 'punctuality' ? 'الالتزام بالمواعيد' :
                 filters.category === 'cleanliness' ? 'النظافة' :
                 filters.category === 'professionalism' ? 'الاحترافية' :
                 filters.category === 'value' ? 'قيمة مقابل السعر' : filters.category}
              </span>
            )}
            {filters.hasPhotos && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                مع صور
              </span>
            )}
            {filters.verifiedOnly && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                موثق فقط
              </span>
            )}
            {filters.helpfulOnly && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                مفيد فقط
              </span>
            )}
            {filters.searchTerm && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                بحث: {filters.searchTerm}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewFilters; 
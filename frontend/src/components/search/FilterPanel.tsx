import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import Button from '../ui/Button';
import UnifiedSelect from '../ui/FormInput';

interface FilterOptions {
  category: string;
  subcategory: string;
  location: string;
  city: string;
  priceMin: string;
  priceMax: string;
  rating: string;
  urgency: string;
  status: string;
  availability: string;
  verifiedOnly: boolean;
  topRatedOnly: boolean;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  variant?: 'sidebar' | 'modal' | 'dropdown';
  className?: string;
  disabled?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
  variant = 'sidebar',
  className = '',
  disabled = false
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState<string[]>(['category', 'location']);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [field]: value };

    // Clear dependent fields
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
    onApplyFilters();
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      category: '',
      subcategory: '',
      location: '',
      city: '',
      priceMin: '',
      priceMax: '',
      rating: '',
      urgency: '',
      status: '',
      availability: '',
      verifiedOnly: false,
      topRatedOnly: false
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getRatingOptions = () => [
    { value: '', label: 'جميع التقييمات' },
    { value: '4.5', label: '4.5+ نجوم' },
    { value: '4.0', label: '4.0+ نجوم' },
    { value: '3.5', label: '3.5+ نجوم' },
    { value: '3.0', label: '3.0+ نجوم' }
  ];

  const getUrgencyOptions = () => [
    { value: '', label: 'جميع الأولويات' },
    { value: 'urgent', label: 'عاجل' },
    { value: 'high', label: 'عالية' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'low', label: 'منخفضة' }
  ];

  const getStatusOptions = () => [
    { value: '', label: 'جميع الحالات' },
    { value: 'open', label: 'مفتوح' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  const getAvailabilityOptions = () => [
    { value: '', label: 'جميع الأوقات' },
    { value: 'today', label: 'اليوم' },
    { value: 'tomorrow', label: 'غداً' },
    { value: 'this_week', label: 'هذا الأسبوع' },
    { value: 'next_week', label: 'الأسبوع القادم' }
  ];

  const containerClasses = {
    sidebar: 'w-80 bg-white border-l border-gray-200 p-6',
    modal: 'w-full max-w-md bg-white rounded-lg shadow-lg p-6',
    dropdown: 'w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4'
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">الفلاتر</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Category Section */}
        <div className="border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full text-left"
            disabled={disabled}
          >
            <span className="font-medium text-gray-900">الفئة</span>
            {expandedSections.includes('category') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.includes('category') && (
            <div className="mt-3 space-y-3">
              <UnifiedSelect
                label="الفئة الرئيسية"
                value={localFilters.category}
                onChange={(value) => handleFilterChange('category', value)}
                options={[
                  { value: '', label: 'اختر الفئة' },
                  { value: 'plumbing', label: 'سباكة' },
                  { value: 'electrical', label: 'كهرباء' },
                  { value: 'cleaning', label: 'تنظيف' },
                  { value: 'maintenance', label: 'صيانة' }
                ]}
                disabled={disabled}
              />
              
              {localFilters.category && (
                <UnifiedSelect
                  label="الفئة الفرعية"
                  value={localFilters.subcategory}
                  onChange={(value) => handleFilterChange('subcategory', value)}
                  options={[
                    { value: '', label: 'اختر الفئة الفرعية' },
                    { value: 'repair', label: 'إصلاح' },
                    { value: 'installation', label: 'تركيب' },
                    { value: 'maintenance', label: 'صيانة' }
                  ]}
                  disabled={disabled}
                />
              )}
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('location')}
            className="flex items-center justify-between w-full text-left"
            disabled={disabled}
          >
            <span className="font-medium text-gray-900">الموقع</span>
            {expandedSections.includes('location') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.includes('location') && (
            <div className="mt-3 space-y-3">
              <UnifiedSelect
                label="المحافظة"
                value={localFilters.location}
                onChange={(value) => handleFilterChange('location', value)}
                options={[
                  { value: '', label: 'اختر المحافظة' },
                  { value: 'cairo', label: 'القاهرة' },
                  { value: 'alexandria', label: 'الإسكندرية' },
                  { value: 'giza', label: 'الجيزة' }
                ]}
                disabled={disabled}
              />
              
              {localFilters.location && (
                <UnifiedSelect
                  label="المدينة"
                  value={localFilters.city}
                  onChange={(value) => handleFilterChange('city', value)}
                  options={[
                    { value: '', label: 'اختر المدينة' },
                    { value: 'downtown', label: 'وسط البلد' },
                    { value: 'heliopolis', label: 'مصر الجديدة' },
                    { value: 'maadi', label: 'المعادي' }
                  ]}
                  disabled={disabled}
                />
              )}
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
            disabled={disabled}
          >
            <span className="font-medium text-gray-900">السعر</span>
            {expandedSections.includes('price') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.includes('price') && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="من"
                  value={localFilters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  value={localFilters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left"
            disabled={disabled}
          >
            <span className="font-medium text-gray-900">التقييم</span>
            {expandedSections.includes('rating') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.includes('rating') && (
            <div className="mt-3 space-y-3">
              <UnifiedSelect
                label="التقييم الأدنى"
                value={localFilters.rating}
                onChange={(value) => handleFilterChange('rating', value)}
                options={getRatingOptions()}
                disabled={disabled}
              />
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="topRatedOnly"
                  checked={localFilters.topRatedOnly}
                  onChange={(e) => handleFilterChange('topRatedOnly', e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="topRatedOnly" className="text-sm text-gray-700">
                  الأعلى تقييماً فقط
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Additional Filters */}
        <div className="border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('additional')}
            className="flex items-center justify-between w-full text-left"
            disabled={disabled}
          >
            <span className="font-medium text-gray-900">فلاتر إضافية</span>
            {expandedSections.includes('additional') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.includes('additional') && (
            <div className="mt-3 space-y-3">
              <UnifiedSelect
                label="الأولوية"
                value={localFilters.urgency}
                onChange={(value) => handleFilterChange('urgency', value)}
                options={getUrgencyOptions()}
                disabled={disabled}
              />
              
              <UnifiedSelect
                label="الحالة"
                value={localFilters.status}
                onChange={(value) => handleFilterChange('status', value)}
                options={getStatusOptions()}
                disabled={disabled}
              />
              
              <UnifiedSelect
                label="التوفر"
                value={localFilters.availability}
                onChange={(value) => handleFilterChange('availability', value)}
                options={getAvailabilityOptions()}
                disabled={disabled}
              />
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="verifiedOnly"
                  checked={localFilters.verifiedOnly}
                  onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="verifiedOnly" className="text-sm text-gray-700">
                  المصدق عليهم فقط
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-3 space-x-reverse mt-6">
        <Button
          onClick={handleApplyFilters}
          disabled={disabled}
          className="flex-1"
        >
          تطبيق الفلاتر
        </Button>
        <Button
          variant="outline"
          onClick={handleClearFilters}
          disabled={disabled}
        >
          مسح الكل
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel; 
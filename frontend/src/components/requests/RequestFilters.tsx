import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';

interface RequestFiltersProps {
  filters: {
    category: string;
    subcategory: string;
    location: string;
    budgetMin: string;
    budgetMax: string;
    urgency: string;
    status: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

const RequestFilters: React.FC<RequestFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const { useCategories } = useApi();
  const categoriesQuery = useCategories();
  
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [localFilters, setLocalFilters] = useState(filters);

  // Get selected category details
  useEffect(() => {
    if (localFilters.category && categoriesQuery.data?.data) {
      const category = categoriesQuery.data.data.find(cat => cat._id === localFilters.category);
      setSelectedCategory(category);
    }
  }, [localFilters.category, categoriesQuery.data]);

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...localFilters, [field]: value };
    
    // Reset subcategory when category changes
    if (field === 'category') {
      newFilters.subcategory = '';
    }
    
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: '',
      subcategory: '',
      location: '',
      budgetMin: '',
      budgetMax: '',
      urgency: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const getUrgencyName = (urgency: string) => {
    const names = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل'
    };
    return names[urgency as keyof typeof names] || urgency;
  };

  const getStatusName = (status: string) => {
    const names = {
      open: 'مفتوح',
      negotiating: 'قيد التفاوض',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      expired: 'منتهي الصلاحية'
    };
    return names[status as keyof typeof names] || status;
  };

  const getSortName = (sortBy: string) => {
    const names = {
      createdAt: 'تاريخ الإنشاء',
      deadline: 'تاريخ الانتهاء',
      budget: 'الميزانية',
      urgency: 'الأولوية'
    };
    return names[sortBy as keyof typeof names] || sortBy;
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value && value !== 'createdAt' && value !== 'desc');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          فلاتر البحث
        </h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            مسح الكل
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyFilters}
          >
            تطبيق الفلاتر
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الفئة الرئيسية
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
          >
            <option value="">جميع الفئات</option>
            {categoriesQuery.data?.data?.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الفئة الفرعية
          </label>
          <select
            value={localFilters.subcategory}
            onChange={(e) => handleFilterChange('subcategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
            disabled={!localFilters.category}
          >
            <option value="">جميع الفئات الفرعية</option>
            {selectedCategory?.subcategories?.map((subcategory: any) => (
              <option key={subcategory._id} value={subcategory._id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الموقع
          </label>
          <FormInput
            type="text"
            value={localFilters.location}
            onChange={(value) => handleFilterChange('location', value)}
            placeholder="مثال: القاهرة، المعادي"
          />
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الميزانية الدنيا
          </label>
          <FormInput
            type="number"
            value={localFilters.budgetMin}
            onChange={(value) => handleFilterChange('budgetMin', value)}
            placeholder="0"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الميزانية القصوى
          </label>
          <FormInput
            type="number"
            value={localFilters.budgetMax}
            onChange={(value) => handleFilterChange('budgetMax', value)}
            placeholder="10000"
            min={0}
          />
        </div>

        {/* Urgency Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الأولوية
          </label>
          <select
            value={localFilters.urgency}
            onChange={(e) => handleFilterChange('urgency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
          >
            <option value="">جميع الأولويات</option>
            <option value="low">{getUrgencyName('low')}</option>
            <option value="medium">{getUrgencyName('medium')}</option>
            <option value="high">{getUrgencyName('high')}</option>
            <option value="urgent">{getUrgencyName('urgent')}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            الحالة
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
          >
            <option value="">جميع الحالات</option>
            <option value="open">{getStatusName('open')}</option>
            <option value="negotiating">{getStatusName('negotiating')}</option>
            <option value="in_progress">{getStatusName('in_progress')}</option>
            <option value="completed">{getStatusName('completed')}</option>
            <option value="cancelled">{getStatusName('cancelled')}</option>
            <option value="expired">{getStatusName('expired')}</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            ترتيب حسب
          </label>
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
          >
            <option value="createdAt">{getSortName('createdAt')}</option>
            <option value="deadline">{getSortName('deadline')}</option>
            <option value="budget">{getSortName('budget')}</option>
            <option value="urgency">{getSortName('urgency')}</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            اتجاه الترتيب
          </label>
          <select
            value={localFilters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
          >
            <option value="desc">تنازلي (الأحدث أولاً)</option>
            <option value="asc">تصاعدي (الأقدم أولاً)</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-text-primary mb-3">
            الفلاتر النشطة:
          </h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-deep-teal text-white">
                الفئة: {categoriesQuery.data?.data?.find(c => c._id === localFilters.category)?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="mr-1 ml-1 hover:bg-teal-700 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.subcategory && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-deep-teal text-white">
                الفئة الفرعية: {selectedCategory?.subcategories?.find((s: any) => s._id === localFilters.subcategory)?.name}
                <button
                  onClick={() => handleFilterChange('subcategory', '')}
                  className="mr-1 ml-1 hover:bg-teal-700 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.location && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600 text-white">
                الموقع: {localFilters.location}
                <button
                  onClick={() => handleFilterChange('location', '')}
                  className="mr-1 ml-1 hover:bg-blue-700 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            {(localFilters.budgetMin || localFilters.budgetMax) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-600 text-white">
                الميزانية: {localFilters.budgetMin || '0'} - {localFilters.budgetMax || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('budgetMin', '');
                    handleFilterChange('budgetMax', '');
                  }}
                  className="mr-1 ml-1 hover:bg-green-700 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.urgency && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-600 text-white">
                الأولوية: {getUrgencyName(localFilters.urgency)}
                <button
                  onClick={() => handleFilterChange('urgency', '')}
                  className="mr-1 ml-1 hover:bg-orange-700 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-600 text-white">
                الحالة: {getStatusName(localFilters.status)}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="mr-1 ml-1 hover:bg-purple-700 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-text-primary mb-3">
          فلاتر سريعة:
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters({
                ...localFilters,
                status: 'open',
                urgency: ''
              });
            }}
            className={localFilters.status === 'open' ? 'bg-deep-teal text-white' : ''}
          >
            طلبات مفتوحة
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters({
                ...localFilters,
                urgency: 'urgent',
                status: ''
              });
            }}
            className={localFilters.urgency === 'urgent' ? 'bg-red-600 text-white' : ''}
          >
            عاجلة
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters({
                ...localFilters,
                budgetMin: '1000',
                budgetMax: '5000'
              });
            }}
            className={localFilters.budgetMin === '1000' && localFilters.budgetMax === '5000' ? 'bg-green-600 text-white' : ''}
          >
            ميزانية متوسطة
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters({
                ...localFilters,
                sortBy: 'deadline',
                sortOrder: 'asc'
              });
            }}
            className={localFilters.sortBy === 'deadline' && localFilters.sortOrder === 'asc' ? 'bg-blue-600 text-white' : ''}
          >
            تنتهي قريباً
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestFilters; 
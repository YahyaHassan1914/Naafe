import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Search, ChevronDown, ChevronUp, Check, Grid, List } from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  subcategories: Subcategory[];
}

interface Subcategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

interface CategorySelectionProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onSubcategorySelect: (subcategoryId: string, subcategoryName: string) => void;
  onClearSelection?: () => void;
  showSubcategories?: boolean;
  maxCategories?: number;
  className?: string;
  variant?: 'grid' | 'list' | 'dropdown';
  placeholder?: string;
  disabled?: boolean;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  onClearSelection,
  showSubcategories = true,
  maxCategories = 12,
  className = '',
  variant = 'grid',
  placeholder = 'اختر الفئة...',
  disabled = false
}) => {
  const { useCategories } = useApi();
  const categoriesQuery = useCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const categories = categoriesQuery.data?.data || [];
  const isLoading = categoriesQuery.isLoading;
  const error = categoriesQuery.error;

  // Filter categories based on search term
  const filteredCategories = categories
    .filter((category: Category) => 
      category.isActive && 
      (category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       category.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, showAllCategories ? undefined : maxCategories);

  // Get selected category and subcategory objects
  const selectedCategoryObj = categories.find((cat: Category) => cat._id === selectedCategory);
  const selectedSubcategoryObj = selectedCategoryObj?.subcategories?.find(
    (sub: Subcategory) => sub._id === selectedSubcategory
  );

  const handleCategoryClick = (category: Category) => {
    if (disabled) return;
    
    if (expandedCategory === category._id) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category._id);
      onCategorySelect(category._id, category.name);
      // Clear subcategory when changing category
      if (selectedSubcategory) {
        onSubcategorySelect('', '');
      }
    }
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    if (disabled) return;
    onSubcategorySelect(subcategory._id, subcategory.name);
    setExpandedCategory(null);
  };

  const handleClearSelection = () => {
    if (disabled) return;
    setExpandedCategory(null);
    setSearchTerm('');
    onClearSelection?.();
  };

  const getCategoryIcon = (category: Category) => {
    if (category.icon) {
      return (
        <img
          src={category.icon}
          alt={category.name}
          className="w-8 h-8 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-deep-teal/10 rounded-lg flex items-center justify-center">
        <span className="text-deep-teal font-bold text-sm">
          {category.name.charAt(0)}
        </span>
      </div>
    );
  };

  const getSubcategoryIcon = (subcategory: Subcategory) => {
    if (subcategory.icon) {
      return (
        <img
          src={subcategory.icon}
          alt={subcategory.name}
          className="w-6 h-6 object-cover rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    return (
      <div className="w-6 h-6 bg-bright-orange/10 rounded flex items-center justify-center">
        <span className="text-bright-orange font-bold text-xs">
          {subcategory.name.charAt(0)}
        </span>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" text="جاري تحميل الفئات..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 mb-2">فشل تحميل الفئات</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => categoriesQuery.refetch()}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <input
            type="text"
            value={selectedCategoryObj ? selectedCategoryObj.name : ''}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent bg-white cursor-pointer"
            onClick={() => !disabled && setExpandedCategory(expandedCategory ? null : 'dropdown')}
          />
          <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {expandedCategory === 'dropdown' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="البحث في الفئات..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-2">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  لا توجد فئات مطابقة
                </div>
              ) : (
                filteredCategories.map((category: Category) => (
                  <div key={category._id}>
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className="w-full text-right p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {getCategoryIcon(category)}
                        <div>
                          <div className="font-medium text-text-primary group-hover:text-deep-teal">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-sm text-text-secondary">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {expandedCategory === category._id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {expandedCategory === category._id && showSubcategories && category.subcategories?.length > 0 && (
                      <div className="mr-8 mt-2 space-y-1">
                        {category.subcategories
                          .filter((sub: Subcategory) => sub.isActive)
                          .map((subcategory: Subcategory) => (
                            <button
                              key={subcategory._id}
                              onClick={() => handleSubcategoryClick(subcategory)}
                              className="w-full text-right p-2 hover:bg-orange-50 rounded flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {getSubcategoryIcon(subcategory)}
                                <span className="text-sm text-text-primary group-hover:text-bright-orange">
                                  {subcategory.name}
                                </span>
                              </div>
                              {selectedSubcategory === subcategory._id && (
                                <Check className="w-4 h-4 text-bright-orange" />
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid/List variants
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            اختر الفئة
          </h3>
          <p className="text-text-secondary">
            اختر الفئة التي تناسب احتياجاتك
          </p>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Clear selection */}
          {(selectedCategory || selectedSubcategory) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={disabled}
            >
              مسح الاختيار
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="البحث في الفئات..."
          disabled={disabled}
          className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-teal focus:border-transparent"
        />
      </div>

      {/* Selected items display */}
      {(selectedCategory || selectedSubcategory) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">الفئة المختارة:</h4>
          <div className="space-y-1">
            {selectedCategoryObj && (
              <div className="flex items-center space-x-2 space-x-reverse">
                {getCategoryIcon(selectedCategoryObj)}
                <span className="text-blue-700">{selectedCategoryObj.name}</span>
              </div>
            )}
            {selectedSubcategoryObj && (
              <div className="flex items-center space-x-2 space-x-reverse mr-6">
                {getSubcategoryIcon(selectedSubcategoryObj)}
                <span className="text-blue-700">{selectedSubcategoryObj.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              لا توجد فئات مطابقة
            </h3>
            <p className="text-gray-500">
              جرب البحث بكلمات مختلفة
            </p>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredCategories.map((category: Category) => (
            <div
              key={category._id}
              className={`bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
                selectedCategory === category._id
                  ? 'border-deep-teal shadow-lg'
                  : 'border-gray-200 hover:border-deep-teal/50 hover:shadow-md'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Category header */}
              <button
                onClick={() => handleCategoryClick(category)}
                disabled={disabled}
                className="w-full p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {getCategoryIcon(category)}
                    <div className="text-right">
                      <h4 className="font-semibold text-text-primary">
                        {category.name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-text-secondary mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {showSubcategories && category.subcategories?.length > 0 && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-xs text-text-secondary">
                        {category.subcategories.filter((sub: Subcategory) => sub.isActive).length} فرعي
                      </span>
                      {expandedCategory === category._id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Subcategories */}
              {expandedCategory === category._id && showSubcategories && category.subcategories?.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <div className="p-3">
                    <h5 className="text-sm font-medium text-text-primary mb-3">
                      الفئات الفرعية:
                    </h5>
                    <div className="space-y-2">
                      {category.subcategories
                        .filter((sub: Subcategory) => sub.isActive)
                        .map((subcategory: Subcategory) => (
                          <button
                            key={subcategory._id}
                            onClick={() => handleSubcategoryClick(subcategory)}
                            disabled={disabled}
                            className={`w-full text-right p-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                              selectedSubcategory === subcategory._id
                                ? 'bg-bright-orange/10 border border-bright-orange/20'
                                : 'hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {getSubcategoryIcon(subcategory)}
                              <span className="text-sm text-text-primary">
                                {subcategory.name}
                              </span>
                            </div>
                            {selectedSubcategory === subcategory._id && (
                              <Check className="w-4 h-4 text-bright-orange" />
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show more/less button */}
      {categories.length > maxCategories && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAllCategories(!showAllCategories)}
          >
            {showAllCategories ? 'عرض أقل' : `عرض المزيد (${categories.length - maxCategories})`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategorySelection; 
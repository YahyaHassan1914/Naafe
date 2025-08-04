import React from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  subcategories?: Subcategory[];
}

interface Subcategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  isExpanded?: boolean;
  selectedSubcategory?: string;
  onSelect?: (categoryId: string, categoryName: string) => void;
  onSubcategorySelect?: (subcategoryId: string, subcategoryName: string) => void;
  onToggleExpand?: (categoryId: string) => void;
  showSubcategories?: boolean;
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
  disabled?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  isExpanded = false,
  selectedSubcategory,
  onSelect,
  onSubcategorySelect,
  onToggleExpand,
  showSubcategories = true,
  variant = 'grid',
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled || !onSelect) return;
    
    if (showSubcategories && category.subcategories?.length > 0) {
      onToggleExpand?.(category._id);
    } else {
      onSelect(category._id, category.name);
    }
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    if (disabled || !onSubcategorySelect) return;
    onSubcategorySelect(subcategory._id, subcategory.name);
  };

  const getCategoryIcon = () => {
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

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
          isSelected
            ? 'border-deep-teal bg-deep-teal/5'
            : 'border-gray-200 hover:border-deep-teal/50 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          {getCategoryIcon()}
          <div className="text-right">
            <h4 className="font-medium text-text-primary text-sm">
              {category.name}
            </h4>
            {category.description && (
              <p className="text-xs text-text-secondary mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>
        
        {showSubcategories && category.subcategories?.length > 0 && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs text-text-secondary">
              {category.subcategories.filter(sub => sub.isActive).length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        className={`bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
          isSelected
            ? 'border-deep-teal shadow-lg'
            : 'border-gray-200 hover:border-deep-teal/50 hover:shadow-md'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <button
          onClick={handleClick}
          disabled={disabled}
          className="w-full p-4 text-right hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              {getCategoryIcon()}
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
                  {category.subcategories.filter(sub => sub.isActive).length} فرعي
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </button>

        {isExpanded && showSubcategories && category.subcategories?.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="p-3">
              <h5 className="text-sm font-medium text-text-primary mb-3">
                الفئات الفرعية:
              </h5>
              <div className="space-y-2">
                {category.subcategories
                  .filter(sub => sub.isActive)
                  .map((subcategory) => (
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
    );
  }

  // Grid variant (default)
  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'border-deep-teal shadow-lg'
          : 'border-gray-200 hover:border-deep-teal/50 hover:shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-full p-4 text-center hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col items-center space-y-3">
          {getCategoryIcon()}
          <div>
            <h4 className="font-semibold text-text-primary text-sm">
              {category.name}
            </h4>
            {category.description && (
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
            {showSubcategories && category.subcategories?.length > 0 && (
              <p className="text-xs text-text-secondary mt-1">
                {category.subcategories.filter(sub => sub.isActive).length} فئة فرعية
              </p>
            )}
          </div>
        </div>
      </button>

      {isExpanded && showSubcategories && category.subcategories?.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 p-3">
          <h5 className="text-xs font-medium text-text-primary mb-2 text-center">
            الفئات الفرعية:
          </h5>
          <div className="space-y-1">
            {category.subcategories
              .filter(sub => sub.isActive)
              .slice(0, 3) // Show only first 3 in grid view
              .map((subcategory) => (
                <button
                  key={subcategory._id}
                  onClick={() => handleSubcategoryClick(subcategory)}
                  disabled={disabled}
                  className={`w-full text-center p-2 rounded text-xs transition-all duration-200 ${
                    selectedSubcategory === subcategory._id
                      ? 'bg-bright-orange/10 text-bright-orange'
                      : 'hover:bg-white hover:text-text-primary'
                  }`}
                >
                  {subcategory.name}
                </button>
              ))}
            {category.subcategories.filter(sub => sub.isActive).length > 3 && (
              <p className="text-xs text-text-secondary text-center mt-1">
                +{category.subcategories.filter(sub => sub.isActive).length - 3} أكثر
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCard; 
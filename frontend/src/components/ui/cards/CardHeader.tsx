import React from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface CardHeaderProps {
  avatar?: string;
  name: string;
  category?: string;
  isVerified?: boolean;
  isTopRated?: boolean;
  rating?: number;
  memberSince?: string;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  avatar,
  name,
  category,
  isVerified = false,
  isTopRated = false,
  rating,
  memberSince,
  className
}) => {
  // Format member since date
  const formatMemberSince = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Format rating with proper fallback
  const formatRating = (rating?: number) => {
    if (typeof rating === 'number' && !isNaN(rating) && rating > 0) {
      return rating.toFixed(1);
    }
    return null;
  };

  return (
    <div className={cn('flex items-start gap-3 mb-3', className)}>
      {/* Avatar Container */}
      <div className="flex-shrink-0 relative">
        <img
          src={avatar || '/default-avatar.png'}
          alt={`${name} profile`}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-avatar.png';
          }}
        />
        
        {/* Verification Badge */}
        {isVerified && (
          <div className="absolute -top-1 -right-1">
            <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full shadow-sm" />
          </div>
        )}
      </div>

      {/* Name and Info */}
      <div className="flex-1 min-w-0">
        {/* Name - Always visible, handles long names */}
        <h3 className="text-base font-bold text-deep-teal truncate leading-tight mb-1">
          {name}
        </h3>

        {/* Category and Rating Row */}
        <div className="flex items-center gap-2 mb-1">
          {category && (
            <span className="bg-soft-teal/20 text-deep-teal px-2 py-0.5 rounded-md text-xs font-medium truncate">
              {category}
            </span>
          )}
          
          {rating && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(rating)}</span>
            </div>
          )}
        </div>

        {/* Member Since and Top Rated */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {memberSince && (
            <span>عضو منذ {formatMemberSince(memberSince)}</span>
          )}
          
          {isTopRated && (
            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-medium">
              مميز
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardHeader; 
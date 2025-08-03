import React from 'react';
import { cn } from '../../../utils/cn';

interface CardContentProps {
  title?: string;
  description?: string;
  skills?: string[];
  availability?: {
    days?: string[];
    timeSlots?: string[];
  };
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  urgency?: 'low' | 'medium' | 'high';
  deadline?: string;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({
  title,
  description,
  skills,
  availability,
  budget,
  urgency,
  deadline,
  className
}) => {
  // Format budget range
  const formatBudget = () => {
    if (!budget) return null;
    
    const { min, max, currency = 'EGP' } = budget;
    
    if (min && max && min !== max) {
      return `${min} - ${max} ${currency}`;
    } else if (min) {
      return `${min} ${currency}`;
    }
    
    return null;
  };

  // Format availability
  const formatAvailability = () => {
    if (!availability?.days?.length) return null;
    
    const dayNames: Record<string, string> = {
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
      saturday: 'السبت'
    };

    const formattedDays = availability.days
      .map(day => dayNames[day] || day)
      .slice(0, 3); // Show max 3 days

    return formattedDays.join('، ');
  };

  // Format deadline
  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    
    try {
      const date = new Date(deadline);
      return date.toLocaleDateString('ar-EG', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch {
      return null;
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={cn('flex-1 mb-3', className)}>
      {/* Title */}
      {title && (
        <h4 className="text-sm font-semibold text-deep-teal mb-2 line-clamp-2 leading-tight">
          {title}
        </h4>
      )}

      {/* Budget and Urgency Row */}
      {(budget || urgency) && (
        <div className="flex items-center gap-2 mb-2">
          {budget && (
            <span className="text-sm font-bold text-green-600">
              {formatBudget()}
            </span>
          )}
          
          {urgency && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              getUrgencyColor(urgency)
            )}>
              {urgency === 'high' ? 'عاجل' : urgency === 'medium' ? 'متوسط' : 'عادي'}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-1">المهارات:</div>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="bg-soft-teal/20 text-deep-teal px-2 py-0.5 rounded text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-xs text-gray-500">
                +{skills.length - 3} أكثر
              </span>
            )}
          </div>
        </div>
      )}

      {/* Availability and Deadline */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {availability && (
          <span className="truncate">
            {formatAvailability()}
          </span>
        )}
        
        {deadline && (
          <span className="flex-shrink-0">
            موعد: {formatDeadline(deadline)}
          </span>
        )}
      </div>
    </div>
  );
};

export default CardContent; 
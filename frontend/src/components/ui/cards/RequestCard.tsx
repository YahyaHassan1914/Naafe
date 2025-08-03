import React from 'react';
import { Eye, Calendar, DollarSign, MessageCircle, Clock } from 'lucide-react';
import CardContainer from './CardContainer';
import CardHeader from './CardHeader';
import CardMetrics from './CardMetrics';
import CardContent from './CardContent';
import CardActions from './CardActions';
import { ServiceRequest } from '../../../types';

interface RequestCardProps {
  request: ServiceRequest;
  onViewDetails: (requestId: string) => void;
  onApply?: (requestId: string) => void;
  alreadyApplied?: boolean;
  loading?: boolean;
  error?: boolean;
  className?: string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onViewDetails,
  onApply,
  alreadyApplied = false,
  loading = false,
  error = false,
  className
}) => {
  // Format time posted
  const formatTimePosted = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'منذ دقائق';
      if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
      if (diffInHours < 48) return 'منذ يوم';
      return `منذ ${Math.floor(diffInHours / 24)} يوم`;
    } catch {
      return 'منذ فترة';
    }
  };

  // Format budget
  const formatBudget = () => {
    const { budget } = request;
    if (!budget) return 'سعر متغير';
    
    const { min = 0, max = 0 } = budget;
    if (min && max && min !== max) {
      return `${min} - ${max} جنيه`;
    } else if (min) {
      return `${min} جنيه`;
    }
    return 'سعر متغير';
  };

  // Format deadline
  const formatDeadline = () => {
    if (!request.deadline) return 'لا يوجد موعد محدد';
    
    try {
      const deadline = new Date(request.deadline);
      const now = new Date();
      const diffInDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 0) return 'منتهي';
      if (diffInDays === 0) return 'اليوم';
      if (diffInDays === 1) return 'غداً';
      if (diffInDays <= 7) return `خلال ${diffInDays} أيام`;
      return deadline.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    } catch {
      return 'موعد محدد';
    }
  };

  // Prepare metrics - Only show essential info
  const metrics = [
    {
      label: 'عرض',
      value: request.responses || 0,
      color: 'primary' as const,
      icon: <MessageCircle className="w-3 h-3" />
    },
    {
      label: 'موعد',
      value: formatDeadline(),
      color: 'secondary' as const,
      icon: <Calendar className="w-3 h-3" />
    }
  ];

  // Prepare actions
  const actions = [
    {
      label: 'عرض التفاصيل',
      variant: 'outline' as const,
      onClick: () => onViewDetails(request.id),
      icon: <Eye className="w-4 h-4" />
    }
  ];

  // Add apply action if available and not already applied
  if (onApply && !alreadyApplied) {
    actions.push({
      label: 'أنا مهتم',
      variant: 'primary' as const,
      onClick: () => onApply(request.id),
      icon: <MessageCircle className="w-4 h-4" />
    });
  }

  // Show applied status if already applied
  if (alreadyApplied) {
    actions.push({
      label: 'تم التقديم',
      variant: 'secondary' as const,
      onClick: () => onViewDetails(request.id),
      disabled: true
    });
  }

  return (
    <CardContainer
      variant="request"
      loading={loading}
      error={error}
      className={className}
      onClick={() => onViewDetails(request.id)}
    >
      <CardHeader
        avatar={request.postedBy?.avatar}
        name={request.postedBy?.name || 'مستخدم'}
        category={request.category}
        isVerified={request.postedBy?.isVerified}
      />

      {/* Essential Info Section */}
      <div className="mb-3">
        {/* Urgency and Time Posted */}
        <div className="flex items-center gap-2 mb-2">
          {request.urgency && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              request.urgency === 'high' ? 'text-red-600 bg-red-100' :
              request.urgency === 'medium' ? 'text-orange-600 bg-orange-100' :
              'text-green-600 bg-green-100'
            }`}>
              {request.urgency === 'high' ? 'عاجل' : request.urgency === 'medium' ? 'متوسط' : 'عادي'}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatTimePosted(request.timePosted || request.createdAt)}
          </span>
        </div>

        {/* Description */}
        {request.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
            {request.description}
          </p>
        )}

        {/* Budget and Location */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">{formatBudget()}</span>
          </div>
          

        </div>
      </div>

      <CardActions
        actions={actions}
        layout="horizontal"
      />
    </CardContainer>
  );
};

export default RequestCard; 
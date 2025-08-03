import React from 'react';
import { Eye, Calendar, DollarSign, MessageCircle } from 'lucide-react';
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
  // Prepare metrics
  const metrics = [
    {
      label: 'عرض',
      value: request.responses || 0,
      color: 'primary' as const,
      icon: <MessageCircle className="w-3 h-3" />
    },
    {
      label: 'جنيه',
      value: request.budget?.min || 0,
      color: 'success' as const,
      icon: <DollarSign className="w-3 h-3" />
    },
    {
      label: 'موعد',
      value: request.deadline ? 'محدد' : 'مفتوح',
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

      <CardMetrics
        metrics={metrics}
        layout="grid-3"
      />

      <CardContent
        title={request.title}
        description={request.description}
        budget={request.budget}
        urgency={request.urgency}
        deadline={request.deadline}
        availability={request.availability}
      />

      <CardActions
        actions={actions}
        layout="horizontal"
      />
    </CardContainer>
  );
};

export default RequestCard; 
import React from 'react';
import { Star, Eye, MessageCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import CardContainer from './CardContainer';
import CardHeader from './CardHeader';
import CardMetrics from './CardMetrics';
import CardContent from './CardContent';
import CardActions from './CardActions';
import { ServiceProvider } from '../../../types';

interface ProviderCardProps {
  provider: ServiceProvider;
  onViewDetails: (providerId: string) => void;
  onContact?: (providerId: string) => void;
  onHire?: (providerId: string) => void;
  onCheckAvailability?: (providerId: string) => void;
  loading?: boolean;
  error?: boolean;
  className?: string;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onViewDetails,
  onContact,
  onHire,
  onCheckAvailability,
  loading = false,
  error = false,
  className
}) => {
  // Format provider name
  const formatName = (name: string) => {
    if (typeof name === 'object' && name !== null && 'first' in name && 'last' in name) {
      return `${(name as { first: string; last: string }).first} ${(name as { first: string; last: string }).last}`;
    }
    return name;
  };

  // Format pricing
  const formatPricing = () => {
    const { budgetMin = 0, budgetMax = 0 } = provider;
    if (budgetMin && budgetMax && budgetMin !== budgetMax) {
      return `${budgetMin} - ${budgetMax} جنيه`;
    } else if (budgetMin) {
      return `${budgetMin} جنيه`;
    }
    return 'سعر متغير';
  };

  // Format availability
  const formatAvailability = () => {
    if (!provider.availability?.days?.length) return 'متاح حسب الطلب';
    
    const dayNames: Record<string, string> = {
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
      saturday: 'السبت'
    };

    const formattedDays = provider.availability.days
      .map(day => dayNames[day] || day)
      .slice(0, 3); // Show max 3 days

    return `متاح: ${formattedDays.join('، ')}`;
  };

  // Prepare metrics - Only show essential info
  const metrics = [
    {
      label: 'تقييم',
      value: provider.rating ? `${provider.rating.toFixed(1)} (${provider.completedJobs || 0} مهمة)` : 'جديد',
      color: 'primary' as const,
      icon: <Star className="w-3 h-3" />
    }
  ];

  // Prepare actions
  const actions = [
    {
      label: 'عرض التفاصيل',
      variant: 'outline' as const,
      onClick: () => onViewDetails(provider.id),
      icon: <Eye className="w-4 h-4" />
    }
  ];

  // Add contact action if available
  if (onContact) {
    actions.push({
      label: 'تواصل',
      variant: 'primary' as const,
      onClick: () => onContact(provider.id),
      icon: <MessageCircle className="w-4 h-4" />
    });
  }

  // Add check availability action if available
  if (onCheckAvailability) {
    actions.push({
      label: 'تحقق من التوفر',
      variant: 'outline' as const,
      onClick: () => onCheckAvailability(provider.id),
      icon: <Calendar className="w-4 h-4" />
    });
  }

  return (
    <CardContainer
      variant="provider"
      loading={loading}
      error={error}
      className={className}
      onClick={() => onViewDetails(provider.id)}
    >
      <CardHeader
        avatar={provider.imageUrl}
        name={formatName(provider.name)}
        category={provider.category}
        isVerified={provider.isVerified}
        rating={provider.rating}
      />

      {/* Essential Info Section */}
      <div className="mb-3">
        {/* Description */}
        {provider.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        )}

        {/* Pricing and Availability */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">{formatPricing()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatAvailability()}</span>
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

export default ProviderCard; 
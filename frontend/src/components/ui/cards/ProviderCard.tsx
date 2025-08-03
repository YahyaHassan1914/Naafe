import React from 'react';
import { Star, Eye, MessageCircle } from 'lucide-react';
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
  loading?: boolean;
  error?: boolean;
  className?: string;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onViewDetails,
  onContact,
  onHire,
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

  // Prepare metrics
  const metrics = [
    {
      label: 'مهمة',
      value: provider.completedJobs || 0,
      color: 'primary' as const,
      icon: <Star className="w-3 h-3" />
    },
    {
      label: 'تقييم',
      value: provider.rating || 0,
      color: 'warning' as const,
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

  // Add hire action if available
  if (onHire) {
    actions.push({
      label: 'استأجر',
      variant: 'primary' as const,
      onClick: () => onHire(provider.id),
      icon: <Star className="w-4 h-4" />
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
        isTopRated={provider.isTopRated}
        rating={provider.rating}
        memberSince={provider.memberSince}
      />

      <CardMetrics
        metrics={metrics}
        layout="grid-2"
      />

      <CardContent
        title={provider.title}
        description={provider.description}
        skills={provider.skills}
        availability={provider.availability}
        budget={{
          min: provider.budgetMin,
          max: provider.budgetMax,
          currency: 'EGP'
        }}
      />

      <CardActions
        actions={actions}
        layout="horizontal"
      />
    </CardContainer>
  );
};

export default ProviderCard; 
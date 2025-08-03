import React from 'react';
import { cn } from '../../../utils/cn';

interface MetricItem {
  label: string;
  value: string | number;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  icon?: React.ReactNode;
}

interface CardMetricsProps {
  metrics: MetricItem[];
  layout?: 'grid-2' | 'grid-3' | 'horizontal';
  className?: string;
}

const CardMetrics: React.FC<CardMetricsProps> = ({
  metrics,
  layout = 'grid-2',
  className
}) => {
  const layoutClasses = {
    'grid-2': 'grid grid-cols-2 gap-2',
    'grid-3': 'grid grid-cols-3 gap-2',
    'horizontal': 'flex gap-4'
  };

  const colorClasses = {
    primary: 'text-deep-teal',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-orange-600'
  };

  // Format value with proper fallbacks
  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toString();
    }
    return value;
  };

  return (
    <div className={cn('mb-3', layoutClasses[layout], className)}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={cn(
            'bg-gray-50 rounded-lg p-2 text-center',
            layout === 'horizontal' && 'flex-1'
          )}
        >
          <div className={cn(
            'text-sm font-bold mb-1',
            colorClasses[metric.color || 'primary']
          )}>
            {metric.icon && (
              <span className="inline-block mr-1">{metric.icon}</span>
            )}
            {formatValue(metric.value)}
          </div>
          <div className="text-xs text-gray-500">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardMetrics; 
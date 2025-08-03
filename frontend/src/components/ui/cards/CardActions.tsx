import React from 'react';
import { cn } from '../../../utils/cn';
import Button from '../Button';

interface CardAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

interface CardActionsProps {
  actions: CardAction[];
  layout?: 'horizontal' | 'vertical' | 'stacked';
  className?: string;
}

const CardActions: React.FC<CardActionsProps> = ({
  actions,
  layout = 'horizontal',
  className
}) => {
  const layoutClasses = {
    horizontal: 'flex gap-2',
    vertical: 'flex flex-col gap-2',
    stacked: 'grid grid-cols-1 gap-2'
  };

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-auto', layoutClasses[layout], className)}>
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outline'}
          size={action.size || 'sm'}
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
          className={cn(
            'flex-1 min-h-[36px]',
            action.className
          )}
        >
          {action.icon && (
            <span className="ml-1">{action.icon}</span>
          )}
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default CardActions; 
import React from 'react';
import { cn } from '../../../utils/cn';

interface CardContainerProps {
  children: React.ReactNode;
  variant?: 'provider' | 'request';
  loading?: boolean;
  error?: boolean;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const CardContainer: React.FC<CardContainerProps> = ({
  children,
  variant = 'provider',
  loading = false,
  error = false,
  className,
  onClick,
  interactive = true
}) => {
  const baseClasses = `
    relative bg-white rounded-xl border border-gray-200 
    shadow-sm hover:shadow-md transition-all duration-300
    overflow-hidden
  `;

  const variantClasses = {
    provider: 'hover:border-deep-teal/30',
    request: 'hover:border-soft-teal/30'
  };

  const interactiveClasses = interactive ? 'cursor-pointer transform hover:-translate-y-1' : '';

  const errorClasses = error ? 'border-red-200 bg-red-50' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        interactiveClasses,
        errorClasses,
        className
      )}
      onClick={interactive && onClick ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
            خطأ في التحميل
          </div>
        </div>
      )}

      <div className="p-4 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default CardContainer; 
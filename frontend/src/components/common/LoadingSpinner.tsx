import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'text-deep-teal',
    secondary: 'text-warm-cream',
    white: 'text-white'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${variantClasses[variant]} animate-spin rounded-full border-2 border-current border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={`mt-2 text-sm ${variantClasses[variant]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 
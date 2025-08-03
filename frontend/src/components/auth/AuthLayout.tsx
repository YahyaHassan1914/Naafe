import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
  maxWidth = 'md'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-teal to-teal-600 flex items-center justify-center p-4">
      <div className={`w-full ${maxWidthClasses[maxWidth]}`}>
        {/* Logo */}
        {showLogo && (
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="text-4xl font-bold text-white mb-2">نافع</div>
              <div className="text-white/80 text-sm">منصة الخدمات المصرية</div>
            </Link>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-text-secondary text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            © 2024 نافع. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 
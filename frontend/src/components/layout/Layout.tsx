import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from '../Footer';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const Layout: React.FC<LayoutProps> = ({
  children,
  className = '',
  showHeader = true,
  showFooter = true,
  fullWidth = false,
  maxWidth = '7xl'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className="min-h-screen bg-warm-cream flex flex-col">
      {/* Header */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main 
        className={`flex-1 ${
          showHeader ? 'pt-16' : ''
        } ${className}`}
      >
        {fullWidth ? (
          children
        ) : (
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]}`}>
            {children}
          </div>
        )}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout; 
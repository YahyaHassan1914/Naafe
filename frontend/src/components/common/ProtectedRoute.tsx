import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: ('admin' | 'seeker' | 'provider')[];
  requireVerified?: boolean;
  fallbackPath?: string;
  showLoading?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  requireVerified = false,
  fallbackPath = '/',
  showLoading = true
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="جاري التحقق من الصلاحيات..." 
        />
      </div>
    );
  }

  // If not authenticated, redirect to login with return path
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`} 
        replace 
      />
    );
  }

  // Check if user is verified (if required)
  if (requireVerified && !user.isVerified) {
    return (
      <Navigate 
        to={`/verification?redirect=${encodeURIComponent(location.pathname)}`} 
        replace 
      />
    );
  }

  // If roles are required, check if user has any of the required roles
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleBasedRedirect = {
      admin: '/admin',
      provider: '/provider/dashboard',
      seeker: '/dashboard'
    };
    
    return (
      <Navigate 
        to={roleBasedRedirect[user.role] || fallbackPath} 
        replace 
      />
    );
  }

  // User is authenticated and has required roles, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 
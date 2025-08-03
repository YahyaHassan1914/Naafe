import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحقق من الحساب..." />
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout
      title="تسجيل الدخول"
      subtitle="أدخل بياناتك للوصول إلى حسابك"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage; 
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage: React.FC = () => {
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
      title="إنشاء حساب جديد"
      subtitle="انضم إلى منصة نافع واحصل على أفضل الخدمات"
      maxWidth="lg"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage; 
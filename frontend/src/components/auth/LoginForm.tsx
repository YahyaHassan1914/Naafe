import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import LoadingSpinner from '../common/LoadingSpinner';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, error, clearError } = useAuth();
  const { useLogin } = useApi();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const user = await login(formData);
      if (user) {
        // Redirect to intended page or dashboard
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login error:', error);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@naafe.com',
      password: 'demo123'
    });
    
    // Small delay to show the demo credentials
    setTimeout(async () => {
      try {
        const user = await login({
          email: 'demo@naafe.com',
          password: 'demo123'
        });
        if (user) {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Demo login error:', error);
      }
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <FormInput
        label="البريد الإلكتروني"
        type="email"
        value={formData.email}
        onChange={(value) => handleInputChange('email', value)}
        error={errors.email}
        placeholder="أدخل بريدك الإلكتروني"
        required
        autoComplete="email"
        autoFocus
      />

      {/* Password Field */}
      <FormInput
        label="كلمة المرور"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={(value) => handleInputChange('password', value)}
        error={errors.password}
        placeholder="أدخل كلمة المرور"
        required
        autoComplete="current-password"
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-text-secondary hover:text-text-primary"
          >
            {showPassword ? 'إخفاء' : 'إظهار'}
          </button>
        }
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Forgot Password Link */}
      <div className="text-right">
        <Link
          to="/forgot-password"
          className="text-sm text-deep-teal hover:text-teal-700 transition-colors"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner size="sm" variant="white" className="mr-2" />
            جاري تسجيل الدخول...
          </div>
        ) : (
          'تسجيل الدخول'
        )}
      </Button>

      {/* Demo Login Button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleDemoLogin}
        disabled={loginMutation.isPending}
      >
        تسجيل دخول تجريبي
      </Button>

      {/* Register Link */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-text-secondary text-sm">
          ليس لديك حساب؟{' '}
          <Link
            to="/register"
            className="text-deep-teal hover:text-teal-700 font-medium transition-colors"
          >
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm; 
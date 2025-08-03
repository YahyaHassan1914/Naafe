import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if no token
  if (!token) {
    return (
      <AuthLayout
        title="رابط غير صحيح"
        subtitle="رابط إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية"
      >
        <div className="text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              رابط غير صحيح
            </h3>
            <p className="text-text-secondary text-sm">
              رابط إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية. 
              يرجى طلب رابط جديد.
            </p>
          </div>
          
          <Link
            to="/forgot-password"
            className="inline-block"
          >
            <Button variant="primary" size="lg">
              طلب رابط جديد
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await authService.resetPassword(token, formData.password);
      setIsSuccess(true);
    } catch (error: any) {
      setErrors({
        general: error?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="تم إعادة تعيين كلمة المرور"
        subtitle="يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة"
      >
        <div className="text-center space-y-6">
          <div className="text-6xl">✅</div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              تم إعادة تعيين كلمة المرور بنجاح
            </h3>
            <p className="text-text-secondary text-sm">
              تم تغيير كلمة المرور الخاصة بك. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
            </p>
          </div>
          
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            تسجيل الدخول
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="إعادة تعيين كلمة المرور"
      subtitle="أدخل كلمة المرور الجديدة"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password Field */}
        <FormInput
          label="كلمة المرور الجديدة"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
          error={errors.password}
          placeholder="كلمة المرور الجديدة"
          required
          autoComplete="new-password"
          autoFocus
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

        {/* Confirm Password Field */}
        <FormInput
          label="تأكيد كلمة المرور"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
          error={errors.confirmPassword}
          placeholder="تأكيد كلمة المرور"
          required
          autoComplete="new-password"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-text-secondary hover:text-text-primary"
            >
              {showConfirmPassword ? 'إخفاء' : 'إظهار'}
            </button>
          }
        />

        {/* General Error Display */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" variant="white" className="mr-2" />
              جاري إعادة التعيين...
            </div>
          ) : (
            'إعادة تعيين كلمة المرور'
          )}
        </Button>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-deep-teal hover:text-teal-700 transition-colors"
          >
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage; 
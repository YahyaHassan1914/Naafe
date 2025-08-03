import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import LoadingSpinner from '../common/LoadingSpinner';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();
  const { useRegister } = useApi();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useRegister();

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'الاسم الأول مطلوب';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'الاسم الأول يجب أن يكون حرفين على الأقل';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'الاسم الأخير مطلوب';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'الاسم الأخير يجب أن يكون حرفين على الأقل';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // Phone validation (Egyptian phone numbers)
    if (!formData.phone) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^(\+20|0)?1[0125][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

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

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'يجب الموافقة على الشروط والأحكام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
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

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format Egyptian phone number
    if (digits.startsWith('20')) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
    } else if (digits.startsWith('0')) {
      return `+20 ${digits.slice(1, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    } else if (digits.startsWith('1')) {
      return `+20 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }
    
    return value;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const success = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase(),
        phone: formData.phone.replace(/\s/g, ''),
        password: formData.password
      });
      
      if (success) {
        // Registration successful, user will be automatically logged in
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      // Error is handled by the auth context
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="الاسم الأول"
          type="text"
          value={formData.firstName}
          onChange={(value) => handleInputChange('firstName', value)}
          error={errors.firstName}
          placeholder="الاسم الأول"
          required
          autoComplete="given-name"
          autoFocus
        />
        
        <FormInput
          label="الاسم الأخير"
          type="text"
          value={formData.lastName}
          onChange={(value) => handleInputChange('lastName', value)}
          error={errors.lastName}
          placeholder="الاسم الأخير"
          required
          autoComplete="family-name"
        />
      </div>

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
      />

      {/* Phone Field */}
      <FormInput
        label="رقم الهاتف"
        type="tel"
        value={formData.phone}
        onChange={handlePhoneChange}
        error={errors.phone}
        placeholder="+20 123 4567 890"
        required
        autoComplete="tel"
      />

      {/* Password Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(value) => handleInputChange('password', value)}
          error={errors.password}
          placeholder="كلمة المرور"
          required
          autoComplete="new-password"
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
        
        <FormInput
          label="تأكيد كلمة المرور"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(value) => handleInputChange('confirmPassword', value)}
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
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <label className="flex items-start space-x-3 space-x-reverse cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
            className="mt-1 h-4 w-4 text-deep-teal focus:ring-deep-teal border-gray-300 rounded"
          />
          <span className="text-sm text-text-secondary">
            أوافق على{' '}
            <Link
              to="/terms"
              className="text-deep-teal hover:text-teal-700 underline"
              target="_blank"
            >
              الشروط والأحكام
            </Link>
            {' '}و{' '}
            <Link
              to="/privacy"
              className="text-deep-teal hover:text-teal-700 underline"
              target="_blank"
            >
              سياسة الخصوصية
            </Link>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-red-600 text-sm">{errors.agreeToTerms}</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner size="sm" variant="white" className="mr-2" />
            جاري إنشاء الحساب...
          </div>
        ) : (
          'إنشاء حساب جديد'
        )}
      </Button>

      {/* Login Link */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-text-secondary text-sm">
          لديك حساب بالفعل؟{' '}
          <Link
            to="/login"
            className="text-deep-teal hover:text-teal-700 font-medium transition-colors"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm; 
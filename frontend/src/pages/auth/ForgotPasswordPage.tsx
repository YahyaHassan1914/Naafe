import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ForgotPasswordPage: React.FC = () => {
  const { clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    setIsLoading(true);
    setError(null);
    clearError();

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error?.message || 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="تم إرسال رابط إعادة التعيين"
        subtitle="تحقق من بريدك الإلكتروني"
      >
        <div className="text-center space-y-6">
          <div className="text-6xl">📧</div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              تم إرسال رابط إعادة تعيين كلمة المرور
            </h3>
            <p className="text-text-secondary text-sm">
              لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى:
            </p>
            <p className="text-deep-teal font-medium mt-1">{email}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>ملاحظة:</strong> قد يستغرق وصول الرسالة بضع دقائق. 
              تحقق من مجلد الرسائل غير المرغوب فيها إذا لم تجد الرسالة في صندوق الوارد.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
            >
              إعادة المحاولة
            </Button>
            
            <Link
              to="/login"
              className="block text-center text-sm text-deep-teal hover:text-teal-700 transition-colors"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="نسيت كلمة المرور؟"
      subtitle="أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="البريد الإلكتروني"
          type="email"
          value={email}
          onChange={setEmail}
          error={error}
          placeholder="أدخل بريدك الإلكتروني"
          required
          autoComplete="email"
          autoFocus
        />

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
              جاري الإرسال...
            </div>
          ) : (
            'إرسال رابط إعادة التعيين'
          )}
        </Button>

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

export default ForgotPasswordPage; 
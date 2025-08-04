import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  User,
  Star,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import ProviderApplicationForm from '../../components/provider/ProviderApplicationForm';
import ApplicationStatusTracker from '../../components/provider/ApplicationStatusTracker';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface ProviderApplicationPageProps {
  className?: string;
}

const ProviderApplicationPage: React.FC<ProviderApplicationPageProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { showError } = useToast();

  const [hasApplication, setHasApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has existing application
  const { data: applicationStatus } = useApi('/provider/application/status');

  useEffect(() => {
    if (applicationStatus) {
      setHasApplication(true);
    }
    setIsLoading(false);
  }, [applicationStatus]);

  // Redirect if user is already a provider
  useEffect(() => {
    if (user?.roles?.includes('provider')) {
      showError('أنت بالفعل محترف في المنصة');
      navigate('/provider-dashboard');
    }
  }, [user, navigate, showError]);

  const benefits = [
    {
      icon: TrendingUp,
      title: 'زيادة الدخل',
      description: 'احصل على عملاء جدد وزد دخلك الشهري'
    },
    {
      icon: User,
      title: 'عملاء موثوقين',
      description: 'عملاء محليين يبحثون عن خدماتك'
    },
    {
      icon: Clock,
      title: 'مرونة في العمل',
      description: 'اختر أوقاتك وأماكن عملك'
    },
    {
      icon: Star,
      title: 'بناء السمعة',
      description: 'احصل على تقييمات ومراجعات إيجابية'
    }
  ];

  const handleApplicationComplete = (applicationData: any) => {
    setHasApplication(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-warm-cream ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-deep-teal">انضم كمحترف</h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">مرحباً، {user.name.first}</span>
                <Badge variant="category">
                  {user.roles?.includes('provider') ? 'محترف' : 'مستخدم'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasApplication ? (
          // Show application status
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Briefcase className="w-16 h-16 text-deep-teal mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-deep-teal mb-2">طلبك قيد المراجعة</h2>
              <p className="text-gray-600">نحن نراجع طلبك للانضمام كمحترف</p>
            </div>
            
            <ApplicationStatusTracker />
          </div>
        ) : (
          // Show application form
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <Briefcase className="w-20 h-20 text-deep-teal mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-deep-teal mb-4">
                انضم إلى نافع كمحترف
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                اربح من مهاراتك وقدم خدماتك لعملاء محليين في منطقتك. 
                انضم إلى مجتمع المحترفين الموثوقين واحصل على فرص عمل جديدة.
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
                {[
                  { value: '5K+', label: 'محترف نشط' },
                  { value: '50K+', label: 'خدمة مكتملة' },
                  { value: '4.8', label: 'متوسط التقييم' },
                  { value: '95%', label: 'رضا العملاء' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-deep-teal mb-1">{stat.value}</div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-deep-teal text-center mb-8">
                لماذا تنضم إلى نافع؟
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-center w-16 h-16 bg-deep-teal/10 rounded-full mb-4 mx-auto">
                        <Icon className="w-8 h-8 text-deep-teal" />
                      </div>
                      <h3 className="text-lg font-semibold text-deep-teal mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Process */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-deep-teal text-center mb-8">
                خطوات الانضمام
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    step: 1,
                    title: 'تقديم الطلب',
                    description: 'املأ النموذج واختر مهاراتك'
                  },
                  {
                    step: 2,
                    title: 'مراجعة الطلب',
                    description: 'نراجع طلبك خلال 24-48 ساعة'
                  },
                  {
                    step: 3,
                    title: 'التحقق من الهوية',
                    description: 'تحقق من هويتك ومهاراتك'
                  },
                  {
                    step: 4,
                    title: 'البدء في العمل',
                    description: 'ابدأ في تقديم خدماتك'
                  }
                ].map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-deep-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                      {step.step}
                    </div>
                    <h3 className="font-semibold text-deep-teal mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Form */}
            <ProviderApplicationForm onComplete={handleApplicationComplete} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderApplicationPage; 
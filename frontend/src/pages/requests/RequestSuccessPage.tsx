import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  Star, 
  MapPin, 
  User, 
  MessageSquare, 
  ArrowRight,
  Copy,
  Share2,
  Eye,
  Phone,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface Provider {
  _id: string;
  name: { first: string; last: string };
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  isTopRated: boolean;
  responseTime: number; // in minutes
  skills: Array<{
    category: string;
    subcategory: string;
    verified: boolean;
  }>;
  location: {
    governorate: string;
    city: string;
  };
  pricingRange: {
    min: number;
    max: number;
  };
}

interface RequestSuccessPageProps {
  className?: string;
}

const RequestSuccessPage: React.FC<RequestSuccessPageProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [requestId, setRequestId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [estimatedResponseTime, setEstimatedResponseTime] = useState<string>('1-2 ساعة');
  const [recommendedProviders, setRecommendedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Get data from navigation state
  useEffect(() => {
    if (location.state) {
      setRequestId(location.state.requestId || '');
      setCategory(location.state.category || '');
      setSubcategory(location.state.subcategory || '');
    }
  }, [location.state]);

  // Fetch recommended providers
  const { data: providersData, isLoading: providersLoading } = useApi(
    `/requests/${requestId}/recommendations`,
    { enabled: !!requestId }
  );

  useEffect(() => {
    if (providersData) {
      setRecommendedProviders(providersData.providers || []);
      setLoading(false);
    }
  }, [providersData]);

  const handleContactProvider = (providerId: string) => {
    navigate(`/chat/new?provider=${providerId}&request=${requestId}`);
  };

  const handleViewProviderProfile = (providerId: string) => {
    navigate(`/provider/${providerId}`);
  };

  const handleViewRequest = () => {
    navigate(`/requests/${requestId}`);
  };

  const handleCopyRequestLink = () => {
    const requestUrl = `${window.location.origin}/requests/${requestId}`;
    navigator.clipboard.writeText(requestUrl);
    showSuccess('تم نسخ رابط الطلب');
  };

  const handleShareRequest = () => {
    if (navigator.share) {
      navigator.share({
        title: `طلب خدمة - ${category} - ${subcategory}`,
        text: `طلب خدمة ${subcategory} في ${category}`,
        url: `${window.location.origin}/requests/${requestId}`
      });
    } else {
      handleCopyRequestLink();
    }
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      return `${hours} ساعة`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} يوم`;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التوصيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-warm-cream py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-deep-teal mb-4">
            تم نشر طلبك بنجاح! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            طلب خدمة <strong>{subcategory}</strong> في <strong>{category}</strong> جاهز لاستقبال العروض
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600">الوقت المتوقع للرد</div>
              <div className="font-semibold text-blue-600">{estimatedResponseTime}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">المحترفون الموصى بهم</div>
              <div className="font-semibold text-green-600">{recommendedProviders.length}</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600">العروض المتوقعة</div>
              <div className="font-semibold text-purple-600">3-8 عروض</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleViewRequest} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              عرض الطلب
            </Button>
            <Button onClick={handleCopyRequestLink} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              نسخ الرابط
            </Button>
            <Button onClick={handleShareRequest} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              مشاركة
            </Button>
          </div>
        </div>

        {/* Recommended Providers */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-deep-teal mb-2">
                المحترفون الموصى بهم
              </h2>
              <p className="text-gray-600">
                محترفون متخصصون في {subcategory} في منطقتك
              </p>
            </div>
            <Badge variant="success" className="text-sm">
              {recommendedProviders.length} محترف
            </Badge>
          </div>

          {providersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
              <p className="text-gray-600">جاري البحث عن المحترفين...</p>
            </div>
          ) : recommendedProviders.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد محترفون متاحون حالياً</h3>
              <p className="text-gray-600 mb-4">
                سنقوم بإشعارك عندما يتوفر محترفون في منطقتك
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                العودة للوحة التحكم
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedProviders.map((provider) => (
                <div key={provider._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {/* Provider Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {provider.avatarUrl ? (
                          <img 
                            src={provider.avatarUrl} 
                            alt={`${provider.name.first} ${provider.name.last}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-deep-teal">
                          {provider.name.first} {provider.name.last}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{provider.rating}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            ({provider.reviewCount} تقييم)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {provider.isVerified && (
                        <Badge variant="success" className="text-xs">محقق</Badge>
                      )}
                      {provider.isTopRated && (
                        <Badge variant="premium" className="text-xs">مميز</Badge>
                      )}
                    </div>
                  </div>

                  {/* Provider Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-deep-teal">
                        {provider.completedJobs}
                      </div>
                      <div className="text-xs text-gray-600">مهمة مكتملة</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-deep-teal">
                        {formatResponseTime(provider.responseTime)}
                      </div>
                      <div className="text-xs text-gray-600">وقت الاستجابة</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{provider.location.city}, {provider.location.governorate}</span>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">نطاق الأسعار:</div>
                    <div className="font-semibold text-green-600">
                      {formatPrice(provider.pricingRange.min)} - {formatPrice(provider.pricingRange.max)}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">المهارات:</div>
                    <div className="flex flex-wrap gap-1">
                      {provider.skills
                        .filter(skill => skill.category === category)
                        .slice(0, 3)
                        .map((skill, index) => (
                          <Badge key={index} variant="category" className="text-xs">
                            {skill.subcategory}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleContactProvider(provider._id)}
                      className="flex-1"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      تواصل
                    </Button>
                    <Button
                      onClick={() => handleViewProviderProfile(provider._id)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h3 className="text-xl font-bold text-deep-teal mb-4">الخطوات التالية</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-deep-teal mb-2">انتظار العروض</h4>
              <p className="text-sm text-gray-600">
                سيتواصل معك المحترفون خلال {estimatedResponseTime}
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-deep-teal mb-2">مقارنة العروض</h4>
              <p className="text-sm text-gray-600">
                قارن العروض واختر الأفضل من حيث السعر والجودة
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-deep-teal mb-2">بدء العمل</h4>
              <p className="text-sm text-gray-600">
                اتفق مع المحترف المختار وابدأ العمل
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestSuccessPage; 
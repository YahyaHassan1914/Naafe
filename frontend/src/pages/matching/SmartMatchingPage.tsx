import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  User, 
  MessageSquare, 
  Phone,
  Calendar,
  Award,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import SmartMatchingEngine from '../../components/matching/SmartMatchingEngine';
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
  responseTime: number;
  skills: Array<{
    category: string;
    subcategory: string;
    verified: boolean;
    yearsOfExperience: number;
  }>;
  location: {
    governorate: string;
    city: string;
  };
  pricingRange: {
    min: number;
    max: number;
  };
  availability: {
    isAvailable: boolean;
    availableDays: string[];
    availableHours: {
      start: string;
      end: string;
    };
  };
  verificationLevel: 'basic' | 'skill' | 'approved';
  lastActive: Date;
  completionRate: number;
  averageResponseTime: number;
}

interface ServiceRequest {
  _id: string;
  category: string;
  subcategory: string;
  urgency: 'asap' | 'this-week' | 'flexible';
  location: {
    governorate: string;
    city: string;
  };
  description: string;
  budget?: {
    min: number;
    max: number;
  };
  createdAt: Date;
  expiresAt: Date;
}

interface MatchingResult {
  provider: Provider;
  score: number;
  matchReasons: string[];
  distanceScore: number;
  skillsScore: number;
  ratingScore: number;
  availabilityScore: number;
  responseTimeScore: number;
  verificationScore: number;
  completionRateScore: number;
}

const SmartMatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get request from location state or fetch from API
  useEffect(() => {
    if (location.state?.request) {
      setRequest(location.state.request);
    } else if (location.state?.requestId) {
      // Fetch request by ID
      fetchRequest(location.state.requestId);
    } else {
      // Redirect to create request if no request provided
      navigate('/enhanced-request');
    }
  }, [location.state, navigate]);

  const fetchRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/requests/${requestId}`);
      if (response.ok) {
        const requestData = await response.json();
        setRequest(requestData);
      } else {
        showToast('خطأ في تحميل الطلب', 'error');
        navigate('/enhanced-request');
      }
    } catch (error) {
      showToast('خطأ في تحميل الطلب', 'error');
      navigate('/enhanced-request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultsReady = (results: MatchingResult[]) => {
    setMatchingResults(results);
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleContactProvider = async (provider: Provider) => {
    try {
      // Navigate to chat or create conversation
      navigate(`/chat/${provider._id}`, {
        state: { 
          provider,
          request,
          initialMessage: `مرحباً، أنا مهتم بخدماتك لطلب: ${request?.description?.substring(0, 100)}...`
        }
      });
    } catch (error) {
      showToast('خطأ في الاتصال بالمحترف', 'error');
    }
  };

  const handleMakeOffer = async (provider: Provider) => {
    try {
      // Navigate to offer creation page
      navigate('/create-offer', {
        state: { 
          provider,
          request,
          prefillData: {
            providerId: provider._id,
            requestId: request?._id,
            estimatedPrice: request?.budget?.min || 0
          }
        }
      });
    } catch (error) {
      showToast('خطأ في إنشاء العرض', 'error');
    }
  };

  const handleViewProviderProfile = (provider: Provider) => {
    navigate(`/provider/${provider._id}`, {
      state: { provider, request }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ساعة`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} يوم`;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    if (score >= 0.4) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 0.8) return 'تطابق ممتاز';
    if (score >= 0.6) return 'تطابق جيد';
    if (score >= 0.4) return 'تطابق مقبول';
    return 'تطابق منخفض';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التوصيات...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">لم يتم العثور على الطلب</p>
          <Button onClick={() => navigate('/enhanced-request')}>
            إنشاء طلب جديد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-deep-teal">توصيات المحترفين</h1>
                <p className="text-sm text-gray-600">أفضل المحترفين لطلبك</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">
                {matchingResults.length} محترف
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-deep-teal mb-4">تفاصيل الطلب</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">الخدمة المطلوبة</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="category">{request.category}</Badge>
                    <Badge variant="outline">{request.subcategory}</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">الوصف</h3>
                  <p className="text-gray-600 text-sm">{request.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">الموقع</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{request.location.city}, {request.location.governorate}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">الأولوية</h3>
                  <Badge 
                    variant="primary" 
                    className={
                      request.urgency === 'asap' ? 'text-red-600 bg-red-50' :
                      request.urgency === 'this-week' ? 'text-orange-600 bg-orange-50' :
                      'text-green-600 bg-green-50'
                    }
                  >
                    {request.urgency === 'asap' ? 'عاجل' :
                     request.urgency === 'this-week' ? 'هذا الأسبوع' : 'مرن'}
                  </Badge>
                </div>

                {request.budget && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">الميزانية</h3>
                    <div className="text-green-600 font-semibold">
                      {formatPrice(request.budget.min)} - {formatPrice(request.budget.max)}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">تاريخ النشر</h3>
                  <div className="text-gray-600 text-sm">
                    {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button 
                  onClick={() => navigate('/enhanced-request', { state: { editRequest: request } })}
                  variant="outline"
                  className="w-full"
                >
                  تعديل الطلب
                </Button>
              </div>
            </div>
          </div>

          {/* Matching Results */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Smart Matching Engine */}
              <SmartMatchingEngine
                request={request}
                maxResults={10}
                onResultsReady={handleResultsReady}
              />

              {/* Results List */}
              {matchingResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-deep-teal">
                      أفضل المحترفين المطابقين
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>تم ترتيب النتائج حسب التطابق</span>
                    </div>
                  </div>

                  {matchingResults.map((result, index) => (
                    <div
                      key={result.provider._id}
                      className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
                        selectedProvider?._id === result.provider._id ? 'ring-2 ring-deep-teal' : ''
                      }`}
                      onClick={() => handleProviderSelect(result.provider)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Provider Avatar */}
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {result.provider.avatarUrl ? (
                            <img 
                              src={result.provider.avatarUrl} 
                              alt={`${result.provider.name.first} ${result.provider.name.last}`}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-gray-500" />
                          )}
                        </div>

                        {/* Provider Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-deep-teal text-lg">
                                {result.provider.name.first} {result.provider.name.last}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="font-medium">{result.provider.rating}</span>
                                  <span>({result.provider.reviewCount} تقييم)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{result.provider.location.city}, {result.provider.location.governorate}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatResponseTime(result.provider.averageResponseTime)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant="primary" 
                                className={`text-sm ${getMatchScoreColor(result.score)}`}
                              >
                                {getMatchScoreLabel(result.score)} ({Math.round(result.score * 100)}%)
                              </Badge>
                              <div className="flex items-center gap-1">
                                {result.provider.isVerified && (
                                  <Badge variant="success" className="text-xs">محقق</Badge>
                                )}
                                {result.provider.isTopRated && (
                                  <Badge variant="premium" className="text-xs">مميز</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Match Reasons */}
                          {result.matchReasons.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-600 mb-1">لماذا هذا المحترف مناسب:</div>
                              <div className="flex flex-wrap gap-1">
                                {result.matchReasons.map((reason, idx) => (
                                  <Badge key={idx} variant="info" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills */}
                          <div className="mb-3">
                            <div className="text-sm text-gray-600 mb-1">المهارات:</div>
                            <div className="flex flex-wrap gap-1">
                              {result.provider.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="category" className="text-xs">
                                  {skill.subcategory}
                                </Badge>
                              ))}
                              {result.provider.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{result.provider.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Stats & Pricing */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <div className="font-semibold text-deep-teal">
                                  {result.provider.completedJobs}
                                </div>
                                <div className="text-gray-600">مهمة مكتملة</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-deep-teal">
                                  {result.provider.completionRate}%
                                </div>
                                <div className="text-gray-600">معدل الإنجاز</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-green-600">
                                  {formatPrice(result.provider.pricingRange.min)} - {formatPrice(result.provider.pricingRange.max)}
                                </div>
                                <div className="text-gray-600">نطاق السعر</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                        <Button
                          onClick={() => handleViewProviderProfile(result.provider)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <User className="w-4 h-4 mr-2" />
                          عرض الملف الشخصي
                        </Button>
                        <Button
                          onClick={() => handleContactProvider(result.provider)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          إرسال رسالة
                        </Button>
                        <Button
                          onClick={() => handleMakeOffer(result.provider)}
                          size="sm"
                          className="flex-1"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          تقديم عرض
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {matchingResults.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد توصيات</h3>
                  <p className="text-gray-600 mb-4">
                    لم نتمكن من العثور على محترفين مطابقين لطلبك حالياً
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => navigate('/enhanced-request')}>
                      تعديل الطلب
                    </Button>
                    <Button onClick={() => navigate('/providers')}>
                      تصفح جميع المحترفين
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatchingPage; 
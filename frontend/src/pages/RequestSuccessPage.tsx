import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Clock, Eye, ArrowRight, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import BaseCard from '../components/ui/BaseCard';
import PageLayout from '../components/layout/PageLayout';

interface RequestSuccessState {
  requestId: string;
  category: string;
  subcategory: string;
}

const RequestSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [requestData] = useState<RequestSuccessState | null>(location.state as RequestSuccessState);
  const [stats, setStats] = useState({
    views: 0,
    responses: 0,
    estimatedTime: '2-4 ساعات'
  });

  useEffect(() => {
    if (!requestData) {
      navigate('/request-service');
      return;
    }

    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        views: prev.views + Math.floor(Math.random() * 3),
        responses: prev.responses + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [requestData, navigate]);

  if (!requestData) return null;

  return (
    <PageLayout>
      <div className="min-h-screen bg-warm-cream py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <BaseCard className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
                         <h1 className="text-3xl font-bold text-deep-teal mb-2">
               تم نشر طلبك! 🎉
             </h1>
             <p className="text-gray-600 text-lg mb-4">
               طلبك دلوقتي متاح للمحترفين في {requestData.category}
             </p>
            <div className="bg-deep-teal/10 rounded-lg p-4 mb-6">
              <p className="text-deep-teal font-semibold">
                رقم الطلب: #{requestData.requestId.slice(-8)}
              </p>
            </div>
          </BaseCard>

          {/* Real-time Stats */}
          <BaseCard className="mb-8">
            <h2 className="text-xl font-bold text-deep-teal mb-4 text-center">
              إحصائيات الطلب
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-deep-teal">{stats.views}</p>
                <p className="text-gray-600">مشاهدات</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-deep-teal">{stats.responses}</p>
                <p className="text-gray-600">ردود</p>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-deep-teal">{stats.estimatedTime}</p>
                <p className="text-gray-600">وقت الرد المتوقع</p>
              </div>
            </div>
          </BaseCard>

          {/* Next Steps */}
          <BaseCard className="mb-8">
            <h2 className="text-xl font-bold text-deep-teal mb-4 text-center">
              الخطوات التالية
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                                     <h3 className="font-semibold text-deep-teal">انتظار ردود المحترفين</h3>
                   <p className="text-gray-600">هيبدأ المحترفين يرسلوا عروضهم خلال الساعات الجاية</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                                     <h3 className="font-semibold text-deep-teal">مقارنة العروض</h3>
                   <p className="text-gray-600">هتقدر تقارن الأسعار والتقييمات</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                                     <h3 className="font-semibold text-deep-teal">اختيار المحترف المناسب</h3>
                   <p className="text-gray-600">اختار المحترف الأفضل حسب السعر والتقييمات</p>
                </div>
              </div>
            </div>
          </BaseCard>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                       <Button
                variant="primary"
                leftIcon={<Eye className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate(`/requests/${requestData.requestId}`)}
              >
                عرض طلبي
              </Button>
                                       <Button
                variant="outline"
                leftIcon={<Users className="w-4 h-4" />}
                onClick={() => navigate('/search?intent=need-service')}
              >
                استكشف المحترفين
              </Button>
                                       <Button
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
                onClick={() => navigate('/')}
              >
                العودة للرئيسية
              </Button>
          </div>

          {/* Notification Setup */}
          <BaseCard className="mt-8 bg-yellow-50 border-yellow-200">
            <div className="text-center">
                             <p className="text-yellow-800 font-medium mb-2">
                 🔔 تفعيل الإشعارات
               </p>
               <p className="text-yellow-700 text-sm">
                 فعّل الإشعارات عشان يوصلك تنبيهات عند وصول ردود جديدة
               </p>
            </div>
          </BaseCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default RequestSuccessPage; 
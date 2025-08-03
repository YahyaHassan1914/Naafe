import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Users, 
  Star,
  ArrowRight,
  Plus,
  Eye,
  Calendar
} from 'lucide-react';
import Button from '../components/ui/Button';
import BaseCard from '../components/ui/BaseCard';
import PageLayout from '../components/layout/PageLayout';
import SmartCalendar from '../components/ui/SmartCalendar';

interface DashboardStats {
  totalEarnings: number;
  completedJobs: number;
  activeOffers: number;
  averageRating: number;
  responseRate: number;
}

interface RecentRequest {
  id: string;
  title: string;
  category: string;
  budget: { min: number; max: number };
  createdAt: string;
  views: number;
  responses: number;
}

const ProviderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    completedJobs: 0,
    activeOffers: 0,
    averageRating: user?.providerProfile?.rating || 0,
    responseRate: 0
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats from the new provider endpoint
      const statsRes = await fetch('/api/providers/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Fetch recent requests from the new provider endpoint
      const requestsRes = await fetch('/api/providers/recent-requests?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        if (requestsData.success) {
          setRecentRequests(requestsData.data.requests || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data if API calls fail
      setStats({
        totalEarnings: 0,
        completedJobs: 0,
        activeOffers: 0,
        averageRating: user?.providerProfile?.rating || 0,
        responseRate: 0
      });
      setRecentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApply = (requestId: string) => {
    navigate(`/requests/${requestId}/respond`);
  };

  const handleViewRequest = (requestId: string) => {
    navigate(`/requests/${requestId}`);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-warm-cream py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-warm-cream py-8">
        <div className="max-w-6xl mx-auto px-4">
                     {/* Header */}
           <div className="mb-8">
             <h1 className="text-3xl font-bold text-deep-teal mb-2">
               مرحباً، {user?.name?.first || 'المحترف'}! 👋
             </h1>
             <p className="text-gray-600">
               شوف الطلبات الجديدة واعرف إحصائياتك
             </p>
           </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BaseCard className="text-center">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-deep-teal">{stats.totalEarnings.toLocaleString()}</p>
                             <p className="text-gray-600">إجمالي الأرباح</p>
            </BaseCard>
            
            <BaseCard className="text-center">
              <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-deep-teal">{stats.completedJobs}</p>
                             <p className="text-gray-600">الخدمات المنجزة</p>
            </BaseCard>
            
            <BaseCard className="text-center">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-deep-teal">{stats.activeOffers}</p>
                             <p className="text-gray-600">العروض المعلقة</p>
            </BaseCard>
            
            <BaseCard className="text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-deep-teal">{stats.averageRating.toFixed(1)}</p>
                             <p className="text-gray-600">التقييم</p>
            </BaseCard>
          </div>

          {/* Quick Actions */}
          <BaseCard className="mb-8">
                         <h2 className="text-xl font-bold text-deep-teal mb-4">أعمال سريعة</h2>
            <div className="flex flex-col md:flex-row gap-4">
                             <Button
                 variant="primary"
                 leftIcon={<Eye className="w-4 h-4" />}
                 onClick={() => navigate('/search?intent=want-work')}
                 className="min-w-fit"
               >
                شوف الطلبات الجديدة
              </Button>
              <Button
                variant="outline"
                leftIcon={<Clock className="w-4 h-4" />}
                onClick={() => navigate('/schedule')}
                className="min-w-fit"
              >
                مواعيدي
              </Button>
              <Button
                variant="outline"
                leftIcon={<Users className="w-4 h-4" />}
                onClick={() => navigate('/provider-profile')}
                className="min-w-fit"
              >
                إدارة الملف الشخصي
              </Button>
            </div>
          </BaseCard>

          {/* Recent Requests */}
          <BaseCard>
            <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-bold text-deep-teal">طلبات جديدة في مجالك</h2>
                             <Button
                 variant="outline"
                 rightIcon={<ArrowRight className="w-4 h-4" />}
                 onClick={() => navigate('/search?intent=want-work')}
               >
                عرض الكل
              </Button>
            </div>
            
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-deep-teal mb-1">{request.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{request.category}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>الميزانية: {request.budget.min.toLocaleString()} - {request.budget.max.toLocaleString()} جنيه</span>
                          <span>المشاهدات: {request.views}</span>
                          <span>الردود: {request.responses}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3 h-3" />}
                          onClick={() => handleViewRequest(request.id)}
                        >
                          عرض
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Plus className="w-3 h-3" />}
                          onClick={() => handleQuickApply(request.id)}
                        >
                          تقدم
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                 <p>مفيش طلبات جديدة في مجالك دلوقتي</p>
                                 <Button
                   variant="outline"
                   onClick={() => navigate('/search?intent=want-work')}
                   className="mt-4"
                 >
                  شوف كل الطلبات
                </Button>
              </div>
            )}
          </BaseCard>

          {/* My Schedule */}
          <BaseCard>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-deep-teal">جدولي</h2>
              <Button
                variant="outline"
                leftIcon={<Calendar className="w-4 h-4" />}
                onClick={() => navigate('/schedule')}
              >
                إدارة الجدول
              </Button>
            </div>
            <SmartCalendar
              mode="provider"
              className="mb-4"
            />
          </BaseCard>

          {/* Performance Tips */}
          <BaseCard className="mt-8 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-deep-teal mb-3">نصائح مهمة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-deep-teal">رد سريع</p>
                  <p className="text-gray-600">الرد السريع يزيد فرصك في العمل</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-deep-teal">تقييمات عالية</p>
                  <p className="text-gray-600">التقييمات العالية تجلب لك عمل أكتر</p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProviderDashboardPage; 
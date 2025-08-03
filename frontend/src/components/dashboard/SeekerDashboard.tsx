import React from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../ui/Button';

const SeekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { useMyServiceRequests, useUnreadNotificationCount } = useApi();

  const myRequestsQuery = useMyServiceRequests({ limit: 5 });
  const unreadCountQuery = useUnreadNotificationCount();

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50',
      negotiating: 'text-yellow-600 bg-yellow-50',
      in_progress: 'text-green-600 bg-green-50',
      completed: 'text-gray-600 bg-gray-50',
      cancelled: 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getStatusName = (status: string) => {
    const names = {
      open: 'مفتوح',
      negotiating: 'قيد التفاوض',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };
    return names[status as keyof typeof names] || status;
  };

  const getUrgencyName = (urgency: string) => {
    const names = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل'
    };
    return names[urgency as keyof typeof names] || urgency;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    };
    return colors[urgency as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Layout>
      <div className="py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            مرحباً، {user?.firstName}!
          </h1>
          <p className="text-text-secondary">
            استكشف الخدمات المتاحة أو تابع طلباتك الحالية
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-text-primary">
                  {myRequestsQuery.data?.data?.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">الطلبات النشطة</p>
                <p className="text-2xl font-bold text-text-primary">
                  {myRequestsQuery.data?.data?.data?.filter(r => ['open', 'negotiating', 'in_progress'].includes(r.status)).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">الخدمات المكتملة</p>
                <p className="text-2xl font-bold text-text-primary">
                  {myRequestsQuery.data?.data?.data?.filter(r => r.status === 'completed').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">الإشعارات الجديدة</p>
                <p className="text-2xl font-bold text-text-primary">
                  {unreadCountQuery.data?.data || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔔</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/request-service">
              <Button variant="primary" size="lg" className="w-full">
                <span className="mr-2">➕</span>
                طلب خدمة جديدة
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">🔍</span>
                البحث عن مزودين
              </Button>
            </Link>
            <Link to="/my-requests">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">📋</span>
                عرض جميع طلباتي
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">
                طلباتي الأخيرة
              </h2>
              <Link
                to="/my-requests"
                className="text-sm text-deep-teal hover:text-teal-700 transition-colors"
              >
                عرض الكل
              </Link>
            </div>
          </div>

          <div className="p-6">
            {myRequestsQuery.isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" text="جاري تحميل الطلبات..." />
              </div>
            ) : myRequestsQuery.error ? (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-4">
                  حدث خطأ في تحميل الطلبات
                </p>
                <Button
                  variant="outline"
                  onClick={() => myRequestsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : myRequestsQuery.data?.data?.data?.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  لا توجد طلبات بعد
                </h3>
                <p className="text-text-secondary mb-4">
                  ابدأ بإنشاء طلب خدمة جديدة للحصول على المساعدة
                </p>
                <Link to="/request-service">
                  <Button variant="primary">
                    طلب خدمة جديدة
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequestsQuery.data?.data?.data?.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="font-medium text-text-primary">
                            {request.category?.name} - {request.subcategory}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusName(request.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                            {getUrgencyName(request.urgency)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                          {request.description}
                        </p>
                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-text-secondary">
                          <span>📍 {request.location?.governorate}, {request.location?.city}</span>
                          <span>📅 {new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                          {request.expiresAt && (
                            <span className={`${new Date(request.expiresAt) < new Date() ? 'text-red-600' : ''}`}>
                              ⏰ ينتهي في {new Date(request.expiresAt).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/requests/${request._id}`}
                        className="text-deep-teal hover:text-teal-700 transition-colors"
                      >
                        عرض التفاصيل →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SeekerDashboard; 
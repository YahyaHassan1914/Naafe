import React from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../ui/Button';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { useAdminDashboard, useUnreadNotificationCount } = useApi();

  const dashboardQuery = useAdminDashboard();
  const unreadCountQuery = useUnreadNotificationCount();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
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
            نظرة عامة على منصة نافع وإدارتها
          </p>
        </div>

        {/* Platform Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatNumber(dashboardQuery.data?.data?.overview?.totalUsers || 0)}
                </p>
                {dashboardQuery.data?.data?.overview && (
                  <p className={`text-xs ${getChangeColor(getPercentageChange(
                    dashboardQuery.data.data.overview.newUsersToday || 0,
                    dashboardQuery.data.data.overview.newUsersYesterday || 0
                  ))}`}>
                    {getChangeIcon(getPercentageChange(
                      dashboardQuery.data.data.overview.newUsersToday || 0,
                      dashboardQuery.data.data.overview.newUsersYesterday || 0
                    ))} {dashboardQuery.data.data.overview.newUsersToday || 0} اليوم
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">طلبات الخدمة</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatNumber(dashboardQuery.data?.data?.overview?.totalServiceRequests || 0)}
                </p>
                {dashboardQuery.data?.data?.overview && (
                  <p className={`text-xs ${getChangeColor(getPercentageChange(
                    dashboardQuery.data.data.overview.newRequestsToday || 0,
                    dashboardQuery.data.data.overview.newRequestsYesterday || 0
                  ))}`}>
                    {getChangeIcon(getPercentageChange(
                      dashboardQuery.data.data.overview.newRequestsToday || 0,
                      dashboardQuery.data.data.overview.newRequestsYesterday || 0
                    ))} {dashboardQuery.data.data.overview.newRequestsToday || 0} اليوم
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(dashboardQuery.data?.data?.overview?.totalRevenue || 0)}
                </p>
                {dashboardQuery.data?.data?.overview && (
                  <p className={`text-xs ${getChangeColor(getPercentageChange(
                    dashboardQuery.data.data.overview.revenueToday || 0,
                    dashboardQuery.data.data.overview.revenueYesterday || 0
                  ))}`}>
                    {getChangeIcon(getPercentageChange(
                      dashboardQuery.data.data.overview.revenueToday || 0,
                      dashboardQuery.data.data.overview.revenueYesterday || 0
                    ))} {formatCurrency(dashboardQuery.data.data.overview.revenueToday || 0)} اليوم
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">المزودين المحققين</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatNumber(dashboardQuery.data?.data?.overview?.verifiedProviders || 0)}
                </p>
                <p className="text-xs text-text-secondary">
                  من أصل {formatNumber(dashboardQuery.data?.data?.overview?.totalProviders || 0)} مزود
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/users">
              <Button variant="primary" size="lg" className="w-full">
                <span className="mr-2">👥</span>
                إدارة المستخدمين
              </Button>
            </Link>
            <Link to="/admin/verifications">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">✅</span>
                طلبات التحقق
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">📊</span>
                التقارير
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">⚙️</span>
                إعدادات النظام
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Activity and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  النشاط الأخير
                </h2>
                <Link
                  to="/admin/activity"
                  className="text-sm text-deep-teal hover:text-teal-700 transition-colors"
                >
                  عرض الكل
                </Link>
              </div>
            </div>

            <div className="p-6">
              {dashboardQuery.isLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="جاري تحميل النشاط..." />
                </div>
              ) : dashboardQuery.error ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">
                    حدث خطأ في تحميل النشاط
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => dashboardQuery.refetch()}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : dashboardQuery.data?.data?.recentActivity?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    لا يوجد نشاط حديث
                  </h3>
                  <p className="text-text-secondary">
                    ستظهر الأنشطة هنا عند حدوثها
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardQuery.data?.data?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-deep-teal text-white rounded-full flex items-center justify-center text-sm">
                        {activity.type === 'user_registered' && '👤'}
                        {activity.type === 'service_request_created' && '📋'}
                        {activity.type === 'offer_submitted' && '💼'}
                        {activity.type === 'payment_completed' && '💰'}
                        {activity.type === 'verification_approved' && '✅'}
                        {activity.type === 'verification_rejected' && '❌'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">
                          {activity.description}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {new Date(activity.timestamp).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-text-primary">
                إحصائيات النظام
              </h2>
            </div>

            <div className="p-6">
              {dashboardQuery.isLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="جاري تحميل الإحصائيات..." />
                </div>
              ) : dashboardQuery.error ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">
                    حدث خطأ في تحميل الإحصائيات
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => dashboardQuery.refetch()}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-3">المستخدمين</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(dashboardQuery.data?.data?.stats?.users?.seekers || 0)}
                        </p>
                        <p className="text-sm text-text-secondary">مستفيدين</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {formatNumber(dashboardQuery.data?.data?.stats?.users?.providers || 0)}
                        </p>
                        <p className="text-sm text-text-secondary">مزودين</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-3">الخدمات</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatNumber(dashboardQuery.data?.data?.stats?.services?.totalRequests || 0)}
                        </p>
                        <p className="text-sm text-text-secondary">إجمالي الطلبات</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {formatNumber(dashboardQuery.data?.data?.stats?.services?.completedRequests || 0)}
                        </p>
                        <p className="text-sm text-text-secondary">مكتملة</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-3">المالية</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dashboardQuery.data?.data?.stats?.financial?.totalRevenue || 0)}
                        </p>
                        <p className="text-sm text-text-secondary">إجمالي الإيرادات</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(dashboardQuery.data?.data?.stats?.financial?.platformFees || 0)}
                        </p>
                        <p className="text-sm text-text-secondary">رسوم المنصة</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard; 
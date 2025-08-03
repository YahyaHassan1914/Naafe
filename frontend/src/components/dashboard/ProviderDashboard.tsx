import React from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../ui/Button';

const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { useOffers, useMyTransactions, useUnreadNotificationCount } = useApi();

  const myOffersQuery = useOffers({ limit: 5 });
  const transactionsQuery = useMyTransactions({ limit: 5 });
  const unreadCountQuery = useUnreadNotificationCount();

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      negotiating: 'text-blue-600 bg-blue-50',
      accepted: 'text-green-600 bg-green-50',
      rejected: 'text-red-600 bg-red-50',
      expired: 'text-gray-600 bg-gray-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getStatusName = (status: string) => {
    const names = {
      pending: 'في الانتظار',
      negotiating: 'قيد التفاوض',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      expired: 'منتهي الصلاحية'
    };
    return names[status as keyof typeof names] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      agreed: 'text-blue-600 bg-blue-50',
      completed: 'text-green-600 bg-green-50',
      disputed: 'text-red-600 bg-red-50',
      refunded: 'text-gray-600 bg-gray-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getPaymentStatusName = (status: string) => {
    const names = {
      pending: 'في الانتظار',
      agreed: 'متفق عليه',
      completed: 'مكتمل',
      disputed: 'متنازع عليه',
      refunded: 'مسترد'
    };
    return names[status as keyof typeof names] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const calculateTotalEarnings = () => {
    if (!transactionsQuery.data?.data?.data) return 0;
    return transactionsQuery.data.data.data
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.providerAmount || 0), 0);
  };

  const calculatePendingEarnings = () => {
    if (!transactionsQuery.data?.data?.data) return 0;
    return transactionsQuery.data.data.data
      .filter(t => ['pending', 'agreed'].includes(t.status))
      .reduce((sum, t) => sum + (t.providerAmount || 0), 0);
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
            تابع عروضك وأرباحك وإدارة خدماتك
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">إجمالي العروض</p>
                <p className="text-2xl font-bold text-text-primary">
                  {myOffersQuery.data?.data?.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">العروض المقبولة</p>
                <p className="text-2xl font-bold text-text-primary">
                  {myOffersQuery.data?.data?.data?.filter(o => o.status === 'accepted').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(calculateTotalEarnings())}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/search">
              <Button variant="primary" size="lg" className="w-full">
                <span className="mr-2">🔍</span>
                البحث عن طلبات
              </Button>
            </Link>
            <Link to="/my-offers">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">💼</span>
                عرض عروضي
              </Button>
            </Link>
            <Link to="/earnings">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">💰</span>
                أرباحي
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="outline" size="lg" className="w-full">
                <span className="mr-2">📅</span>
                جدولي
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Offers and Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Offers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  عروضي الأخيرة
                </h2>
                <Link
                  to="/my-offers"
                  className="text-sm text-deep-teal hover:text-teal-700 transition-colors"
                >
                  عرض الكل
                </Link>
              </div>
            </div>

            <div className="p-6">
              {myOffersQuery.isLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="جاري تحميل العروض..." />
                </div>
              ) : myOffersQuery.error ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">
                    حدث خطأ في تحميل العروض
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => myOffersQuery.refetch()}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : myOffersQuery.data?.data?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    لا توجد عروض بعد
                  </h3>
                  <p className="text-text-secondary mb-4">
                    ابدأ بالبحث عن طلبات الخدمة لتقديم عروضك
                  </p>
                  <Link to="/search">
                    <Button variant="primary">
                      البحث عن طلبات
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOffersQuery.data?.data?.data?.map((offer) => (
                    <div
                      key={offer._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <h3 className="font-medium text-text-primary">
                              {offer.requestId?.category?.name} - {offer.requestId?.subcategory}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                              {getStatusName(offer.status)}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            السعر: {formatCurrency(offer.price)}
                          </p>
                          <div className="flex items-center space-x-4 space-x-reverse text-xs text-text-secondary">
                            <span>📍 {offer.requestId?.location?.governorate}, {offer.requestId?.location?.city}</span>
                            <span>📅 {new Date(offer.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                        <Link
                          to={`/offers/${offer._id}`}
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

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  معاملاتي الأخيرة
                </h2>
                <Link
                  to="/earnings"
                  className="text-sm text-deep-teal hover:text-teal-700 transition-colors"
                >
                  عرض الكل
                </Link>
              </div>
            </div>

            <div className="p-6">
              {transactionsQuery.isLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="جاري تحميل المعاملات..." />
                </div>
              ) : transactionsQuery.error ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">
                    حدث خطأ في تحميل المعاملات
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => transactionsQuery.refetch()}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : transactionsQuery.data?.data?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    لا توجد معاملات بعد
                  </h3>
                  <p className="text-text-secondary mb-4">
                    ستظهر معاملاتك هنا عند قبول عروضك
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactionsQuery.data?.data?.data?.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <h3 className="font-medium text-text-primary">
                              {transaction.requestId?.category?.name} - {transaction.requestId?.subcategory}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(transaction.status)}`}>
                              {getPaymentStatusName(transaction.status)}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            المبلغ: {formatCurrency(transaction.providerAmount || 0)}
                          </p>
                          <div className="flex items-center space-x-4 space-x-reverse text-xs text-text-secondary">
                            <span>📅 {new Date(transaction.createdAt).toLocaleDateString('ar-EG')}</span>
                            <span>💳 {transaction.paymentMethod}</span>
                          </div>
                        </div>
                        <Link
                          to={`/payments/${transaction._id}`}
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
      </div>
    </Layout>
  );
};

export default ProviderDashboard; 
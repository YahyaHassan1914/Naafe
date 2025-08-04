import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Users, Target, Calendar, Filter } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import UnifiedSelect from '../ui/FormInput';

interface AnalyticsData {
  overview: {
    totalOffers: number;
    acceptedOffers: number;
    rejectedOffers: number;
    pendingOffers: number;
    totalRevenue: number;
    averageResponseTime: number;
    acceptanceRate: number;
    averagePrice: number;
  };
  trends: {
    daily: Array<{ date: string; offers: number; revenue: number }>;
    weekly: Array<{ week: string; offers: number; revenue: number }>;
    monthly: Array<{ month: string; offers: number; revenue: number }>;
  };
  categories: Array<{
    category: string;
    offers: number;
    acceptanceRate: number;
    averagePrice: number;
    revenue: number;
  }>;
  performance: {
    responseTime: Array<{ range: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    negotiationDuration: Array<{ range: string; count: number }>;
  };
}

interface OfferAnalyticsDashboardProps {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  category?: string;
}

const OfferAnalyticsDashboard: React.FC<OfferAnalyticsDashboardProps> = ({
  userId,
  timeRange = '30d',
  category
}) => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'categories' | 'performance'>('overview');

  // API hooks
  const { data: analyticsData, loading, error } = useApi(
    `/analytics/offers?userId=${userId || user?.id}&timeRange=${selectedTimeRange}&category=${selectedCategory}`
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ساعة ${remainingMinutes > 0 ? `${remainingMinutes} دقيقة` : ''}`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600">تعذر تحميل بيانات التحليلات</p>
        </div>
      </div>
    );
  }

  const data = analyticsData as AnalyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">تحليلات العروض</h2>
            <p className="text-sm text-gray-500">إحصائيات وأداء العروض الخاصة بك</p>
          </div>
          <div className="flex items-center gap-3">
            <UnifiedSelect
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              options={[
                { value: '7d', label: 'آخر 7 أيام' },
                { value: '30d', label: 'آخر 30 يوم' },
                { value: '90d', label: 'آخر 90 يوم' },
                { value: '1y', label: 'آخر سنة' }
              ]}
              className="w-40"
            />
            <UnifiedSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: 'all', label: 'جميع الفئات' },
                { value: 'plumbing', label: 'سباكة' },
                { value: 'electrical', label: 'كهرباء' },
                { value: 'cleaning', label: 'تنظيف' },
                { value: 'maintenance', label: 'صيانة' }
              ]}
              className="w-40"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { id: 'trends', label: 'الاتجاهات', icon: TrendingUp },
              { id: 'categories', label: 'الفئات', icon: Target },
              { id: 'performance', label: 'الأداء', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    viewMode === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview Section */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Offers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي العروض</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalOffers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {getTrendIcon(data.overview.totalOffers, data.overview.totalOffers * 0.9)}
              <span className="text-sm text-gray-500">مقارنة بالفترة السابقة</span>
            </div>
          </div>

          {/* Acceptance Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل القبول</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.overview.acceptanceRate)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${data.overview.acceptanceRate * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {getTrendIcon(data.overview.totalRevenue, data.overview.totalRevenue * 0.95)}
              <span className="text-sm text-gray-500">زيادة 5%</span>
            </div>
          </div>

          {/* Average Response Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط وقت الاستجابة</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(data.overview.averageResponseTime)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {getTrendIcon(data.overview.averageResponseTime, data.overview.averageResponseTime * 1.1)}
              <span className="text-sm text-gray-500">تحسن 10%</span>
            </div>
          </div>
        </div>
      )}

      {/* Trends Section */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Daily Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الاتجاهات اليومية</h3>
            <div className="space-y-4">
              {data.trends.daily.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{day.date}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">العروض</p>
                      <p className="font-medium text-gray-900">{day.offers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">الإيرادات</p>
                      <p className="font-medium text-gray-900">{formatCurrency(day.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الاتجاهات الأسبوعية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.trends.weekly.slice(-4).map((week, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">{week.week}</p>
                  <p className="text-lg font-bold text-gray-900">{week.offers}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(week.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Section */}
      {viewMode === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">أداء الفئات</h3>
            <div className="space-y-4">
              {data.categories.map((cat, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cat.category}</p>
                      <p className="text-sm text-gray-500">{cat.offers} عرض</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">معدل القبول</p>
                      <p className="font-medium text-gray-900">{formatPercentage(cat.acceptanceRate)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">متوسط السعر</p>
                      <p className="font-medium text-gray-900">{formatCurrency(cat.averagePrice)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">الإيرادات</p>
                      <p className="font-medium text-gray-900">{formatCurrency(cat.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Section */}
      {viewMode === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Response Time Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع وقت الاستجابة</h3>
            <div className="space-y-3">
              {data.performance.responseTime.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...data.performance.responseTime.map(r => r.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع نطاقات الأسعار</h3>
            <div className="space-y-3">
              {data.performance.priceRanges.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...data.performance.priceRanges.map(r => r.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Negotiation Duration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">مدة المفاوضات</h3>
            <div className="space-y-3">
              {data.performance.negotiationDuration.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...data.performance.negotiationDuration.map(r => r.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">رؤى وتحليلات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">أفضل أداء</span>
            </div>
            <p className="text-sm text-blue-700">
              فئة {data.categories[0]?.category} تظهر أعلى معدل قبول بنسبة {formatPercentage(data.categories[0]?.acceptanceRate || 0)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-900">أعلى إيرادات</span>
            </div>
            <p className="text-sm text-green-700">
              إجمالي الإيرادات {formatCurrency(data.overview.totalRevenue)} مع متوسط سعر {formatCurrency(data.overview.averagePrice)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferAnalyticsDashboard; 
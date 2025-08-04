import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Target, Award, Download, Filter, Calendar } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import UnifiedSelect from '../../components/ui/FormInput';
import OfferAnalyticsDashboard from '../../components/analytics/OfferAnalyticsDashboard';
import OfferTracking from '../../components/analytics/OfferTracking';
import PerformanceMetrics from '../../components/analytics/PerformanceMetrics';

interface OfferAnalyticsPageProps {}

const OfferAnalyticsPage: React.FC<OfferAnalyticsPageProps> = () => {
  const { offerId } = useParams<{ offerId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking' | 'performance'>('dashboard');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [category, setCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // API hooks for summary data
  const { data: summaryData, loading: loadingSummary } = useApi(`/analytics/summary?userId=${user?.id}&timeRange=${timeRange}`);

  const handleExportData = () => {
    // Export analytics data to CSV/Excel
    const data = {
      timeRange,
      category,
      userId: user?.id,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer-analytics-${timeRange}-${category}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <div>
                <h1 className="text-lg font-medium text-gray-900">تحليلات العروض</h1>
                <p className="text-sm text-gray-500">إحصائيات وأداء العروض</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 ml-2" />
                فلاتر
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <UnifiedSelect
                label="الفترة الزمنية"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                options={[
                  { value: '7d', label: 'آخر 7 أيام' },
                  { value: '30d', label: 'آخر 30 يوم' },
                  { value: '90d', label: 'آخر 90 يوم' },
                  { value: '1y', label: 'آخر سنة' }
                ]}
                className="w-40"
              />
              <UnifiedSelect
                label="الفئة"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
        </div>
      )}

      {/* Summary Cards */}
      {!loadingSummary && summaryData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي العروض</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryData.totalOffers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">+12%</span>
                <span className="text-sm text-gray-500 mr-2">من الفترة السابقة</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">معدل القبول</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(summaryData.acceptanceRate)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">+5%</span>
                <span className="text-sm text-gray-500 mr-2">من الفترة السابقة</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryData.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">+18%</span>
                <span className="text-sm text-gray-500 mr-2">من الفترة السابقة</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">متوسط الاستجابة</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryData.averageResponseTime} دقيقة</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">-8%</span>
                <span className="text-sm text-gray-500 mr-2">من الفترة السابقة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
                { id: 'tracking', label: 'تتبع العروض', icon: Target },
                { id: 'performance', label: 'مقاييس الأداء', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
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

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <OfferAnalyticsDashboard
              userId={user?.id}
              timeRange={timeRange}
              category={category}
            />
          )}

          {activeTab === 'tracking' && offerId && (
            <OfferTracking
              offerId={offerId}
              showDetails={true}
            />
          )}

          {activeTab === 'tracking' && !offerId && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">تتبع العروض</h3>
                <p className="text-gray-600 mb-4">اختر عرضاً محدداً لتتبع أدائه</p>
                <Button onClick={() => navigate('/offers')}>
                  عرض جميع العروض
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <PerformanceMetrics
              userId={user?.id}
              timeRange={timeRange}
            />
          )}
        </div>

        {/* Insights Section */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">رؤى وتحليلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">أفضل أداء</span>
              </div>
              <p className="text-sm text-blue-700">
                فئة السباكة تظهر أعلى معدل قبول بنسبة 85% مع متوسط سعر 350 ريال
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">فرص التحسين</span>
              </div>
              <p className="text-sm text-green-700">
                تحسين وقت الاستجابة يمكن أن يزيد معدل القبول بنسبة 15%
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-900">الأنماط الموسمية</span>
              </div>
              <p className="text-sm text-yellow-700">
                الطلبات تزداد بنسبة 30% في نهاية الأسبوع
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">التوصيات</span>
              </div>
              <p className="text-sm text-purple-700">
                التركيز على فئة الكهرباء يمكن أن يزيد الإيرادات بنسبة 25%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferAnalyticsPage; 
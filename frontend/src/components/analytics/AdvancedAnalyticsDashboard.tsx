import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Star,
  Activity,
  Eye,
  Download,
  Filter,
  Calendar,
  Search,
  Settings,
  RefreshCw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Target,
  Award,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  ShoppingCart,
  FileText,
  MapPin,
  Smartphone,
  Monitor,
  Globe,
  Zap,
  Shield,
  Database,
  Server,
  Network,
  HardDrive,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface AnalyticsData {
  userBehavior: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    userRetention: number;
    averageSessionDuration: number;
    pageViews: number;
    bounceRate: number;
  };
  performance: {
    totalRequests: number;
    completedRequests: number;
    activeRequests: number;
    averageResponseTime: number;
    completionRate: number;
    satisfactionRate: number;
    disputeRate: number;
    platformUptime: number;
  };
  financial: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageTransactionValue: number;
    paymentSuccessRate: number;
    refundRate: number;
    platformFees: number;
    providerEarnings: number;
    growthRate: number;
  };
  trends: {
    dailyActiveUsers: { date: string; count: number }[];
    revenueTrend: { date: string; amount: number }[];
    requestTrend: { date: string; count: number }[];
    userGrowth: { date: string; count: number }[];
  };
  demographics: {
    ageGroups: { group: string; percentage: number }[];
    locations: { location: string; count: number }[];
    devices: { device: string; percentage: number }[];
    categories: { category: string; count: number }[];
  };
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'performance' | 'financial' | 'trends' | 'reports'>('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch analytics data
  const { data: analyticsDataResponse, isLoading } = useApi('/admin/analytics');

  useEffect(() => {
    if (analyticsDataResponse) {
      setAnalyticsData(analyticsDataResponse);
    }
  }, [analyticsDataResponse]);

  const handleExportReport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/export/${reportType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('تم تصدير التقرير بنجاح', 'success');
      }
    } catch (error) {
      showToast('خطأ في تصدير التقرير', 'error');
    }
  };

  const getTrendIcon = (value: number, previousValue: number) => {
    const change = value - previousValue;
    const percentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
    
    if (percentage > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (percentage < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (value: number, previousValue: number) => {
    const change = value - previousValue;
    const percentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
    
    if (percentage > 5) return 'text-green-600';
    if (percentage < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-deep-teal">لوحة التحليلات المتقدمة</h1>
            <p className="text-gray-600">تحليل شامل لأداء المنصة والاتجاهات</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isLiveMode ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">وضع مباشر</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium">وضع ثابت</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiveMode(!isLiveMode)}
                className="flex items-center gap-2"
              >
                {isLiveMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isLiveMode ? 'إيقاف' : 'مباشر'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">الفترة الزمنية:</span>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
              <option value="90d">آخر 90 يوم</option>
              <option value="1y">آخر سنة</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">المقياس:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">جميع المقاييس</option>
              <option value="users">المستخدمون</option>
              <option value="performance">الأداء</option>
              <option value="financial">المالية</option>
              <option value="trends">الاتجاهات</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-600">
              تحديث تلقائي
            </label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { id: 'users', label: 'تحليل المستخدمين', icon: Users },
              { id: 'performance', label: 'مقاييس الأداء', icon: Target },
              { id: 'financial', label: 'التقارير المالية', icon: DollarSign },
              { id: 'trends', label: 'تحليل الاتجاهات', icon: TrendingUp },
              { id: 'reports', label: 'التقارير المخصصة', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-deep-teal text-deep-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && analyticsData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">إجمالي المستخدمين</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatNumber(analyticsData.userBehavior.totalUsers)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.userBehavior.totalUsers, analyticsData.userBehavior.totalUsers * 0.95)}
                    <span className={`text-sm ${getTrendColor(analyticsData.userBehavior.totalUsers, analyticsData.userBehavior.totalUsers * 0.95)}`}>
                      +5.2%
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">الإيرادات الشهرية</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(analyticsData.financial.monthlyRevenue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.financial.monthlyRevenue, analyticsData.financial.monthlyRevenue * 0.92)}
                    <span className={`text-sm ${getTrendColor(analyticsData.financial.monthlyRevenue, analyticsData.financial.monthlyRevenue * 0.92)}`}>
                      +8.1%
                    </span>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">معدل الإنجاز</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatPercentage(analyticsData.performance.completionRate)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.performance.completionRate, analyticsData.performance.completionRate * 0.98)}
                    <span className={`text-sm ${getTrendColor(analyticsData.performance.completionRate, analyticsData.performance.completionRate * 0.98)}`}>
                      +2.3%
                    </span>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">معدل الرضا</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatPercentage(analyticsData.performance.satisfactionRate)}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(analyticsData.performance.satisfactionRate, analyticsData.performance.satisfactionRate * 0.99)}
                    <span className={`text-sm ${getTrendColor(analyticsData.performance.satisfactionRate, analyticsData.performance.satisfactionRate * 0.99)}`}>
                      +1.1%
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-deep-teal">نمو المستخدمين</h3>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="h-64 bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">رسم بياني لنمو المستخدمين</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-deep-teal">اتجاه الإيرادات</h3>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="h-64 bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">رسم بياني للإيرادات</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demographics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Age Distribution */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-deep-teal mb-4">توزيع الأعمار</h3>
                  <div className="space-y-3">
                    {analyticsData.demographics.ageGroups.map((group) => (
                      <div key={group.group} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{group.group}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-deep-teal h-2 rounded-full" 
                              style={{ width: `${group.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{group.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Usage */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-deep-teal mb-4">استخدام الأجهزة</h3>
                  <div className="space-y-3">
                    {analyticsData.demographics.devices.map((device) => (
                      <div key={device.device} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{device.device}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-deep-teal h-2 rounded-full" 
                              style={{ width: `${device.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{device.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-deep-teal mb-4">أفضل الفئات</h3>
                  <div className="space-y-3">
                    {analyticsData.demographics.categories.slice(0, 5).map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{category.category}</span>
                        <span className="text-sm font-medium">{formatNumber(category.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">تحليل المستخدمين</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>تحليل السلوك</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>التحليل الجغرافي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>تحليل الوقت</span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">مقاييس الأداء</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>أداء النظام</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span>أداء الخادم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>أداء قاعدة البيانات</span>
                </div>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">التقارير المالية</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>تحليل الإيرادات</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>تقارير المبيعات</span>
                </div>
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  <span>تحليل التكاليف</span>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">تحليل الاتجاهات</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4" />
                  <span>اتجاهات السوق</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>تحليل الموسمية</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>التنبؤات</span>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-deep-teal">التقارير المخصصة</h3>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  إعدادات التقارير
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'تقرير المستخدمين', icon: Users, type: 'users' },
                  { title: 'تقرير الأداء', icon: Target, type: 'performance' },
                  { title: 'التقرير المالي', icon: DollarSign, type: 'financial' },
                  { title: 'تقرير الاتجاهات', icon: TrendingUp, type: 'trends' },
                  { title: 'تقرير الجودة', icon: Award, type: 'quality' },
                  { title: 'تقرير الأمان', icon: Shield, type: 'security' }
                ].map((report) => (
                  <div key={report.type} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <report.icon className="w-6 h-6 text-deep-teal" />
                      <h4 className="font-semibold text-gray-900">{report.title}</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleExportReport(report.type)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تصدير PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleExportReport(`${report.type}-csv`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تصدير CSV
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard; 
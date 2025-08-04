import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Lightbulb, BarChart3, Clock, DollarSign, MessageSquare, Star, Users } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface PerformanceData {
  overall: {
    score: number;
    rank: number; // percentile
    totalOffers: number;
    successRate: number;
    averageResponseTime: number;
    averagePrice: number;
  };
  metrics: {
    responseTime: {
      score: number;
      rank: number;
      average: number;
      recommendation: string;
    };
    pricing: {
      score: number;
      rank: number;
      average: number;
      recommendation: string;
    };
    communication: {
      score: number;
      rank: number;
      messageCount: number;
      recommendation: string;
    };
    negotiation: {
      score: number;
      rank: number;
      successRate: number;
      recommendation: string;
    };
  };
  trends: {
    weekly: Array<{ week: string; score: number; offers: number }>;
    monthly: Array<{ month: string; score: number; offers: number }>;
  };
  recommendations: Array<{
    id: string;
    type: 'improvement' | 'maintenance' | 'opportunity';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    priority: number;
  }>;
  comparisons: {
    categoryAverage: number;
    topPerformers: number;
    marketAverage: number;
    yourRank: number;
  };
}

interface PerformanceMetricsProps {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  userId,
  timeRange = '30d'
}) => {
  const { user } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'responseTime' | 'pricing' | 'communication' | 'negotiation'>('overall');

  // API hooks
  const { data: performanceData, loading, error } = useApi(
    `/analytics/performance?userId=${userId || user?.id}&timeRange=${timeRange}`
  );

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ساعة ${remainingMinutes > 0 ? `${remainingMinutes} دقيقة` : ''}`;
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    return 'يحتاج تحسين';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <Target className="w-4 h-4" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
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

  if (error || !performanceData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600">تعذر تحميل بيانات الأداء</p>
        </div>
      </div>
    );
  }

  const data = performanceData as PerformanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">مقاييس الأداء</h2>
            <p className="text-sm text-gray-500">تحليل شامل لأداء العروض والتوصيات</p>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <span className="text-sm text-gray-500">المرتبة {data.overall.rank}%</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overall', label: 'الأداء العام', icon: BarChart3 },
              { id: 'responseTime', label: 'سرعة الاستجابة', icon: Clock },
              { id: 'pricing', label: 'التسعير', icon: DollarSign },
              { id: 'communication', label: 'التواصل', icon: MessageSquare },
              { id: 'negotiation', label: 'المفاوضة', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMetric(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    selectedMetric === tab.id
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

      {/* Overall Performance */}
      {selectedMetric === 'overall' && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                <span className={`text-2xl font-bold ${getScoreColor(data.overall.score)}`}>
                  {data.overall.score}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">الدرجة الإجمالية</h3>
              <p className={`text-sm font-medium ${getScoreColor(data.overall.score)}`}>
                {getScoreLabel(data.overall.score)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                أنت في أعلى {data.overall.rank}% من مقدمي الخدمة
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-500">متوسط الاستجابة</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(data.overall.averageResponseTime)}</p>
              <p className="text-sm text-gray-500">أسرع من {100 - data.metrics.responseTime.rank}%</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-500">متوسط السعر</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overall.averagePrice)}</p>
              <p className="text-sm text-gray-500">أفضل من {100 - data.metrics.pricing.rank}%</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-500">معدل النجاح</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.overall.successRate)}</p>
              <p className="text-sm text-gray-500">{data.overall.totalOffers} عرض</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-500">فعالية المفاوضة</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.metrics.negotiation.successRate)}</p>
              <p className="text-sm text-gray-500">أفضل من {100 - data.metrics.negotiation.rank}%</p>
            </div>
          </div>

          {/* Market Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">مقارنة السوق</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">متوسط الفئة</p>
                <p className="text-lg font-bold text-gray-900">{data.comparisons.categoryAverage}/100</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">أفضل الأداء</p>
                <p className="text-lg font-bold text-gray-900">{data.comparisons.topPerformers}/100</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">متوسط السوق</p>
                <p className="text-lg font-bold text-gray-900">{data.comparisons.marketAverage}/100</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-500">مرتبتك</p>
                <p className="text-lg font-bold text-blue-600">{data.comparisons.yourRank}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Metrics */}
      {selectedMetric !== 'overall' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedMetric === 'responseTime' ? 'سرعة الاستجابة' :
                 selectedMetric === 'pricing' ? 'التسعير' :
                 selectedMetric === 'communication' ? 'التواصل' :
                 'المفاوضة'}
              </h3>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getScoreColor(data.metrics[selectedMetric].score)}`}>
                  {data.metrics[selectedMetric].score}/100
                </p>
                <p className="text-sm text-gray-500">المرتبة {data.metrics[selectedMetric].rank}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">التوصية</h4>
                <p className="text-sm text-gray-600">{data.metrics[selectedMetric].recommendation}</p>
              </div>

              {selectedMetric === 'responseTime' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">متوسط الاستجابة</p>
                    <p className="text-lg font-bold text-blue-700">{formatDuration(data.metrics.responseTime.average)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">الهدف المطلوب</p>
                    <p className="text-lg font-bold text-green-700">أقل من 30 دقيقة</p>
                  </div>
                </div>
              )}

              {selectedMetric === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">متوسط السعر</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(data.metrics.pricing.average)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">نطاق السوق</p>
                    <p className="text-lg font-bold text-green-700">200-500 ريال</p>
                  </div>
                </div>
              )}

              {selectedMetric === 'communication' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">متوسط الرسائل</p>
                    <p className="text-lg font-bold text-blue-700">{data.metrics.communication.messageCount}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">الهدف المطلوب</p>
                    <p className="text-lg font-bold text-green-700">3-5 رسائل</p>
                  </div>
                </div>
              )}

              {selectedMetric === 'negotiation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">معدل النجاح</p>
                    <p className="text-lg font-bold text-blue-700">{formatPercentage(data.metrics.negotiation.successRate)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">الهدف المطلوب</p>
                    <p className="text-lg font-bold text-green-700">أعلى من 70%</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-medium text-gray-900">التوصيات والتحسينات</h3>
        </div>
        
        <div className="space-y-4">
          {data.recommendations
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 5)
            .map((recommendation) => (
              <div key={recommendation.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {getRecommendationIcon(recommendation.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(recommendation.impact)}`}>
                        تأثير {recommendation.impact === 'high' ? 'عالي' : recommendation.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(recommendation.effort)}`}>
                        جهد {recommendation.effort === 'high' ? 'عالي' : recommendation.effort === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{recommendation.description}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">اتجاهات الأداء</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الأسبوعية</h4>
            <div className="space-y-2">
              {data.trends.weekly.slice(-4).map((week, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{week.week}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{week.offers} عرض</span>
                    <span className={`text-sm font-bold ${getScoreColor(week.score)}`}>{week.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">الشهرية</h4>
            <div className="space-y-2">
              {data.trends.monthly.slice(-3).map((month, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{month.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{month.offers} عرض</span>
                    <span className={`text-sm font-bold ${getScoreColor(month.score)}`}>{month.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 
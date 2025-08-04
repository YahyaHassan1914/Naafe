import React from 'react';
import { Star, TrendingUp, TrendingDown, Users, Award, Clock } from 'lucide-react';

interface ReviewStatsProps {
  stats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    recentReviews: number;
    helpfulReviews: number;
    verifiedReviews: number;
    responseRate: number;
    averageResponseTime: number;
  };
  className?: string;
}

const ReviewStats: React.FC<ReviewStatsProps> = ({ stats, className = '' }) => {
  const getRatingPercentage = (rating: number) => {
    const total = Object.values(stats.ratingDistribution).reduce((sum, count) => sum + count, 0);
    return total > 0 ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / total) * 100 : 0;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} ساعة`;
    return `${Math.round(minutes / 1440)} يوم`;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Award className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">إحصائيات التقييمات</h2>
          <p className="text-sm text-gray-500">نظرة عامة على التقييمات والأداء</p>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Average Rating */}
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-600">متوسط التقييم</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Total Reviews */}
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.totalReviews.toLocaleString('ar-SA')}
            </span>
          </div>
          <p className="text-sm text-gray-600">إجمالي التقييمات</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-xs text-green-600">
              {stats.verifiedReviews} موثق
            </span>
          </div>
        </div>

        {/* Response Rate */}
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.responseRate}%
            </span>
          </div>
          <p className="text-sm text-gray-600">معدل الاستجابة</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-xs text-purple-600">
              {formatResponseTime(stats.averageResponseTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-8">
        <h3 className="font-medium text-gray-900 mb-4">توزيع التقييمات</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const percentage = getRatingPercentage(rating);
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="w-16 text-right">
                  <span className="text-sm text-gray-600">
                    {count.toLocaleString('ar-SA')}
                  </span>
                </div>
                
                <div className="w-12 text-right">
                  <span className="text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-900">النشاط الأخير</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">تقييمات هذا الشهر:</span>
              <span className="font-medium text-gray-900">{stats.recentReviews}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">تقييمات مفيدة:</span>
              <span className="font-medium text-gray-900">{stats.helpfulReviews}</span>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">مقاييس الجودة</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">التقييمات الموثقة:</span>
              <span className="font-medium text-gray-900">{stats.verifiedReviews}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">متوسط وقت الاستجابة:</span>
              <span className="font-medium text-gray-900">
                {formatResponseTime(stats.averageResponseTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-900">ملخص الأداء</h4>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          {stats.averageRating >= 4.5 && (
            <p>• أداء ممتاز! متوسط تقييم عالي جداً</p>
          )}
          {stats.averageRating >= 4.0 && stats.averageRating < 4.5 && (
            <p>• أداء جيد جداً مع تقييمات إيجابية</p>
          )}
          {stats.averageRating >= 3.5 && stats.averageRating < 4.0 && (
            <p>• أداء جيد مع مجال للتحسين</p>
          )}
          {stats.averageRating < 3.5 && (
            <p>• يحتاج إلى تحسين في جودة الخدمة</p>
          )}
          
          {stats.responseRate >= 90 && (
            <p>• معدل استجابة ممتاز للعملاء</p>
          )}
          {stats.responseRate >= 70 && stats.responseRate < 90 && (
            <p>• معدل استجابة جيد</p>
          )}
          {stats.responseRate < 70 && (
            <p>• يجب تحسين سرعة الاستجابة</p>
          )}
        </div>
      </div>

      {/* Rating Trends */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">اتجاهات التقييم</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {stats.ratingDistribution[5]}
            </div>
            <div className="text-xs text-green-700">5 نجوم</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {stats.ratingDistribution[4]}
            </div>
            <div className="text-xs text-blue-700">4 نجوم</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">
              {stats.ratingDistribution[3]}
            </div>
            <div className="text-xs text-yellow-700">3 نجوم</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">
              {stats.ratingDistribution[2] + stats.ratingDistribution[1]}
            </div>
            <div className="text-xs text-red-700">1-2 نجوم</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStats; 
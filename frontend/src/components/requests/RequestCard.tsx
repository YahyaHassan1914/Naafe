import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

interface RequestCardProps {
  request: any;
  showActions?: boolean;
  onEdit?: (request: any) => void;
  onCancel?: (request: any) => void;
  onDelete?: (request: any) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  showActions = true,
  onEdit,
  onCancel,
  onDelete,
  variant = 'default'
}) => {
  const getStatusName = (status: string) => {
    const statusNames = {
      open: 'مفتوح',
      negotiating: 'قيد التفاوض',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      expired: 'منتهي الصلاحية'
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50',
      negotiating: 'text-yellow-600 bg-yellow-50',
      in_progress: 'text-green-600 bg-green-50',
      completed: 'text-gray-600 bg-gray-50',
      cancelled: 'text-red-600 bg-red-50',
      expired: 'text-gray-600 bg-gray-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
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

  const formatBudget = (min: number, max: number, currency: string) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    };

    if (min === max) {
      return `${formatNumber(min)} ${currency}`;
    }
    return `${formatNumber(min)} - ${formatNumber(max)} ${currency}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const requestDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    if (diffInMinutes < 43200) return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
    return `منذ ${Math.floor(diffInMinutes / 43200)} شهر`;
  };

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const canEdit = request.status === 'open' && !isExpired(request.deadline);
  const canCancel = ['open', 'negotiating'].includes(request.status) && !isExpired(request.deadline);

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link
              to={`/requests/${request._id}`}
              className="block hover:text-deep-teal transition-colors"
            >
              <h3 className="font-medium text-text-primary truncate">
                {request.title}
              </h3>
            </Link>
            
            <div className="flex items-center space-x-4 space-x-reverse mt-2 text-sm text-text-secondary">
              <span>{formatBudget(request.budget.min, request.budget.max, request.budget.currency)}</span>
              <span>•</span>
              <span>{request.location.governorate}</span>
              <span>•</span>
              <span>{formatTimeAgo(request.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse mr-4">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {getStatusName(request.status)}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
              {getUrgencyName(request.urgency)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link
              to={`/requests/${request._id}`}
              className="block hover:text-deep-teal transition-colors"
            >
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {request.title}
              </h2>
            </Link>
            
            <p className="text-text-secondary line-clamp-3 mb-4">
              {request.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  الميزانية
                </label>
                <p className="text-text-primary font-medium">
                  {formatBudget(request.budget.min, request.budget.max, request.budget.currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  الموقع
                </label>
                <p className="text-text-primary">
                  {request.location.governorate}, {request.location.city}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  تاريخ الانتهاء
                </label>
                <p className="text-text-primary">
                  {formatDate(request.deadline)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  العروض
                </label>
                <p className="text-text-primary">
                  {request.offersCount || 0} عرض
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2 mr-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusName(request.status)}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
              {getUrgencyName(request.urgency)}
            </span>
          </div>
        </div>

        {/* Images Preview */}
        {request.images && request.images.length > 0 && (
          <div className="mb-4">
            <div className="flex space-x-2 space-x-reverse">
              {request.images.slice(0, 3).map((image: any, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`صورة ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              ))}
              {request.images.length > 3 && (
                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-text-secondary">
                  +{request.images.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 space-x-reverse text-sm text-text-secondary">
            <span>أنشئ {formatTimeAgo(request.createdAt)}</span>
            <span>•</span>
            <span>بواسطة {request.seeker?.firstName} {request.seeker?.lastName}</span>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Link to={`/requests/${request._id}`}>
                <Button variant="primary" size="sm">
                  عرض التفاصيل
                </Button>
              </Link>
              
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(request)}
                >
                  تعديل
                </Button>
              )}
              
              {canCancel && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onCancel(request)}
                >
                  إلغاء
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link
            to={`/requests/${request._id}`}
            className="block hover:text-deep-teal transition-colors"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
              {request.title}
            </h3>
          </Link>
          
          <p className="text-text-secondary line-clamp-2 mb-3">
            {request.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                الميزانية
              </label>
              <p className="text-sm text-text-primary font-medium">
                {formatBudget(request.budget.min, request.budget.max, request.budget.currency)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                الموقع
              </label>
              <p className="text-sm text-text-primary">
                {request.location.governorate}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                تاريخ الانتهاء
              </label>
              <p className="text-sm text-text-primary">
                {formatDate(request.deadline)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                العروض
              </label>
              <p className="text-sm text-text-primary">
                {request.offersCount || 0} عرض
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2 mr-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {getStatusName(request.status)}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
            {getUrgencyName(request.urgency)}
          </span>
        </div>
      </div>

      {/* Images Preview */}
      {request.images && request.images.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2 space-x-reverse">
            {request.images.slice(0, 4).map((image: any, index: number) => (
              <img
                key={index}
                src={image}
                alt={`صورة ${index + 1}`}
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
            ))}
            {request.images.length > 4 && (
              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-text-secondary">
                +{request.images.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 space-x-reverse text-sm text-text-secondary">
          <span>أنشئ {formatTimeAgo(request.createdAt)}</span>
          {request.seeker && (
            <>
              <span>•</span>
              <span>بواسطة {request.seeker.firstName} {request.seeker.lastName}</span>
            </>
          )}
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Link to={`/requests/${request._id}`}>
              <Button variant="primary" size="sm">
                عرض التفاصيل
              </Button>
            </Link>
            
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(request)}
              >
                تعديل
              </Button>
            )}
            
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onCancel(request)}
              >
                إلغاء
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard; 
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  Star,
  Eye,
  MessageSquare,
  Filter,
  Download,
  Search,
  CheckCircle
} from 'lucide-react';
import Button from '../../ui/Button';
import SearchBar from '../../search/SearchBar';

interface RequestHistoryItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: string;
  urgency: string;
  location: {
    governorate: string;
    city: string;
  };
  budget?: number;
  finalPrice?: number;
  providerName?: string;
  providerRating?: number;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  offersCount: number;
  viewsCount: number;
  images: string[];
}

interface RequestHistoryProps {
  requests: RequestHistoryItem[];
  onViewRequest: (requestId: string) => void;
  onContactProvider?: (requestId: string) => void;
  onExportHistory?: () => void;
  className?: string;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({
  requests,
  onViewRequest,
  onContactProvider,
  onExportHistory,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'open':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'open':
        return 'مفتوح';
      default:
        return 'غير محدد';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'عاجل';
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return 'غير محدد';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalSpent = () => {
    return requests
      .filter(request => request.status === 'completed' && request.finalPrice)
      .reduce((total, request) => total + (request.finalPrice || 0), 0);
  };

  const getAverageRating = () => {
    const ratedRequests = requests.filter(request => request.providerRating);
    if (ratedRequests.length === 0) return 0;
    
    const totalRating = ratedRequests.reduce((total, request) => total + (request.providerRating || 0), 0);
    return (totalRating / ratedRequests.length).toFixed(1);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              سجل الطلبات
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              عرض جميع طلبات الخدمة السابقة
            </p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              variant="outline"
              onClick={onExportHistory}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Download className="h-4 w-4" />
              <span>تصدير</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-xl font-semibold text-gray-900">
                  {requests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">مكتمل</p>
                <p className="text-xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي الإنفاق</p>
                <p className="text-xl font-semibold text-gray-900">
                  {getTotalSpent().toLocaleString()} ج.م
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm text-gray-600">متوسط التقييم</p>
                <p className="text-xl font-semibold text-gray-900">
                  {getAverageRating()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="البحث في سجل الطلبات..."
              defaultValue={searchTerm}
            />
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="open">مفتوح</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">جميع الفئات</option>
              <option value="plumbing">سباكة</option>
              <option value="electrical">كهرباء</option>
              <option value="cleaning">تنظيف</option>
              <option value="maintenance">صيانة</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">الأحدث أولاً</option>
              <option value="createdAt-asc">الأقدم أولاً</option>
              <option value="title-asc">العنوان أ-ي</option>
              <option value="title-desc">العنوان ي-أ</option>
              <option value="budget-asc">السعر من الأقل</option>
              <option value="budget-desc">السعر من الأعلى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="divide-y divide-gray-200">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد طلبات
            </h3>
            <p className="text-gray-600">
              لم يتم العثور على طلبات تطابق معايير البحث
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 space-x-reverse mb-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {request.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                      {getUrgencyText(request.urgency)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {request.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Calendar className="h-4 w-4" />
                      <span>تاريخ الإنشاء: {formatDate(request.createdAt)}</span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <MapPin className="h-4 w-4" />
                      <span>{request.location.governorate}, {request.location.city}</span>
                    </div>

                    {request.providerName && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <User className="h-4 w-4" />
                        <span>{request.providerName}</span>
                        {request.providerRating && (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{request.providerRating}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Eye className="h-4 w-4" />
                      <span>{request.viewsCount} مشاهدة • {request.offersCount} عرض</span>
                    </div>
                  </div>

                  {request.finalPrice && (
                    <div className="mt-3 flex items-center space-x-2 space-x-reverse text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        السعر النهائي: {request.finalPrice.toLocaleString()} ج.م
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 space-x-reverse mr-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewRequest(request._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.providerName && onContactProvider && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onContactProvider(request._id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              عرض {filteredRequests.length} من {requests.length} طلب
            </p>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm" disabled>
                السابق
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600">1</span>
              <Button variant="outline" size="sm" disabled>
                التالي
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestHistory;

import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  MapPin, 
  Clock,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import RequestCard from '../../components/requests/RequestCard';
import SearchBar from '../../components/search/SearchBar';
import FilterPanel from '../../components/search/FilterPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface Request {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  urgency: string;
  status: string;
  location: {
    governorate: string;
    city: string;
  };
  budget?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  offersCount: number;
  viewsCount: number;
  images: string[];
}

interface Filters {
  search: string;
  category: string;
  subcategory: string;
  status: string;
  urgency: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const MyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useMyRequests, deleteRequest } = useApi();

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    subcategory: '',
    status: '',
    urgency: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const requestsQuery = useMyRequests(filters);
  const requests = requestsQuery.data?.data || [];
  const isLoading = requestsQuery.isLoading;
  const error = requestsQuery.error;

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      subcategory: '',
      status: '',
      urgency: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      return;
    }

    setIsDeleting(requestId);
    try {
      await deleteRequest(requestId);
      showToast('تم حذف الطلب بنجاح', 'success');
      requestsQuery.refetch();
    } catch (error) {
      showToast('فشل في حذف الطلب', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'مفتوح';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              حدث خطأ في تحميل الطلبات
            </h3>
            <p className="text-gray-600 mb-4">
              يرجى المحاولة مرة أخرى
            </p>
            <Button onClick={() => requestsQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                طلباتي
              </h1>
              <p className="text-gray-600 mt-1">
                إدارة جميع طلبات الخدمة الخاصة بك
              </p>
            </div>
            <Link to="/requests/create">
              <Button className="flex items-center space-x-2 space-x-reverse">
                <Plus className="h-4 w-4" />
                <span>طلب جديد</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar
                    onSearch={handleSearch}
                    placeholder="البحث في طلباتي..."
                    defaultValue={filters.search}
                  />
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <Filter className="h-4 w-4" />
                    <span>فلاتر</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    مسح الكل
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-6 pt-6 border-t">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                    onApplyFilters={() => setShowFilters(false)}
                    variant="inline"
                  />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-gray-600">مفتوح</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {requests.filter(r => r.status === 'open').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Loader2 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-gray-600">قيد التنفيذ</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {requests.filter(r => r.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-gray-600">مكتمل</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {requests.filter(r => r.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-gray-600">إجمالي</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {requests.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requests List */}
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد طلبات
                </h3>
                <p className="text-gray-600 mb-6">
                  لم تقم بإنشاء أي طلبات بعد
                </p>
                <Link to="/requests/create">
                  <Button>
                    إنشاء أول طلب
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.title}
                          </h3>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {getStatusIcon(request.status)}
                            <span className="text-sm text-gray-600">
                              {getStatusText(request.status)}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {getUrgencyText(request.urgency)}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {request.description}
                        </p>

                        <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-500">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <MapPin className="h-4 w-4" />
                            <span>{request.location.governorate}, {request.location.city}</span>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Eye className="h-4 w-4" />
                            <span>{request.viewsCount} مشاهدة</span>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <span>•</span>
                            <span>{request.offersCount} عرض</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse mr-4">
                        <Link to={`/requests/${request._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/requests/${request._id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequest(request._id)}
                          disabled={isDeleting === request._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {isDeleting === request._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequestsPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, XCircle, Eye, AlertTriangle, MapPin, User } from 'lucide-react';
import SearchAndFilter from '../components/UI/SearchAndFilter';
import Pagination from '../components/UI/Pagination';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Breadcrumb from '../components/UI/Breadcrumb';
import SortableTable, { SortDirection } from '../components/UI/SortableTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

// Define types for API response
interface ServiceRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  urgency: string;
  status: string;
  budget?: number;
  duration?: number;
  location: {
    governorate: string;
    city: string;
  };
  images: string[];
  answers: string[];
  seekerId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  offerCount: number;
  viewCount: number;
  seeker: {
    _id: string;
    name: { first: string; last: string };
    email: string;
    phone: string;
    isVerified: boolean;
  };
}

interface ServiceRequestsApiResponse {
  requests: ServiceRequest[];
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const fetchServiceRequests = async ({ page, search, filter, category, urgency, token }: { 
  page: number; 
  search: string; 
  filter: string; 
  category: string;
  urgency: string;
  token: string | null; 
}): Promise<ServiceRequestsApiResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (search) params.append('search', search);
  if (filter && filter !== 'all') params.append('status', filter);
  if (category && category !== 'all') params.append('category', category);
  if (urgency && urgency !== 'all') params.append('urgency', urgency);
  
  const res = await fetch(`/api/admin/service-requests?${params.toString()}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('فشل تحميل طلبات الخدمات');
  const data = await res.json();
  return {
    requests: data.data.requests || [],
    totalPages: data.data.totalPages || 1,
    totalItems: data.data.total || 0,
    itemsPerPage: data.data.limit || 10,
  };
};

const REQUEST_STATUS_VARIANT_MAP: Record<string, 'status' | 'category' | 'premium' | 'top-rated' | 'urgency'> = {
  active: 'success',
  completed: 'status',
  cancelled: 'error',
  expired: 'secondary',
  pending: 'warning',
};

const URGENCY_VARIANT_MAP: Record<string, 'status' | 'category' | 'premium' | 'top-rated' | 'urgency'> = {
  asap: 'urgency',
  'this-week': 'warning',
  flexible: 'status',
};

const AdminServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showError } = useToast();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [sortField, setSortField] = useState<keyof ServiceRequest>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['admin-service-requests', page, searchTerm, filterStatus, filterCategory, filterUrgency, accessToken],
    queryFn: () => fetchServiceRequests({ 
      page, 
      search: searchTerm, 
      filter: filterStatus, 
      category: filterCategory,
      urgency: filterUrgency,
      token: accessToken 
    }),
    enabled: !!accessToken,
  });

  const getStatusBadge = (request: ServiceRequest) => {
    const variant = REQUEST_STATUS_VARIANT_MAP[request.status] || 'secondary';
    return <Badge variant={variant}>{request.status}</Badge>;
  };

  const getUrgencyBadge = (request: ServiceRequest) => {
    const variant = URGENCY_VARIANT_MAP[request.urgency] || 'secondary';
    const urgencyLabels = {
      asap: 'عاجل',
      'this-week': 'هذا الأسبوع',
      flexible: 'مرن'
    };
    return <Badge variant={variant}>{urgencyLabels[request.urgency as keyof typeof urgencyLabels] || request.urgency}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(budget);
  };

  const columns = [
    {
      key: 'title' as keyof ServiceRequest,
      label: 'عنوان الطلب',
      sortable: true,
      render: (request: ServiceRequest) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{request.title}</div>
          <div className="text-sm text-gray-500">{request.category} • {request.subcategory}</div>
        </div>
      ),
    },
    {
      key: 'status' as keyof ServiceRequest,
      label: 'الحالة',
      sortable: true,
      render: (request: ServiceRequest) => getStatusBadge(request),
    },
    {
      key: 'urgency' as keyof ServiceRequest,
      label: 'الأولوية',
      sortable: true,
      render: (request: ServiceRequest) => getUrgencyBadge(request),
    },
    {
      key: 'seeker' as keyof ServiceRequest,
      label: 'مقدم الطلب',
      sortable: false,
      render: (request: ServiceRequest) => (
        <div>
          <div className="font-medium">
            {`${request.seeker.name.first} ${request.seeker.name.last}`}
          </div>
          <div className="text-sm text-gray-500">{request.seeker.email}</div>
          {request.seeker.isVerified && (
            <Badge variant="success" className="text-xs mt-1">محقق</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'location' as keyof ServiceRequest,
      label: 'الموقع',
      sortable: false,
      render: (request: ServiceRequest) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {request.location.governorate} • {request.location.city}
          </span>
        </div>
      ),
    },
    {
      key: 'budget' as keyof ServiceRequest,
      label: 'الميزانية',
      sortable: true,
      render: (request: ServiceRequest) => (
        <span className="font-medium text-green-600">
          {formatBudget(request.budget)}
        </span>
      ),
    },
    {
      key: 'offerCount' as keyof ServiceRequest,
      label: 'العروض',
      sortable: true,
      render: (request: ServiceRequest) => (
        <div className="text-center">
          <div className="font-medium text-blue-600">{request.offerCount}</div>
          <div className="text-xs text-gray-500">عرض</div>
        </div>
      ),
    },
    {
      key: 'viewCount' as keyof ServiceRequest,
      label: 'المشاهدات',
      sortable: true,
      render: (request: ServiceRequest) => (
        <div className="text-center">
          <div className="font-medium text-purple-600">{request.viewCount}</div>
          <div className="text-xs text-gray-500">مشاهدة</div>
        </div>
      ),
    },
    {
      key: 'createdAt' as keyof ServiceRequest,
      label: 'تاريخ النشر',
      sortable: true,
      render: (request: ServiceRequest) => (
        <div>
          <div className="text-sm">{formatDate(request.createdAt)}</div>
          <div className="text-xs text-gray-500">
            ينتهي: {formatDate(request.expiresAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'actions' as keyof ServiceRequest,
      label: 'الإجراءات',
      sortable: false,
      render: (request: ServiceRequest) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/service-requests/${request._id}`)}
            className="p-1"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/requests/${request._id}`)}
            className="p-1"
          >
            <Briefcase className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
    { value: 'expired', label: 'منتهي الصلاحية' },
    { value: 'pending', label: 'قيد الانتظار' },
  ];

  const urgencyOptions = [
    { value: 'all', label: 'جميع الأولويات' },
    { value: 'asap', label: 'عاجل' },
    { value: 'this-week', label: 'هذا الأسبوع' },
    { value: 'flexible', label: 'مرن' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'plumbing', label: 'سباكة' },
    { value: 'electrical', label: 'كهرباء' },
    { value: 'cleaning', label: 'تنظيف' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'moving', label: 'نقل' },
    { value: 'other', label: 'أخرى' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-deep-teal mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">فشل تحميل بيانات طلبات الخدمات</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'لوحة التحكم', href: '/admin' },
        { label: 'طلبات الخدمات', href: '/admin/service-requests' }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-teal">مراقبة طلبات الخدمات</h1>
          <p className="text-gray-600 mt-2">مراقبة وإدارة جميع طلبات الخدمات في المنصة</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/reports/service-requests')}>
            <Briefcase className="w-4 h-4 mr-2" />
            تقرير طلبات الخدمات
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-deep-teal">
                {requestsData?.totalItems || 0}
              </p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الطلبات النشطة</p>
              <p className="text-2xl font-bold text-green-600">
                {requestsData?.requests?.filter(r => r.status === 'active').length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الطلبات العاجلة</p>
              <p className="text-2xl font-bold text-red-600">
                {requestsData?.requests?.filter(r => r.urgency === 'asap').length || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">متوسط العروض</p>
              <p className="text-2xl font-bold text-purple-600">
                {requestsData?.requests?.length > 0 
                  ? (requestsData.requests.reduce((sum, req) => sum + req.offerCount, 0) / requestsData.requests.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <User className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في طلبات الخدمات..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفئة
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الأولوية
            </label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {urgencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <SortableTable
          data={requestsData?.requests || []}
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={(field, direction) => {
            setSortField(field);
            setSortDirection(direction);
          }}
          loading={isLoading}
          emptyMessage="لا توجد طلبات خدمات"
        />
      </div>

      {/* Pagination */}
      {requestsData && requestsData.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={requestsData.totalPages}
          onPageChange={setPage}
          totalItems={requestsData.totalItems}
          itemsPerPage={requestsData.itemsPerPage}
        />
      )}
    </div>
  );
};

export default AdminServiceRequests; 
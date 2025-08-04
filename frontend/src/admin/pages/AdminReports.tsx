import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Download, Calendar, TrendingUp, Users, DollarSign, Briefcase, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Breadcrumb from '../components/UI/Breadcrumb';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportData {
  users: {
    total: number;
    seekers: number;
    providers: number;
    admins: number;
    growth: Array<{ date: string; count: number }>;
  };
  services: {
    total: number;
    active: number;
    completed: number;
    categories: Array<{ name: string; count: number }>;
  };
  payments: {
    total: number;
    amount: number;
    currency: string;
    monthly: Array<{ month: string; amount: number }>;
  };
  reviews: {
    total: number;
    average: number;
    distribution: Array<{ rating: number; count: number }>;
  };
  verifications: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

const fetchReportData = async (period: string, token: string | null): Promise<ReportData> => {
  const params = new URLSearchParams();
  params.append('period', period);
  
  const res = await fetch(`/api/admin/reports?${params.toString()}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('فشل تحميل بيانات التقرير');
  const data = await res.json();
  return data.data;
};

const downloadReport = async (type: string, format: string, period: string, token: string | null) => {
  const params = new URLSearchParams();
  params.append('type', type);
  params.append('format', format);
  params.append('period', period);
  
  const res = await fetch(`/api/admin/reports/download?${params.toString()}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('فشل تحميل التقرير');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-report-${period}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['admin-reports', selectedPeriod, accessToken],
    queryFn: () => fetchReportData(selectedPeriod, accessToken),
    enabled: !!accessToken,
  });

  const handleDownloadReport = async (type: string, format: string) => {
    try {
      await downloadReport(type, format, selectedPeriod, accessToken);
      showSuccess('تم تحميل التقرير بنجاح');
    } catch (error) {
      showError('فشل تحميل التقرير');
    }
  };

  const periodOptions = [
    { value: 'week', label: 'الأسبوع الماضي' },
    { value: 'month', label: 'الشهر الماضي' },
    { value: 'quarter', label: 'الربع الماضي' },
    { value: 'year', label: 'السنة الماضية' },
  ];

  const reportTypes = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'users', label: 'تقرير المستخدمين', icon: Users },
    { id: 'services', label: 'تقرير الخدمات', icon: Briefcase },
    { id: 'payments', label: 'تقرير المدفوعات', icon: DollarSign },
    { id: 'reviews', label: 'تقرير التقييمات', icon: MessageSquare },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-deep-teal mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">فشل تحميل بيانات التقارير</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'لوحة التحكم', href: '/admin' },
        { label: 'التقارير', href: '/admin/reports' }
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-teal">التقارير والتحليلات</h1>
          <p className="text-gray-600 mt-2">عرض وتحليل بيانات المنصة</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Type Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedReport === report.id
                  ? 'bg-deep-teal text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <report.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{report.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal"></div>
            <span className="ml-2 text-gray-600">جاري تحميل البيانات...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Report */}
          {selectedReport === 'overview' && reportData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
                      <p className="text-2xl font-bold text-deep-teal">
                        {reportData.users.total.toLocaleString()}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">إجمالي الخدمات</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.services.total.toLocaleString()}
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">إجمالي المدفوعات</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {new Intl.NumberFormat('ar-EG', {
                          style: 'currency',
                          currency: reportData.payments.currency || 'EGP',
                        }).format(reportData.payments.amount)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">متوسط التقييم</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {reportData.reviews.average.toFixed(1)}
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">نمو المستخدمين</h3>
                  <Line
                    data={{
                      labels: reportData.users.growth.map(item => item.date),
                      datasets: [
                        {
                          label: 'المستخدمين',
                          data: reportData.users.growth.map(item => item.count),
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
                    }}
                  />
                </div>

                {/* Service Categories Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع الخدمات حسب الفئة</h3>
                  <Doughnut
                    data={{
                      labels: reportData.services.categories.map(item => item.name),
                      datasets: [
                        {
                          data: reportData.services.categories.map(item => item.count),
                          backgroundColor: [
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#8B5CF6',
                            '#06B6D4',
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Download Options */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تحميل التقارير</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('overview', 'pdf')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تقرير شامل (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('overview', 'excel')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تقرير شامل (Excel)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('overview', 'csv')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تقرير شامل (CSV)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Users Report */}
          {selectedReport === 'users' && reportData && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تقرير المستخدمين</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{reportData.users.seekers}</p>
                    <p className="text-sm text-gray-500">طالبو الخدمات</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{reportData.users.providers}</p>
                    <p className="text-sm text-gray-500">مقدمو الخدمات</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{reportData.users.admins}</p>
                    <p className="text-sm text-gray-500">المديرون</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('users', 'pdf')}
                  >
                    تحميل تقرير المستخدمين (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('users', 'excel')}
                  >
                    تحميل تقرير المستخدمين (Excel)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Services Report */}
          {selectedReport === 'services' && reportData && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تقرير الخدمات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{reportData.services.active}</p>
                    <p className="text-sm text-gray-500">الخدمات النشطة</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{reportData.services.completed}</p>
                    <p className="text-sm text-gray-500">الخدمات المكتملة</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('services', 'pdf')}
                  >
                    تحميل تقرير الخدمات (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('services', 'excel')}
                  >
                    تحميل تقرير الخدمات (Excel)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Payments Report */}
          {selectedReport === 'payments' && reportData && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تقرير المدفوعات</h3>
                <div className="mb-6">
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('ar-EG', {
                      style: 'currency',
                      currency: reportData.payments.currency || 'EGP',
                    }).format(reportData.payments.amount)}
                  </p>
                  <p className="text-sm text-gray-500">إجمالي المدفوعات</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('payments', 'pdf')}
                  >
                    تحميل تقرير المدفوعات (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('payments', 'excel')}
                  >
                    تحميل تقرير المدفوعات (Excel)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Report */}
          {selectedReport === 'reviews' && reportData && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تقرير التقييمات</h3>
                <div className="mb-6">
                  <p className="text-2xl font-bold text-yellow-600">{reportData.reviews.average}</p>
                  <p className="text-sm text-gray-500">متوسط التقييم</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('reviews', 'pdf')}
                  >
                    تحميل تقرير التقييمات (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport('reviews', 'excel')}
                  >
                    تحميل تقرير التقييمات (Excel)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReports; 
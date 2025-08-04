import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  Settings,
  Bell,
  BellOff,
  Download,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Database,
  Server,
  Network,
  HardDrive,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Calendar,
  Search,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AdvancedAnalyticsDashboard from '../../components/analytics/AdvancedAnalyticsDashboard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface AdvancedAnalyticsPageProps {
  className?: string;
}

const AdvancedAnalyticsPage: React.FC<AdvancedAnalyticsPageProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'reports' | 'settings'>('dashboard');

  // Check admin permissions
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('ليس لديك صلاحية للوصول لصفحة التحليلات', 'error');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  }, [user, showToast]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    showToast(
      showNotifications ? 'تم إيقاف الإشعارات' : 'تم تفعيل الإشعارات', 
      'success'
    );
  };

  const handleExportAllData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/export/all', {
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
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('تم تصدير جميع البيانات بنجاح', 'success');
      } else {
        showToast('خطأ في تصدير البيانات', 'error');
      }
    } catch (error) {
      showToast('خطأ في تصدير البيانات', 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">غير مصرح</h3>
          <p className="text-gray-600 mb-4">
            ليس لديك صلاحية للوصول لصفحة التحليلات
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-deep-teal rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-deep-teal">التحليلات المتقدمة</h1>
                  <p className="text-sm text-gray-600">تحليل شامل لأداء المنصة والاتجاهات</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleNotifications}
                  className="flex items-center gap-2"
                >
                  {showNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  {showNotifications ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFullscreen}
                  className="flex items-center gap-2"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAllData}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تصدير الكل
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">التحليلات</div>
                <div className="text-xs text-gray-500">نشطة</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">قاعدة البيانات</div>
                <div className="text-xs text-gray-500">متصل</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">الخادم</div>
                <div className="text-xs text-gray-500">مستقر</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">الأداء</div>
                <div className="text-xs text-gray-500">جيد</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">الأمان</div>
                <div className="text-xs text-gray-500">محمي</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">التحديثات</div>
                <div className="text-xs text-gray-500">مباشرة</div>
              </div>
            </div>
          </div>
        </div>

        {/* View Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
                { id: 'reports', label: 'التقارير', icon: FileText },
                { id: 'settings', label: 'الإعدادات', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedView(id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    selectedView === id
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
        </div>

        {/* Main Content */}
        {selectedView === 'dashboard' && (
          <AdvancedAnalyticsDashboard />
        )}

        {selectedView === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">التقارير المتقدمة</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>تقارير مخصصة</span>
                </div>
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  <span>تحليل البيانات</span>
                </div>
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4" />
                  <span>الرسوم البيانية</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">إعدادات التحليلات</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>إعدادات العرض</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>إعدادات التحديث</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>إعدادات التصدير</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>آخر تحديث: {new Date().toLocaleString('ar-EG')}</span>
              <span>•</span>
              <span>التحليلات نشطة</span>
            </div>
            <div className="flex items-center gap-4">
              <span>الإصدار: 2.0.0</span>
              <span>•</span>
              <span>تحليلات متقدمة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage; 
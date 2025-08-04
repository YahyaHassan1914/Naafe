import React, { useState, useEffect } from 'react';
import { 
  Activity,
  BarChart3,
  Settings,
  Download,
  Calendar,
  Filter,
  Search,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import RealTimeActivityMonitor from '../../components/monitoring/RealTimeActivityMonitor';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface ActivityMonitoringPageProps {
  className?: string;
}

const ActivityMonitoringPage: React.FC<ActivityMonitoringPageProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedView, setSelectedView] = useState<'live' | 'analytics' | 'alerts'>('live');

  // Check admin permissions
  useEffect(() => {
    if (!user || !user.permissions?.includes('admin.monitoring.view')) {
      showToast('ليس لديك صلاحية للوصول لصفحة المراقبة', 'error');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  }, [user, showToast]);

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/export', {
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
        a.download = `activity-monitoring-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('تم تصدير البيانات بنجاح', 'success');
      } else {
        showToast('خطأ في تصدير البيانات', 'error');
      }
    } catch (error) {
      showToast('خطأ في تصدير البيانات', 'error');
    }
  };

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

  if (!user || !user.permissions?.includes('admin.monitoring.view')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">غير مصرح</h3>
          <p className="text-gray-600 mb-4">
            ليس لديك صلاحية للوصول لصفحة مراقبة النشاط
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
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-deep-teal">مراقبة النشاط المباشر</h1>
                  <p className="text-sm text-gray-600">مراقبة شاملة لجميع أنشطة المنصة</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedView('live')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedView === 'live'
                      ? 'bg-white text-deep-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-1" />
                  مباشر
                </button>
                <button
                  onClick={() => setSelectedView('analytics')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedView === 'analytics'
                      ? 'bg-white text-deep-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  تحليلات
                </button>
                <button
                  onClick={() => setSelectedView('alerts')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedView === 'alerts'
                      ? 'bg-white text-deep-teal shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  تنبيهات
                </button>
              </div>

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
                  onClick={handleExportData}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تصدير
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
                <div className="text-sm font-medium text-gray-900">النظام</div>
                <div className="text-xs text-gray-500">مستقر</div>
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
                <div className="text-sm font-medium text-gray-900">الشبكة</div>
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
                <div className="text-xs text-gray-500">تلقائي</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {selectedView === 'live' && (
          <RealTimeActivityMonitor />
        )}

        {selectedView === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">تحليلات متقدمة</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>تحليل الاتجاهات</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>تحليل المستخدمين</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>تحليل الأداء</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'alerts' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">إدارة التنبيهات</h3>
              <p className="text-gray-600 mb-4">
                قيد التطوير - ستتوفر قريباً
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>إعدادات التنبيهات</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>مراقبة التنبيهات</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>تخصيص القواعد</span>
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
              <span>مراقبة نشطة</span>
            </div>
            <div className="flex items-center gap-4">
              <span>الإصدار: 1.0.0</span>
              <span>•</span>
              <span>نظام مراقبة متقدم</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityMonitoringPage; 
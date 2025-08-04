import React, { useState, useEffect } from 'react';
import { 
  Briefcase,
  Settings,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Download,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import EnhancedProviderDashboard from '../../components/provider/EnhancedProviderDashboard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface EnhancedProviderDashboardPageProps {
  className?: string;
}

const EnhancedProviderDashboardPage: React.FC<EnhancedProviderDashboardPageProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check provider permissions
  useEffect(() => {
    if (!user || user.role !== 'provider') {
      showToast('ليس لديك صلاحية للوصول لصفحة المقدم', 'error');
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

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/provider/export', {
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
        a.download = `provider-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (!user || user.role !== 'provider') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">غير مصرح</h3>
          <p className="text-gray-600 mb-4">
            ليس لديك صلاحية للوصول لصفحة المقدم
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
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-deep-teal">لوحة تحكم المقدم المحسنة</h1>
                  <p className="text-sm text-gray-600">إدارة شاملة لمهاراتك وأعمالك وأرباحك</p>
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
                <div className="text-sm font-medium text-gray-900">الحساب</div>
                <div className="text-xs text-gray-500">نشط</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">التحقق</div>
                <div className="text-xs text-gray-500">موثق</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">المهارات</div>
                <div className="text-xs text-gray-500">نشطة</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">التوفر</div>
                <div className="text-xs text-gray-500">محدود</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">الأرباح</div>
                <div className="text-xs text-gray-500">مستقرة</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">التقييمات</div>
                <div className="text-xs text-gray-500">ممتازة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <EnhancedProviderDashboard />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>آخر تحديث: {new Date().toLocaleString('ar-EG')}</span>
              <span>•</span>
              <span>لوحة تحكم نشطة</span>
            </div>
            <div className="flex items-center gap-4">
              <span>الإصدار: 2.0.0</span>
              <span>•</span>
              <span>لوحة تحكم محسنة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProviderDashboardPage; 
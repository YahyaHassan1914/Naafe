import React, { useState, useEffect } from 'react';
import { 
  Gavel, Settings, Bell, BellOff, Download, Maximize2, Minimize2, AlertTriangle, CheckCircle, Clock, Users, TrendingUp, Shield, Zap, Database, Server, Network, HardDrive, Cpu, Eye, EyeOff, RefreshCw, Filter, Calendar, Search, FileText, PieChart, LineChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DisputeResolutionCenter from '../../components/admin/disputes/DisputeResolutionCenter';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface DisputeResolutionPageProps {
  className?: string;
}

const DisputeResolutionPage: React.FC<DisputeResolutionPageProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedView, setSelectedView] = useState<'disputes' | 'reports' | 'settings'>('disputes');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('ليس لديك صلاحية للوصول لصفحة حل النزاعات', 'error');
      window.location.href = '/dashboard';
    }
  }, [user, showToast]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
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
      const response = await fetch('/api/admin/disputes/export-all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disputes-complete-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      showToast('تم تصدير جميع البيانات بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h2>
          <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Gavel className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">مركز حل النزاعات</h1>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                نظام متقدم
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <Button
                onClick={handleToggleNotifications}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse"
              >
                {showNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span>{showNotifications ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}</span>
              </Button>
              
              <Button
                onClick={handleExportAllData}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Download className="w-4 h-4" />
                <span>تصدير البيانات</span>
              </Button>
              
              <Button
                onClick={handleToggleFullscreen}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span>{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-6 space-x-reverse text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700">النظام يعمل بشكل طبيعي</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">المشرفين المتصلين: 3</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">تحديث تلقائي: {autoRefresh ? 'مفعل' : 'معطل'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 space-x-reverse">
            <button
              onClick={() => setSelectedView('disputes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'disputes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <Gavel className="w-4 h-4" />
                <span>إدارة النزاعات</span>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedView('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="w-4 h-4" />
                <span>التقارير</span>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedView('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedView === 'disputes' && (
          <DisputeResolutionCenter />
        )}
        
        {selectedView === 'reports' && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">التقارير</h3>
            <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
          </div>
        )}
        
        {selectedView === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">الإعدادات</h3>
            <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span>مركز حل النزاعات - نظام إدارة متقدم</span>
              <span>•</span>
              <span>الإصدار 1.0.0</span>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span>آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</span>
              <span>•</span>
              <span>جميع الحقوق محفوظة © 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolutionPage; 
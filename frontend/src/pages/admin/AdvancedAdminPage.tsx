import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  FileText, 
  Settings, 
  AlertTriangle,
  MessageSquare,
  Bell,
  BarChart3,
  Activity,
  Database,
  Lock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Home,
  UserCheck,
  FileImage,
  MessageCircle,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import AdminRoleManager from '../../components/admin/roles/AdminRoleManager';
import EvidenceReviewSystem from '../../components/admin/evidence/EvidenceReviewSystem';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalRequests: number;
  totalOffers: number;
  pendingVerifications: number;
  pendingDisputes: number;
  pendingEvidence: number;
  activeAdmins: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  lastBackup: Date;
  uptime: number; // in hours
}

interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  isGranted: boolean;
}

interface AdvancedAdminPageProps {
  className?: string;
}

const AdvancedAdminPage: React.FC<AdvancedAdminPageProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'evidence' | 'disputes' | 'notifications' | 'analytics'>('overview');
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [userPermissions, setUserPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin data
  const { data: statsData, isLoading: statsLoading } = useApi('/admin/stats');
  const { data: permissionsData, isLoading: permissionsLoading } = useApi('/admin/permissions');

  useEffect(() => {
    if (statsData) {
      setAdminStats(statsData);
    }
  }, [statsData]);

  useEffect(() => {
    if (permissionsData) {
      setUserPermissions(permissionsData);
    }
  }, [permissionsData]);

  useEffect(() => {
    setIsLoading(statsLoading || permissionsLoading);
  }, [statsLoading, permissionsLoading]);

  const handleTabChange = (tab: string) => {
    // Check permissions before allowing tab access
    const requiredPermissions: { [key: string]: string[] } = {
      roles: ['admin.roles.manage'],
      evidence: ['admin.evidence.review'],
      disputes: ['admin.disputes.manage'],
      notifications: ['admin.notifications.send'],
      analytics: ['admin.analytics.view']
    };

    if (requiredPermissions[tab]) {
      const hasPermission = requiredPermissions[tab].some(permission =>
        userPermissions.some(p => p.id === permission && p.isGranted)
      );

      if (!hasPermission) {
        showToast('ليس لديك صلاحية للوصول إلى هذا القسم', 'error');
        return;
      }
    }

    setActiveTab(tab as any);
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSystemHealthLabel = (health: string) => {
    switch (health) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'warning': return 'تحذير';
      case 'critical': return 'حرج';
      default: return health;
    }
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} يوم و ${remainingHours} ساعة`;
  };

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل لوحة الإدارة المتقدمة...</p>
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
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-deep-teal" />
                <div>
                  <h1 className="text-2xl font-bold text-deep-teal">لوحة الإدارة المتقدمة</h1>
                  <p className="text-sm text-gray-600">إدارة متقدمة للنظام والصلاحيات</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="primary" 
                className={`text-sm ${getSystemHealthColor(adminStats?.systemHealth || 'good')}`}
              >
                {getSystemHealthLabel(adminStats?.systemHealth || 'good')}
              </Badge>
              <Badge variant="info" className="text-sm">
                {user?.name?.first} {user?.name?.last}
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => handleTabChange('overview')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              نظرة عامة
            </button>
            <button
              onClick={() => handleTabChange('roles')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'roles'
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              الأدوار والصلاحيات
            </button>
            <button
              onClick={() => handleTabChange('evidence')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'evidence'
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileImage className="w-4 h-4 inline mr-2" />
              مراجعة الأدلة
            </button>
            <button
              onClick={() => handleTabChange('disputes')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'disputes'
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              النزاعات
            </button>
            <button
              onClick={() => handleTabChange('notifications')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Volume2 className="w-4 h-4 inline mr-2" />
              الإشعارات
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              التحليلات
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold text-deep-teal">{adminStats?.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-deep-teal" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المحترفون</p>
                    <p className="text-2xl font-bold text-deep-teal">{adminStats?.totalProviders || 0}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-deep-teal" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">طلبات الخدمة</p>
                    <p className="text-2xl font-bold text-deep-teal">{adminStats?.totalRequests || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-deep-teal" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">العروض</p>
                    <p className="text-2xl font-bold text-deep-teal">{adminStats?.totalOffers || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-deep-teal" />
                </div>
              </div>
            </div>

            {/* Pending Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-deep-teal">في الانتظار</h3>
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">طلبات التحقق</span>
                    <Badge variant="warning">{adminStats?.pendingVerifications || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">النزاعات</span>
                    <Badge variant="warning">{adminStats?.pendingDisputes || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الأدلة</span>
                    <Badge variant="warning">{adminStats?.pendingEvidence || 0}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-deep-teal">صحة النظام</h3>
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">حالة النظام</span>
                    <Badge 
                      variant="primary" 
                      className={`text-sm ${getSystemHealthColor(adminStats?.systemHealth || 'good')}`}
                    >
                      {getSystemHealthLabel(adminStats?.systemHealth || 'good')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">وقت التشغيل</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatUptime(adminStats?.uptime || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">آخر نسخة احتياطية</span>
                    <span className="text-sm font-medium text-gray-900">
                      {adminStats?.lastBackup ? new Date(adminStats.lastBackup).toLocaleDateString('ar-EG') : 'غير متوفر'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-deep-teal">الصلاحيات</h3>
                  <Lock className="w-6 h-6 text-deep-teal" />
                </div>
                <div className="space-y-3">
                  {userPermissions.slice(0, 5).map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{permission.name}</span>
                      {permission.isGranted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  ))}
                  {userPermissions.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        عرض المزيد
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-deep-teal mb-4">إجراءات سريعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => handleTabChange('roles')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  إدارة الأدوار
                </Button>
                <Button
                  onClick={() => handleTabChange('evidence')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  مراجعة الأدلة
                </Button>
                <Button
                  onClick={() => handleTabChange('disputes')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  النزاعات
                </Button>
                <Button
                  onClick={() => handleTabChange('notifications')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  إرسال إشعارات
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <AdminRoleManager />
        )}

        {activeTab === 'evidence' && (
          <EvidenceReviewSystem />
        )}

        {activeTab === 'disputes' && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">مركز حل النزاعات</h3>
            <p className="text-gray-600 mb-4">
              سيتم إضافة نظام إدارة النزاعات قريباً
            </p>
            <Button variant="outline">
              قيد التطوير
            </Button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="text-center py-12">
            <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">نظام الإشعارات المجمعة</h3>
            <p className="text-gray-600 mb-4">
              سيتم إضافة نظام الإشعارات المجمعة قريباً
            </p>
            <Button variant="outline">
              قيد التطوير
            </Button>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">التحليلات المتقدمة</h3>
            <p className="text-gray-600 mb-4">
              سيتم إضافة التحليلات المتقدمة قريباً
            </p>
            <Button variant="outline">
              قيد التطوير
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAdminPage; 
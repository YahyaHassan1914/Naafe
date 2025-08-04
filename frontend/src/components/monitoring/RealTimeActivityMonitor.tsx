import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  User,
  UserCheck,
  UserX,
  DollarSign,
  ShoppingCart,
  MessageCircle,
  FileText,
  Shield,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  Search,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface ActivityEvent {
  _id: string;
  type: 'user_login' | 'user_logout' | 'request_created' | 'offer_made' | 'payment_processed' | 'review_posted' | 'dispute_created' | 'system_alert' | 'emergency' | 'performance_issue';
  userId?: string;
  userName?: string;
  userRole?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastUpdated: Date;
}

interface UserStatus {
  _id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastActivity: Date;
  currentPage?: string;
  location?: string;
  device?: string;
}

interface EmergencyAlert {
  _id: string;
  type: 'system_down' | 'security_breach' | 'payment_failure' | 'high_dispute_rate' | 'performance_degradation' | 'database_issue';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'acknowledged';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  affectedUsers?: number;
  estimatedImpact?: string;
}

interface RealTimeActivityMonitorProps {
  className?: string;
}

const RealTimeActivityMonitor: React.FC<RealTimeActivityMonitorProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);

  // Fetch initial data
  const { data: activitiesData, isLoading: activitiesLoading } = useApi('/admin/activities');
  const { data: metricsData, isLoading: metricsLoading } = useApi('/admin/metrics');
  const { data: usersData, isLoading: usersLoading } = useApi('/admin/online-users');
  const { data: alertsData, isLoading: alertsLoading } = useApi('/admin/emergency-alerts');

  useEffect(() => {
    if (activitiesData) setActivities(activitiesData);
    if (metricsData) setSystemMetrics(metricsData);
    if (usersData) setOnlineUsers(usersData);
    if (alertsData) setEmergencyAlerts(alertsData);
  }, [activitiesData, metricsData, usersData, alertsData]);

  // Real-time monitoring setup
  useEffect(() => {
    if (!isMonitoring) return;

    // Setup Socket.IO connection for real-time updates
    const setupSocket = () => {
      // This would connect to your Socket.IO server
      // socketRef.current = io('/admin-monitoring');
      
      // Mock real-time updates for demonstration
      intervalRef.current = setInterval(() => {
        if (!isPaused && autoRefresh) {
          // Simulate new activity events
          const newActivity: ActivityEvent = {
            _id: Date.now().toString(),
            type: ['user_login', 'request_created', 'offer_made', 'payment_processed'][Math.floor(Math.random() * 4)] as any,
            userId: 'user_' + Math.floor(Math.random() * 1000),
            userName: 'User ' + Math.floor(Math.random() * 1000),
            userRole: ['seeker', 'provider'][Math.floor(Math.random() * 2)],
            details: { action: 'Sample activity' },
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
            timestamp: new Date(),
            location: 'Egypt',
            ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            userAgent: 'Mozilla/5.0...'
          };

          setActivities(prev => [newActivity, ...prev.slice(0, 99)]); // Keep last 100 activities
        }
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    };

    const cleanup = setupSocket();
    return cleanup;
  }, [isMonitoring, isPaused, autoRefresh, refreshInterval]);

  const handleEmergencyAlert = (alert: EmergencyAlert) => {
    showToast(`🚨 ${alert.title}: ${alert.description}`, 'error');
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/emergency-alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setEmergencyAlerts(prev => prev.map(alert => 
          alert._id === alertId 
            ? { ...alert, status: 'acknowledged' }
            : alert
        ));
        showToast('تم الإقرار بالتنبيه', 'success');
      }
    } catch (error) {
      showToast('خطأ في الإقرار بالتنبيه', 'error');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/emergency-alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setEmergencyAlerts(prev => prev.map(alert => 
          alert._id === alertId 
            ? { ...alert, status: 'resolved', resolvedAt: new Date(), resolvedBy: user?._id }
            : alert
        ));
        showToast('تم حل التنبيه', 'success');
      }
    } catch (error) {
      showToast('خطأ في حل التنبيه', 'error');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'user_logout': return <UserX className="w-4 h-4 text-gray-600" />;
      case 'request_created': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'offer_made': return <ShoppingCart className="w-4 h-4 text-purple-600" />;
      case 'payment_processed': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'review_posted': return <MessageCircle className="w-4 h-4 text-yellow-600" />;
      case 'dispute_created': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'system_alert': return <Shield className="w-4 h-4 text-orange-600" />;
      case 'emergency': return <Zap className="w-4 h-4 text-red-600" />;
      case 'performance_issue': return <Cpu className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'user_login': return 'تسجيل دخول';
      case 'user_logout': return 'تسجيل خروج';
      case 'request_created': return 'طلب خدمة جديد';
      case 'offer_made': return 'عرض جديد';
      case 'payment_processed': return 'دفع معالج';
      case 'review_posted': return 'تقييم جديد';
      case 'dispute_created': return 'نزاع جديد';
      case 'system_alert': return 'تنبيه نظام';
      case 'emergency': return 'حالة طوارئ';
      case 'performance_issue': return 'مشكلة أداء';
      default: return type;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      case 'critical': return 'حرج';
      default: return severity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'offline': return 'text-gray-600 bg-gray-50';
      case 'away': return 'text-yellow-600 bg-yellow-50';
      case 'busy': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'متصل';
      case 'offline': return 'غير متصل';
      case 'away': return 'غائب';
      case 'busy': return 'مشغول';
      default: return status;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'system_down': return <Server className="w-5 h-5 text-red-600" />;
      case 'security_breach': return <Shield className="w-5 h-5 text-red-600" />;
      case 'payment_failure': return <DollarSign className="w-5 h-5 text-red-600" />;
      case 'high_dispute_rate': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'performance_degradation': return <Cpu className="w-5 h-5 text-yellow-600" />;
      case 'database_issue': return <Database className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType !== 'all' && activity.type !== filterType) return false;
    if (filterSeverity !== 'all' && activity.severity !== filterSeverity) return false;
    return true;
  });

  const criticalAlerts = emergencyAlerts.filter(alert => alert.severity === 'critical' && alert.status === 'active');
  const activeAlerts = emergencyAlerts.filter(alert => alert.status === 'active');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-deep-teal">مراقبة النشاط المباشر</h1>
            <p className="text-gray-600">مراقبة مباشرة لجميع أنشطة المنصة والأداء</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isMonitoring ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">مراقبة نشطة</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium">مراقبة متوقفة</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'استئناف' : 'إيقاف مؤقت'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
              </Button>
            </div>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">تنبيهات حرجة!</h3>
                <p className="text-red-800 text-sm">
                  يوجد {criticalAlerts.length} تنبيه حرج يتطلب اهتمام فوري
                </p>
              </div>
              <Button
                onClick={() => setShowAlerts(!showAlerts)}
                variant="outline"
                size="sm"
                className="ml-auto text-red-600 hover:text-red-700"
              >
                {showAlerts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAlerts ? 'إخفاء' : 'عرض'}
              </Button>
            </div>
          </div>
        )}

        {/* System Metrics */}
        {systemMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Cpu className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-900">{systemMetrics.cpu}%</div>
              <div className="text-xs text-blue-700">استخدام المعالج</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <HardDrive className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-900">{systemMetrics.memory}%</div>
              <div className="text-xs text-green-700">استخدام الذاكرة</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Database className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-900">{systemMetrics.disk}%</div>
              <div className="text-xs text-purple-700">استخدام القرص</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Network className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-orange-900">{systemMetrics.network}%</div>
              <div className="text-xs text-orange-700">استخدام الشبكة</div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-indigo-900">{systemMetrics.activeConnections}</div>
              <div className="text-xs text-indigo-700">اتصالات نشطة</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-yellow-900">{systemMetrics.responseTime}ms</div>
              <div className="text-xs text-yellow-700">وقت الاستجابة</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-red-900">{systemMetrics.errorRate}%</div>
              <div className="text-xs text-red-700">معدل الأخطاء</div>
            </div>
            
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-teal-900">{Math.floor(systemMetrics.uptime / 3600)}h</div>
              <div className="text-xs text-teal-700">وقت التشغيل</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">الفترة الزمنية:</span>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="15m">آخر 15 دقيقة</option>
              <option value="1h">آخر ساعة</option>
              <option value="6h">آخر 6 ساعات</option>
              <option value="24h">آخر 24 ساعة</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">نوع النشاط:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">جميع الأنواع</option>
              <option value="user_login">تسجيل دخول</option>
              <option value="request_created">طلبات جديدة</option>
              <option value="offer_made">عروض جديدة</option>
              <option value="payment_processed">مدفوعات</option>
              <option value="dispute_created">نزاعات</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">مستوى الأهمية:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">جميع المستويات</option>
              <option value="low">منخفض</option>
              <option value="medium">متوسط</option>
              <option value="high">عالي</option>
              <option value="critical">حرج</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-600">
              تحديث تلقائي
            </label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Refresh data
              window.location.reload();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Feed */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-deep-teal">سجل النشاط المباشر</h2>
              <Badge variant="info">
                {filteredActivities.length} نشاط
              </Badge>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredActivities.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredActivities.map((activity) => (
                    <div key={activity._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {activity.userName || 'نظام'}
                            </span>
                            <Badge 
                              variant="primary" 
                              className={`text-xs ${getSeverityColor(activity.severity)}`}
                            >
                              {getSeverityLabel(activity.severity)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleTimeString('ar-EG')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {getActivityLabel(activity.type)}
                          </p>
                          {activity.location && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {activity.location} • {activity.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد أنشطة في الوقت الحالي</p>
                </div>
              )}
            </div>
          </div>

          {/* Online Users */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-deep-teal">المستخدمون المتصلون</h2>
              <Badge variant="success">
                {onlineUsers.filter(u => u.status === 'online').length} متصل
              </Badge>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {onlineUsers.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {onlineUsers.map((user) => (
                    <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.name}</span>
                            <Badge 
                              variant="primary" 
                              className={`text-xs ${getStatusColor(user.status)}`}
                            >
                              {getStatusLabel(user.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {user.role} • {user.currentPage || 'غير محدد'}
                          </p>
                          <p className="text-xs text-gray-500">
                            آخر نشاط: {new Date(user.lastActivity).toLocaleTimeString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لا يوجد مستخدمون متصلون</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Alerts & Quick Stats */}
        <div className="space-y-6">
          {/* Emergency Alerts */}
          {showAlerts && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-deep-teal">التنبيهات الطارئة</h2>
                <Badge variant="error">
                  {activeAlerts.length} نشط
                </Badge>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {activeAlerts.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {activeAlerts.map((alert) => (
                      <div key={alert._id} className="p-4">
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              <Badge 
                                variant="error" 
                                className={`text-xs ${getSeverityColor(alert.severity)}`}
                              >
                                {getSeverityLabel(alert.severity)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                            <p className="text-xs text-gray-500 mb-3">
                              {new Date(alert.createdAt).toLocaleString('ar-EG')}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledgeAlert(alert._id)}
                                className="text-xs"
                              >
                                إقرار
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleResolveAlert(alert._id)}
                                className="text-xs"
                              >
                                حل
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p>لا توجد تنبيهات نشطة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-deep-teal mb-4">إحصائيات سريعة</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">إجمالي الأنشطة اليوم:</span>
                <span className="font-semibold">{activities.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">المستخدمون المتصلون:</span>
                <span className="font-semibold text-green-600">
                  {onlineUsers.filter(u => u.status === 'online').length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">التنبيهات النشطة:</span>
                <span className="font-semibold text-red-600">{activeAlerts.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">معدل الاستجابة:</span>
                <span className="font-semibold">
                  {systemMetrics ? `${systemMetrics.responseTime}ms` : 'غير متوفر'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">معدل الأخطاء:</span>
                <span className="font-semibold">
                  {systemMetrics ? `${systemMetrics.errorRate}%` : 'غير متوفر'}
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-deep-teal mb-4">حالة النظام</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">اتصال الشبكة</span>
                </div>
                <Badge variant="success">مستقر</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">قاعدة البيانات</span>
                </div>
                <Badge variant="success">مستقر</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">الخادم</span>
                </div>
                <Badge variant="success">مستقر</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">الأمان</span>
                </div>
                <Badge variant="success">مستقر</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeActivityMonitor; 
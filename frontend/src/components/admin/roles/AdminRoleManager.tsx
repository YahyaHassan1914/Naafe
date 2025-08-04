import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  FileText, 
  Settings, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useApi } from '../../../hooks/useApi';
import Button from '../../ui/Button';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import Badge from '../../ui/Badge';

interface AdminRole {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  level: number; // 1 = Super Admin, 2 = Support Admin, 3 = Verification Admin, 4 = Content Admin
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
}

interface AdminUser {
  _id: string;
  name: { first: string; last: string };
  email: string;
  phone: string;
  avatarUrl?: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isDangerous: boolean;
}

const ADMIN_ROLES = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    displayName: 'مدير عام',
    description: 'صلاحيات كاملة على النظام',
    level: 1,
    defaultPermissions: [
      'admin.users.manage',
      'admin.roles.manage',
      'admin.system.settings',
      'admin.reports.view',
      'admin.reports.manage',
      'admin.verifications.manage',
      'admin.content.manage',
      'admin.payments.manage',
      'admin.analytics.view',
      'admin.analytics.manage',
      'admin.notifications.send',
      'admin.disputes.manage',
      'admin.evidence.review',
      'admin.bulk.operations'
    ]
  },
  {
    id: 'support_admin',
    name: 'Support Admin',
    displayName: 'مدير الدعم',
    description: 'إدارة الشكاوى والدعم الفني',
    level: 2,
    defaultPermissions: [
      'admin.users.view',
      'admin.reports.view',
      'admin.reports.manage',
      'admin.disputes.view',
      'admin.disputes.manage',
      'admin.notifications.send',
      'admin.evidence.review'
    ]
  },
  {
    id: 'verification_admin',
    name: 'Verification Admin',
    displayName: 'مدير التحقق',
    description: 'إدارة طلبات التحقق والمحترفين',
    level: 3,
    defaultPermissions: [
      'admin.users.view',
      'admin.verifications.view',
      'admin.verifications.manage',
      'admin.evidence.review',
      'admin.reports.view'
    ]
  },
  {
    id: 'content_admin',
    name: 'Content Admin',
    displayName: 'مدير المحتوى',
    description: 'إدارة المحتوى والفئات',
    level: 4,
    defaultPermissions: [
      'admin.content.view',
      'admin.content.manage',
      'admin.categories.manage',
      'admin.reviews.moderate'
    ]
  }
];

const PERMISSIONS: Permission[] = [
  // User Management
  { id: 'admin.users.view', name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين', category: 'إدارة المستخدمين', isDangerous: false },
  { id: 'admin.users.manage', name: 'إدارة المستخدمين', description: 'إضافة، تعديل، حذف المستخدمين', category: 'إدارة المستخدمين', isDangerous: true },
  { id: 'admin.roles.manage', name: 'إدارة الأدوار', description: 'إدارة أدوار المستخدمين والصلاحيات', category: 'إدارة المستخدمين', isDangerous: true },
  
  // System Settings
  { id: 'admin.system.settings', name: 'إعدادات النظام', description: 'تعديل إعدادات النظام العامة', category: 'إعدادات النظام', isDangerous: true },
  
  // Reports & Analytics
  { id: 'admin.reports.view', name: 'عرض التقارير', description: 'عرض تقارير النظام', category: 'التقارير والتحليلات', isDangerous: false },
  { id: 'admin.reports.manage', name: 'إدارة التقارير', description: 'إنشاء وتعديل التقارير', category: 'التقارير والتحليلات', isDangerous: false },
  { id: 'admin.analytics.view', name: 'عرض التحليلات', description: 'عرض تحليلات النظام', category: 'التقارير والتحليلات', isDangerous: false },
  { id: 'admin.analytics.manage', name: 'إدارة التحليلات', description: 'إدارة تحليلات النظام', category: 'التقارير والتحليلات', isDangerous: false },
  
  // Verifications
  { id: 'admin.verifications.view', name: 'عرض التحققات', description: 'عرض طلبات التحقق', category: 'التحقق', isDangerous: false },
  { id: 'admin.verifications.manage', name: 'إدارة التحققات', description: 'الموافقة أو رفض طلبات التحقق', category: 'التحقق', isDangerous: true },
  { id: 'admin.evidence.review', name: 'مراجعة الأدلة', description: 'مراجعة الأدلة والوثائق', category: 'التحقق', isDangerous: false },
  
  // Content Management
  { id: 'admin.content.view', name: 'عرض المحتوى', description: 'عرض محتوى النظام', category: 'إدارة المحتوى', isDangerous: false },
  { id: 'admin.content.manage', name: 'إدارة المحتوى', description: 'إدارة محتوى النظام', category: 'إدارة المحتوى', isDangerous: true },
  { id: 'admin.categories.manage', name: 'إدارة الفئات', description: 'إدارة فئات الخدمات', category: 'إدارة المحتوى', isDangerous: true },
  { id: 'admin.reviews.moderate', name: 'إدارة التقييمات', description: 'مراجعة وإدارة التقييمات', category: 'إدارة المحتوى', isDangerous: false },
  
  // Payments
  { id: 'admin.payments.manage', name: 'إدارة المدفوعات', description: 'إدارة المدفوعات والمعاملات', category: 'المدفوعات', isDangerous: true },
  
  // Notifications
  { id: 'admin.notifications.send', name: 'إرسال الإشعارات', description: 'إرسال إشعارات للمستخدمين', category: 'الإشعارات', isDangerous: false },
  { id: 'admin.bulk.operations', name: 'العمليات المجمعة', description: 'تنفيذ عمليات مجمعة', category: 'الإشعارات', isDangerous: true },
  
  // Disputes
  { id: 'admin.disputes.view', name: 'عرض النزاعات', description: 'عرض النزاعات والشكاوى', category: 'النزاعات', isDangerous: false },
  { id: 'admin.disputes.manage', name: 'إدارة النزاعات', description: 'حل النزاعات وإدارة الشكاوى', category: 'النزاعات', isDangerous: true }
];

interface AdminRoleManagerProps {
  className?: string;
}

const AdminRoleManager: React.FC<AdminRoleManagerProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Fetch data
  const { data: rolesData, isLoading: rolesLoading } = useApi('/admin/roles');
  const { data: usersData, isLoading: usersLoading } = useApi('/admin/users');

  useEffect(() => {
    if (rolesData) {
      setRoles(rolesData);
    }
  }, [rolesData]);

  useEffect(() => {
    if (usersData) {
      setAdminUsers(usersData);
    }
  }, [usersData]);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: AdminRole) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (role: AdminRole) => {
    if (role.userCount > 0) {
      showToast('لا يمكن حذف دور يحتوي على مستخدمين', 'error');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف دور "${role.displayName}"؟`)) {
      try {
        const response = await fetch(`/api/admin/roles/${role._id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          showToast('تم حذف الدور بنجاح', 'success');
          // Refresh roles
          window.location.reload();
        } else {
          showToast('خطأ في حذف الدور', 'error');
        }
      } catch (error) {
        showToast('خطأ في حذف الدور', 'error');
      }
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (adminUser: AdminUser) => {
    setSelectedUser(adminUser);
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (adminUser: AdminUser) => {
    try {
      const response = await fetch(`/api/admin/users/${adminUser._id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !adminUser.isActive })
      });

      if (response.ok) {
        showToast(
          `تم ${adminUser.isActive ? 'إيقاف' : 'تفعيل'} المستخدم بنجاح`, 
          'success'
        );
        // Refresh users
        window.location.reload();
      } else {
        showToast('خطأ في تحديث حالة المستخدم', 'error');
      }
    } catch (error) {
      showToast('خطأ في تحديث حالة المستخدم', 'error');
    }
  };

  const filteredRoles = roles.filter(role => 
    role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = adminUsers.filter(adminUser => 
    `${adminUser.name.first} ${adminUser.name.last}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adminUser.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adminUser.role.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (roleLevel: number) => {
    switch (roleLevel) {
      case 1: return <Shield className="w-5 h-5 text-red-600" />;
      case 2: return <Users className="w-5 h-5 text-blue-600" />;
      case 3: return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 4: return <FileText className="w-5 h-5 text-purple-600" />;
      default: return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleColor = (roleLevel: number) => {
    switch (roleLevel) {
      case 1: return 'text-red-600 bg-red-50';
      case 2: return 'text-blue-600 bg-blue-50';
      case 3: return 'text-green-600 bg-green-50';
      case 4: return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (rolesLoading || usersLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل إدارة الأدوار...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-deep-teal">إدارة الأدوار والصلاحيات</h1>
            <p className="text-gray-600">إدارة أدوار المديرين والصلاحيات في النظام</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateRole}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إنشاء دور جديد
            </Button>
            <Button
              onClick={handleCreateUser}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              إضافة مدير
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-deep-teal text-deep-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            الأدوار والصلاحيات
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-deep-teal text-deep-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            المديرون
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <FormInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={activeTab === 'roles' ? 'البحث في الأدوار...' : 'البحث في المديرين...'}
                className="pr-10"
              />
            </div>
          </div>
          <FormSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: 'all', label: 'جميع الفئات' },
              { value: 'user_management', label: 'إدارة المستخدمين' },
              { value: 'system_settings', label: 'إعدادات النظام' },
              { value: 'reports_analytics', label: 'التقارير والتحليلات' },
              { value: 'verifications', label: 'التحقق' },
              { value: 'content_management', label: 'إدارة المحتوى' },
              { value: 'payments', label: 'المدفوعات' },
              { value: 'notifications', label: 'الإشعارات' },
              { value: 'disputes', label: 'النزاعات' }
            ]}
            placeholder="فلتر حسب الفئة"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'roles' ? (
        /* Roles Tab */
        <div className="space-y-4">
          {filteredRoles.map((role) => (
            <div key={role._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getRoleIcon(role.level)}
                  <div>
                    <h3 className="text-lg font-semibold text-deep-teal">
                      {role.displayName}
                    </h3>
                    <p className="text-gray-600">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="primary" 
                    className={`text-sm ${getRoleColor(role.level)}`}
                  >
                    المستوى {role.level}
                  </Badge>
                  {role.isActive ? (
                    <Badge variant="success" className="text-sm">نشط</Badge>
                  ) : (
                    <Badge variant="error" className="text-sm">غير نشط</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الصلاحيات:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((permission) => {
                      const perm = PERMISSIONS.find(p => p.id === permission);
                      return perm ? (
                        <Badge 
                          key={permission} 
                          variant={perm.isDangerous ? "error" : "info"} 
                          className="text-xs"
                        >
                          {perm.name}
                        </Badge>
                      ) : null;
                    })}
                    {role.permissions.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 5} أكثر
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الإحصائيات:</h4>
                  <div className="text-sm text-gray-600">
                    <div>عدد المستخدمين: {role.userCount}</div>
                    <div>تاريخ الإنشاء: {new Date(role.createdAt).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditRole(role)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    تعديل
                  </Button>
                  {role.userCount === 0 && (
                    <Button
                      onClick={() => handleDeleteRole(role)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  آخر تحديث: {new Date(role.updatedAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Users Tab */
        <div className="space-y-4">
          {filteredUsers.map((adminUser) => (
            <div key={adminUser._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {adminUser.avatarUrl ? (
                      <img 
                        src={adminUser.avatarUrl} 
                        alt={`${adminUser.name.first} ${adminUser.name.last}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-deep-teal">
                      {adminUser.name.first} {adminUser.name.last}
                    </h3>
                    <p className="text-gray-600">{adminUser.email}</p>
                    <p className="text-sm text-gray-500">{adminUser.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="primary" 
                    className={`text-sm ${getRoleColor(adminUser.role.level)}`}
                  >
                    {adminUser.role.displayName}
                  </Badge>
                  {adminUser.isActive ? (
                    <Badge variant="success" className="text-sm">نشط</Badge>
                  ) : (
                    <Badge variant="error" className="text-sm">موقوف</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">آخر تسجيل دخول:</h4>
                  <div className="text-sm text-gray-600">
                    {new Date(adminUser.lastLogin).toLocaleDateString('ar-EG')}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">تاريخ الإنشاء:</h4>
                  <div className="text-sm text-gray-600">
                    {new Date(adminUser.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الصلاحيات:</h4>
                  <div className="text-sm text-gray-600">
                    {adminUser.permissions.length} صلاحية
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditUser(adminUser)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    تعديل
                  </Button>
                  <Button
                    onClick={() => handleToggleUserStatus(adminUser)}
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 ${
                      adminUser.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {adminUser.isActive ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        إيقاف
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        تفعيل
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Modal would be implemented here */}
      {/* User Modal would be implemented here */}
    </div>
  );
};

export default AdminRoleManager; 
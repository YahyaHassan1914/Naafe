import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Clock, DollarSign, Star, Award, Briefcase, Image, 
  Settings, Plus, Edit, Trash2, CheckCircle, TrendingUp, BarChart3,
  Calendar, MessageCircle, Shield, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface ProviderStats {
  totalEarnings: number;
  monthlyEarnings: number;
  completedJobs: number;
  activeJobs: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  completionRate: number;
  verificationLevel: 'pending' | 'basic' | 'verified' | 'premium';
  memberSince: Date;
  lastActive: Date;
}

interface Skill {
  _id: string;
  name: string;
  category: string;
  subcategory: string;
  experience: number;
  isActive: boolean;
  hourlyRate: number;
  totalJobs: number;
  averageRating: number;
}

interface EnhancedProviderDashboardProps {
  className?: string;
}

const EnhancedProviderDashboard: React.FC<EnhancedProviderDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'portfolio' | 'availability' | 'earnings' | 'settings'>('overview');
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch provider data
  const { data: statsData } = useApi('/provider/stats');
  const { data: skillsData } = useApi('/provider/skills');

  useEffect(() => {
    if (statsData) setProviderStats(statsData);
    if (skillsData) setSkills(skillsData);
  }, [statsData, skillsData]);

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'premium': return <Award className="w-5 h-5 text-yellow-600" />;
      case 'verified': return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'basic': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-600" />;
      default: return <UserCheck className="w-5 h-5 text-red-600" />;
    }
  };

  const getVerificationLabel = (level: string) => {
    switch (level) {
      case 'premium': return 'مستوى متميز';
      case 'verified': return 'موثق';
      case 'basic': return 'أساسي';
      case 'pending': return 'قيد المراجعة';
      default: return 'غير موثق';
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'premium': return 'text-yellow-600 bg-yellow-50';
      case 'verified': return 'text-green-600 bg-green-50';
      case 'basic': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const handleAddSkill = async () => {
    try {
      const response = await fetch('/api/provider/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: 'مهارة جديدة',
          category: 'عام',
          subcategory: 'عام',
          experience: 1,
          hourlyRate: 50
        })
      });

      if (response.ok) {
        const newSkill = await response.json();
        setSkills(prev => [...prev, newSkill]);
        showToast('تم إضافة المهارة بنجاح', 'success');
      }
    } catch (error) {
      showToast('خطأ في إضافة المهارة', 'error');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-deep-teal rounded-full flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-deep-teal">لوحة تحكم المقدم</h1>
              <p className="text-gray-600">إدارة مهاراتك وأعمالك وأرباحك</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {providerStats && (
              <div className="flex items-center gap-2">
                {getVerificationIcon(providerStats.verificationLevel)}
                <Badge 
                  variant="primary" 
                  className={`${getVerificationColor(providerStats.verificationLevel)}`}
                >
                  {getVerificationLabel(providerStats.verificationLevel)}
                </Badge>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? 'عرض' : 'تعديل'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {providerStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-900">
                {providerStats.totalEarnings.toLocaleString()} ج.م
              </div>
              <div className="text-xs text-green-700">إجمالي الأرباح</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-900">{providerStats.completedJobs}</div>
              <div className="text-xs text-blue-700">الوظائف المكتملة</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-yellow-900">{providerStats.averageRating.toFixed(1)}</div>
              <div className="text-xs text-yellow-700">متوسط التقييم</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-900">{providerStats.totalReviews}</div>
              <div className="text-xs text-purple-700">التقييمات</div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-indigo-900">{providerStats.responseRate}%</div>
              <div className="text-xs text-indigo-700">معدل الاستجابة</div>
            </div>
            
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-teal-900">{providerStats.completionRate}%</div>
              <div className="text-xs text-teal-700">معدل الإنجاز</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-orange-900">
                {providerStats.monthlyEarnings.toLocaleString()} ج.م
              </div>
              <div className="text-xs text-orange-700">أرباح الشهر</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <Briefcase className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-red-900">{providerStats.activeJobs}</div>
              <div className="text-xs text-red-700">الوظائف النشطة</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { id: 'skills', label: 'المهارات', icon: Award },
              { id: 'portfolio', label: 'معرض الأعمال', icon: Image },
              { id: 'availability', label: 'التوفر', icon: Calendar },
              { id: 'earnings', label: 'الأرباح', icon: DollarSign },
              { id: 'settings', label: 'الإعدادات', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
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

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-deep-teal mb-4">النشاط الأخير</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">تم إكمال وظيفة السباكة</p>
                        <p className="text-sm text-gray-500">منذ ساعتين</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-semibold text-green-600">+150 ج.م</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">تقييم جديد 5 نجوم</p>
                        <p className="text-sm text-gray-500">منذ 3 ساعات</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">طلب جديد للكهرباء</p>
                        <p className="text-sm text-gray-500">منذ 5 ساعات</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-deep-teal mb-4">أداء الشهر</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">الوظائف المكتملة</span>
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">متوسط التقييم</span>
                      <span className="font-semibold">4.8</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">معدل الاستجابة</span>
                      <span className="font-semibold">95%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-deep-teal">إدارة المهارات</h3>
                <Button onClick={handleAddSkill} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة مهارة
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <div key={skill._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                      <Badge variant={skill.isActive ? 'success' : 'secondary'}>
                        {skill.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>الفئة: {skill.category} - {skill.subcategory}</p>
                      <p>الخبرة: {skill.experience} سنوات</p>
                      <p>السعر: {skill.hourlyRate} ج.م/ساعة</p>
                      <p>الوظائف: {skill.totalJobs}</p>
                      <p>التقييم: {skill.averageRating.toFixed(1)} ⭐</p>
                    </div>
                    
                    {isEditing && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          تعديل
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {activeTab === 'portfolio' && (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">معرض الأعمال</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">جدول التوفر</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">تتبع الأرباح</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">إعدادات الحساب</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProviderDashboard; 
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Clock, MessageSquare, FileText, 
  User, Calendar, DollarSign, Star, Filter, Search, Download,
  Eye, Edit, Trash2, Send, Phone, Mail, Shield, Award,
  TrendingUp, TrendingDown, Users, Flag, Gavel, Scale,
  Archive, RefreshCw, Settings, Bell, CheckSquare, XSquare
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useApi } from '../../../hooks/useApi';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

interface Dispute {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'payment' | 'service_quality' | 'communication' | 'cancellation' | 'other';
  createdAt: string;
  updatedAt: string;
  seeker: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  provider: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  serviceRequest: {
    id: string;
    title: string;
    amount: number;
  };
  evidence: {
    images: string[];
    documents: string[];
    messages: Array<{
      id: string;
      sender: string;
      content: string;
      timestamp: string;
    }>;
  };
  adminNotes: string;
  resolution: string;
  assignedTo: string;
}

interface DisputeResolutionCenterProps {
  className?: string;
}

const DisputeResolutionCenter: React.FC<DisputeResolutionCenterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'queue' | 'review' | 'resolved' | 'analytics'>('queue');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    assignedTo: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisputeDetails, setShowDisputeDetails] = useState(false);

  const { data: disputesData, isLoading: disputesLoading, refetch } = useApi('/admin/disputes');

  useEffect(() => {
    if (disputesData) {
      setDisputes(disputesData);
    }
  }, [disputesData]);

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.seeker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || dispute.status === filters.status;
    const matchesPriority = filters.priority === 'all' || dispute.priority === filters.priority;
    const matchesType = filters.type === 'all' || dispute.type === filters.type;
    const matchesAssigned = filters.assignedTo === 'all' || dispute.assignedTo === filters.assignedTo;

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssigned;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'under_review': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'closed': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'service_quality': return <Star className="w-4 h-4" />;
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'cancellation': return <XSquare className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const handleAssignDispute = async (disputeId: string, adminId: string) => {
    try {
      setIsLoading(true);
      await fetch(`/api/admin/disputes/${disputeId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: adminId })
      });
      
      showToast('تم تعيين النزاع بنجاح', 'success');
      refetch();
    } catch (error) {
      showToast('حدث خطأ أثناء تعيين النزاع', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, status: string) => {
    try {
      setIsLoading(true);
      await fetch(`/api/admin/disputes/${disputeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      showToast('تم تحديث حالة النزاع بنجاح', 'success');
      refetch();
    } catch (error) {
      showToast('حدث خطأ أثناء تحديث الحالة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (disputeId: string, note: string) => {
    try {
      setIsLoading(true);
      await fetch(`/api/admin/disputes/${disputeId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      
      showToast('تم إضافة الملاحظة بنجاح', 'success');
      refetch();
    } catch (error) {
      showToast('حدث خطأ أثناء إضافة الملاحظة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: string) => {
    try {
      setIsLoading(true);
      await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, status: 'resolved' })
      });
      
      showToast('تم حل النزاع بنجاح', 'success');
      refetch();
    } catch (error) {
      showToast('حدث خطأ أثناء حل النزاع', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDisputes = async () => {
    try {
      const response = await fetch('/api/admin/disputes/export', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disputes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      showToast('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    }
  };

  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'pending').length,
    underReview: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    escalated: disputes.filter(d => d.status === 'escalated').length,
    urgent: disputes.filter(d => d.priority === 'urgent').length
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">مركز حل النزاعات</h2>
            <p className="text-gray-600 mt-1">إدارة وحل النزاعات بين المستخدمين</p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              onClick={handleExportDisputes}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Download className="w-4 h-4" />
              <span>تصدير البيانات</span>
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي النزاعات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Flag className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">في الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">قيد المراجعة</p>
              <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">تم الحل</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">متصاعد</p>
              <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">عاجل</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <Bell className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 space-x-reverse px-6">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'queue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              قائمة الانتظار ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              قيد المراجعة ({stats.underReview})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resolved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              تم الحل ({stats.resolved})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              التحليلات
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'queue' && (
            <div className="text-center py-12">
              <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">قائمة الانتظار</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">قيد المراجعة</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}

          {activeTab === 'resolved' && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">تم الحل</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">التحليلات</h3>
              <p className="text-gray-600">قيد التطوير - ستتوفر قريباً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeResolutionCenter; 
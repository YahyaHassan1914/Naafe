import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Calendar, DollarSign, MapPin, Clock, ArrowLeft, MessageCircle, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import BaseCard from '../components/ui/BaseCard';
import PageLayout from '../components/layout/PageLayout';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  urgency: string;
  deadline?: string;
  timePosted: string;
  responses: number;
  status: string;
  postedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  location?: {
    address?: string;
    government?: string;
    city?: string;
  };
}

const RequestServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requests/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const requestData = data.data;
        setRequest({
          id: requestData._id,
          title: requestData.title,
          description: requestData.description,
          category: requestData.category,
          budget: requestData.budget || { min: 0, max: 0, currency: 'EGP' },
          urgency: requestData.urgency || 'medium',
          deadline: requestData.deadline,
          timePosted: requestData.createdAt || new Date().toISOString(),
          responses: requestData.offersCount || 0,
          status: requestData.status || 'open',
          postedBy: {
            id: requestData.seeker?._id || '',
            name: requestData.seeker?.name ? 
              `${requestData.seeker.name.first || ''} ${requestData.seeker.name.last || ''}`.trim() : 
              'مستخدم',
            avatar: requestData.seeker?.avatarUrl
          },
          location: requestData.location
        });
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForWork = () => {
    navigate(`/requests/${id}/respond`);
  };

  const handleContactSeeker = () => {
    navigate(`/chat/new?seeker=${request?.postedBy.id}`);
  };

  const formatBudget = () => {
    if (!request) return '';
    const { budget } = request;
    if (budget.min && budget.max && budget.min !== budget.max) {
      return `${budget.min.toLocaleString()} - ${budget.max.toLocaleString()} جنيه`;
    } else if (budget.min) {
      return `${budget.min.toLocaleString()} جنيه`;
    }
    return 'سعر متغير';
  };

  const formatTimePosted = () => {
    if (!request?.timePosted) return '';
    const date = new Date(request.timePosted);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ أقل من ساعة';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 48) return 'منذ يوم';
    if (diffInHours < 168) return `منذ ${Math.floor(diffInHours / 24)} أيام`;
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDeadline = () => {
    if (!request?.deadline) return 'غير محدد';
    const date = new Date(request.deadline);
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUrgencyColor = () => {
    switch (request?.urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getUrgencyText = () => {
    switch (request?.urgency) {
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      default: return 'عادي';
    }
  };

  const formatLocation = () => {
    if (!request?.location) return 'غير محدد';
    const { government, city, address } = request.location;
    const parts = [government, city, address].filter(Boolean);
    return parts.length > 0 ? parts.join('، ') : 'غير محدد';
  };

  if (loading) {
    return (
      <PageLayout title="تحميل..." user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!request) {
    return (
      <PageLayout title="خطأ" user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">الطلب غير موجود</h1>
          <Button onClick={() => navigate('/search')}>العودة للبحث</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${request.title} - نافع`} user={user}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
          >
            رجوع
          </Button>
        </div>

        {/* Request Header */}
        <BaseCard className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{request.title}</h1>
              <p className="text-gray-600 mb-3">{request.category}</p>
              
              {/* Urgency and Time Posted */}
              <div className="flex items-center gap-4 text-sm mb-3">
                <span className={`px-3 py-1 rounded-full font-medium ${getUrgencyColor()}`}>
                  {getUrgencyText()}
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimePosted()}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <User className="w-4 h-4" />
                  <span>{request.responses} رد</span>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-600">{formatBudget()}</span>
              </div>
            </div>

            {/* Client Info */}
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={request.postedBy.avatar || '/default-avatar.png'}
                  alt={request.postedBy.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="font-medium text-gray-800">{request.postedBy.name}</p>
                  <p className="text-sm text-gray-500">صاحب الطلب</p>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Description */}
        <BaseCard className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">تفاصيل الطلب</h2>
          <p className="text-gray-600 leading-relaxed">{request.description}</p>
        </BaseCard>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Location */}
          <BaseCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">الموقع</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{formatLocation()}</span>
            </div>
          </BaseCard>

          {/* Deadline */}
          <BaseCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">الموعد النهائي</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDeadline()}</span>
            </div>
          </BaseCard>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleApplyForWork}
            className="flex-1"
          >
            تقدم للعمل
          </Button>
          <Button
            variant="outline"
            leftIcon={<MessageCircle className="w-4 h-4" />}
            onClick={handleContactSeeker}
            className="flex-1"
          >
            تواصل مع صاحب الطلب
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default RequestServiceDetailsPage; 
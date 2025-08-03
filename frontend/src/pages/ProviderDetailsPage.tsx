import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, CheckCircle, Clock, DollarSign, Calendar, MessageCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import BaseCard from '../components/ui/BaseCard';
import PageLayout from '../components/layout/PageLayout';

interface Provider {
  id: string;
  name: string;
  avatar?: string;
  category: string;
  description?: string;
  rating: number;
  completedJobs: number;
  isVerified: boolean;
  budgetMin: number;
  budgetMax: number;
  availability?: {
    days: string[];
    timeSlots: string[];
  };
  phone?: string;
  memberSince: string;
}

const ProviderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchProviderDetails();
  }, [id]);

  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch provider user data
      const userResponse = await fetch(`/api/users/${id}`);
      const userData = await userResponse.json();
      
      if (userData.success) {
        const user = userData.data.user;
        
        // Fetch provider's listings for pricing info
        const listingsResponse = await fetch(`/api/users/${id}/listings`);
        const listingsData = await listingsResponse.json();
        
        let budgetMin = 0;
        let budgetMax = 0;
        
        if (listingsData.success && listingsData.data.listings.length > 0) {
          // Calculate average pricing from listings
          const prices = listingsData.data.listings
            .filter((listing: any) => listing.budget?.min && listing.budget?.max)
            .map((listing: any) => ({ min: listing.budget.min, max: listing.budget.max }));
          
          if (prices.length > 0) {
            budgetMin = Math.min(...prices.map((p: any) => p.min));
            budgetMax = Math.max(...prices.map((p: any) => p.max));
          }
        }
        
        setProvider({
          id: user._id,
          name: user.name ? 
            `${user.name.first || ''} ${user.name.last || ''}`.trim() : 
            'مزود خدمة',
          avatar: user.avatarUrl,
          category: user.providerProfile?.skills?.[0] || 'خدمة عامة',
          description: user.profile?.bio || '',
          rating: user.providerProfile?.rating || 0,
          completedJobs: user.providerProfile?.totalJobsCompleted || 0,
          isVerified: user.isVerified || false,
          budgetMin,
          budgetMax,
          availability: {
            days: user.providerProfile?.workingDays || [],
            timeSlots: []
          },
          phone: user.phone,
          memberSince: user.createdAt || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate(`/booking/${id}`);
  };

  const handleContactProvider = () => {
    navigate(`/chat/new?provider=${id}`);
  };

  const formatPricing = () => {
    if (!provider) return '';
    const { budgetMin, budgetMax } = provider;
    if (budgetMin && budgetMax && budgetMin !== budgetMax) {
      return `${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} جنيه`;
    } else if (budgetMin) {
      return `${budgetMin.toLocaleString()} جنيه`;
    }
    return 'سعر متغير';
  };

  const formatAvailability = () => {
    if (!provider?.availability?.days?.length) return 'متاح حسب الطلب';
    
    const dayNames: Record<string, string> = {
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
      saturday: 'السبت'
    };

    const formattedDays = provider.availability.days
      .map(day => dayNames[day] || day)
      .slice(0, 3);

    return `${formattedDays.join('، ')}`;
  };

  const formatMemberSince = () => {
    if (!provider?.memberSince) return '';
    const date = new Date(provider.memberSince);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
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

  if (!provider) {
    return (
      <PageLayout title="خطأ" user={user}>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">المحترف غير موجود</h1>
          <Button onClick={() => navigate('/search')}>العودة للبحث</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${provider.name} - نافع`} user={user}>
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

        {/* Provider Info Card */}
        <BaseCard className="mb-6">
          <div className="flex items-start gap-6">
            <img
              src={provider.avatar || '/default-avatar.png'}
              alt={provider.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{provider.name}</h1>
                {provider.isVerified && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>
              <p className="text-gray-600 mb-3">{provider.category}</p>
              
              {/* Rating and Experience */}
              <div className="flex items-center gap-4 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{provider.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({provider.completedJobs} مهمة مكتملة)</span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">عضو منذ {formatMemberSince()}</span>
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-600">{formatPricing()}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Description */}
        {provider.description && (
          <BaseCard className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">نبذة عن المحترف</h2>
            <p className="text-gray-600 leading-relaxed">{provider.description}</p>
          </BaseCard>
        )}

        {/* Availability */}
        <BaseCard className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">التوفر</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatAvailability()}</span>
          </div>
        </BaseCard>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={handleBookAppointment}
            className="flex-1"
          >
            حجز موعد
          </Button>
          <Button
            variant="outline"
            leftIcon={<MessageCircle className="w-4 h-4" />}
            onClick={handleContactProvider}
            className="flex-1"
          >
            تواصل مع المحترف
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProviderDetailsPage; 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ProviderCard, RequestCard } from '../components/ui/cards';
import Button from '../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, FileText } from 'lucide-react';

// Simplified data fetching - only fetch what's relevant
const fetchRelevantData = async (userRole: string, searchQuery: string, category?: string) => {
  const params = new URLSearchParams();
  if (searchQuery) params.set('search', searchQuery);
  if (category) params.set('category', category);
  params.set('limit', '20');
  
  if (userRole === 'provider') {
    // Providers only see service requests
    params.set('sort', 'recent');
    params.set('status', 'open');
    
    const res = await fetch(`/api/requests?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'فشل تحميل الطلبات');
    return { type: 'requests', data: json.data.requests || [] };
  } else {
    // Seekers only see providers
    params.set('sort', 'rating');
    
    const res = await fetch(`/api/listings?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'فشل تحميل الخدمات');
    return { type: 'providers', data: json.data.listings || [] };
  }
};

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Determine user role and what they should see
  const userRole = user?.roles?.includes('provider') ? 'provider' : 'seeker';
  const isProvider = userRole === 'provider';
  
  // Get initial search from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setSearchQuery(urlParams.get('query') || '');
    setSelectedCategory(urlParams.get('category') || '');
  }, [location.search]);

  // Fetch only relevant data
  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['search', userRole, searchQuery, selectedCategory],
    queryFn: () => fetchRelevantData(userRole, searchQuery, selectedCategory),
    staleTime: 5 * 60 * 1000,
  });

  // Process data based on type
  const processedData = searchResult?.data?.map((item: any) => {
    if (searchResult.type === 'providers') {
      return {
        id: item._id,
        providerId: item.provider?._id || '',
        name: item.provider?.name ? 
          `${item.provider.name.first || ''} ${item.provider.name.last || ''}`.trim() : 
          'مزود خدمة',
        category: item.category,
        description: item.description,
        budgetMin: item.budget?.min || 0,
        budgetMax: item.budget?.max || 0,
        rating: item.provider?.providerProfile?.rating || 0,
        completedJobs: item.provider?.providerProfile?.completedJobs || 0,
        isVerified: item.provider?.isVerified || false,
        imageUrl: item.provider?.avatarUrl || '',
        availability: item.availability || { days: [], timeSlots: [] },
      };
    } else {
      return {
        id: item._id,
        title: item.title,
        description: item.description,
        budget: item.budget || { min: 0, max: 0, currency: 'EGP' },
        category: item.category,
        postedBy: {
          id: item.seeker?._id || '',
          name: item.seeker?.name ? 
            `${item.seeker.name.first || ''} ${item.seeker.name.last || ''}`.trim() : 
            'مستخدم',
          avatar: item.seeker?.avatarUrl || '',
        },
        timePosted: item.createdAt || new Date().toISOString(),
        responses: item.offersCount || 0,
        urgency: item.urgency || 'medium',
        status: item.status || 'open',
      };
    }
  }) || [];

  // Popular categories based on user role
  const popularCategories = isProvider 
    ? ['سباكة', 'كهرباء', 'نجارة', 'نقاشة', 'تنظيف', 'تكييفات', 'صيانة أجهزة', 'نقل عفش']
    : ['سباكة', 'كهرباء', 'نجارة', 'نقاشة', 'تنظيف', 'تكييفات', 'صيانة أجهزة', 'نقل عفش', 'توصيل', 'دروس خصوصية'];

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    params.set('category', category);
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  // Handle actions - simplified based on role
  const handleViewDetails = (itemId: string) => {
    if (isProvider) {
      navigate(`/requests/${itemId}`);
    } else {
      navigate(`/provider/${itemId}`);
    }
  };

  const handlePrimaryAction = (itemId: string) => {
    if (isProvider) {
      // Provider applies to request
      navigate(`/requests/${itemId}/respond`);
    } else {
      // Seeker books appointment with provider
      navigate(`/booking/${itemId}`);
    }
  };

  // Render search interface
  const renderSearchInterface = () => (
    <div className="max-w-4xl mx-auto">
      {/* Role-based header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-deep-teal mb-2">
          {isProvider ? 'ابحث عن طلبات العمل' : 'ابحث عن المحترفين'}
        </h1>
        <p className="text-gray-600">
          {isProvider 
            ? 'شوف الطلبات المتاحة في مجالك وتقدم للعمل'
            : 'اعرف المحترفين المتاحين واحجز معاهم'
          }
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={
              isProvider 
                ? "ابحث عن طلبات في مجالك..."
                : "محتاج سباك؟ نجار؟ حد ينضف؟ اكتب اللي محتاجه هنا..."
            }
            className="w-full pl-4 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-deep-teal focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Popular Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {isProvider ? 'فئات العمل' : 'خدمات شائعة'}
        </h3>
        <div className="flex flex-wrap gap-3">
          {popularCategories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-deep-teal text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Render results
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isProvider ? 'جاري البحث عن الطلبات...' : 'جاري البحث عن المحترفين...'}
          </p>
        </div>
      );
    }

    if (processedData.length === 0 && (searchQuery || selectedCategory)) {
      return (
        <div className="text-center py-12">
          {isProvider ? (
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          ) : (
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          )}
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {isProvider ? 'مفيش طلبات متاحة' : 'مفيش محترفين متاحين'}
          </h3>
          <p className="text-gray-600 mb-6">جرب تعديل البحث أو اختر فئة مختلفة</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
            }}
          >
            مسح البحث
          </Button>
        </div>
      );
    }

    if (isProvider) {
      // Show request cards for providers
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedData.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApply={handlePrimaryAction}
              onViewDetails={handleViewDetails}
              alreadyApplied={false}
            />
          ))}
        </div>
      );
    } else {
      // Show provider cards for seekers
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedData.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onViewDetails={() => handleViewDetails(provider.providerId || provider.id)}
              onCheckAvailability={() => handlePrimaryAction(provider.providerId || provider.id)}
            />
          ))}
        </div>
      );
    }
  };

  // Render default state
  const renderDefaultState = () => {
    if (isProvider) {
      return (
        <div className="text-center py-16">
          <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            ابحث عن طلبات العمل
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            اختر فئة أو اكتب ما تبحث عنه لرؤية طلبات الخدمات المتاحة في مجالك
          </p>
        </div>
      );
    } else {
      return (
        <div className="text-center py-16">
          <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            ابحث عن المحترف المناسب
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            اختر فئة أو اكتب ما تحتاجه لرؤية المحترفين المتاحين
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate('/request-service')}
            >
              نشر طلب جديد
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/categories')}
            >
              تصفح الفئات
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <PageLayout
      title={isProvider ? 'طلبات العمل' : 'البحث عن المحترفين'}
      subtitle={
        isProvider 
          ? 'ابحث عن طلبات في مجالك'
          : 'ابحث عن المحترف المناسب'
      }
      user={user}
    >
      <div className="max-w-6xl mx-auto px-4">
        {renderSearchInterface()}
        
        {/* Results Section */}
        <div className="mb-8">
          {((searchQuery || selectedCategory) || processedData.length > 0) ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {isProvider 
                    ? `طلبات العمل (${processedData.length})`
                    : `المحترفين المتاحين (${processedData.length})`
                  }
                </h2>
                {(searchQuery || selectedCategory) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('');
                      navigate('/search', { replace: true });
                    }}
                  >
                    مسح البحث
                  </Button>
                )}
              </div>
              {renderResults()}
            </>
          ) : (
            renderDefaultState()
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SearchPage; 
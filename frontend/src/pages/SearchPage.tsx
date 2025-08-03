import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import ServiceCard from '../components/ServiceCard';
import ServiceRequestCard from '../components/ServiceRequestCard';
import Button from '../components/ui/Button';
import BaseCard from '../components/ui/BaseCard';
import { useQuery } from '@tanstack/react-query';
import { FilterState } from '../types';
import { useUrlParams } from '../hooks/useUrlParams';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, FileText, MapPin, DollarSign, Star, Clock, Eye, Plus } from 'lucide-react';

// Smart data fetching functions with defaults
const fetchListings = async (searchQuery: string, category?: string) => {
  const params = new URLSearchParams();
  if (searchQuery) params.set('search', searchQuery);
  if (category) params.set('category', category);
  
  // Add smart defaults for better UX
  params.set('limit', '20'); // Limit results to avoid overwhelming
  params.set('sort', 'rating'); // Show best providers first
  
  const res = await fetch(`/api/listings/listings?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'فشل تحميل الخدمات');
  return json.data.listings || json.data.items || [];
};

const fetchRequests = async (searchQuery: string, category?: string, userSkills?: string[]) => {
  const params = new URLSearchParams();
  if (searchQuery) params.set('search', searchQuery);
  if (category) params.set('category', category);
  
  // Add smart defaults for better UX
  params.set('limit', '20'); // Limit results to avoid overwhelming
  params.set('sort', 'recent'); // Show recent requests first
  params.set('status', 'open'); // Only show open requests
  
  // For providers, filter by their skills if no specific category selected
  if (!category && userSkills && userSkills.length > 0) {
    userSkills.forEach(skill => params.append('skills', skill));
  }
  
  const res = await fetch(`/api/requests?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'فشل تحميل الطلبات');
  return json.data.requests || json.data.jobRequests || json.data.items || [];
};

type UserIntent = 'need-service' | 'want-work';

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getFiltersFromUrl } = useUrlParams();
  
  // Smart state management with role-based defaults
  const [searchQuery, setSearchQuery] = useState('');
  const [userIntent, setUserIntent] = useState<UserIntent>(() => {
    // Set default based on user role
    if (user?.roles?.includes('provider')) return 'want-work';
    return 'need-service';
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Get initial search query from URL with smart defaults
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('query') || '';
    const category = urlParams.get('category') || '';
    const intent = urlParams.get('intent') as UserIntent;
    
    setSearchQuery(query);
    setSelectedCategory(category);
    
    // Only override intent if explicitly provided in URL
    if (intent) {
      setUserIntent(intent);
    } else {
      // Use role-based default
      const defaultIntent = user?.roles?.includes('provider') ? 'want-work' : 'need-service';
      setUserIntent(defaultIntent);
    }
  }, [location.search, user?.roles]);

  // Fetch data based on search with smart defaults
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['providers', searchQuery, selectedCategory, userIntent],
    queryFn: () => fetchListings(searchQuery, selectedCategory),
    enabled: userIntent === 'need-service',
    // Always fetch for seekers - show relevant results even without search
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['requests', searchQuery, selectedCategory, userIntent, user?.providerProfile?.skills],
    queryFn: () => fetchRequests(searchQuery, selectedCategory, user?.providerProfile?.skills),
    enabled: userIntent === 'want-work',
    // Always fetch for providers - show relevant requests even without search
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process providers data
  const processedProviders = providers.map((listing: any) => ({
    id: listing._id,
    providerId: listing.provider?._id || '',
    name: listing.provider?.name ? 
      `${listing.provider.name.first || ''} ${listing.provider.name.last || ''}`.trim() : 
      'مزود خدمة',
    category: listing.category,
    description: listing.description,
    title: listing.title,
    location: listing.location ? 
      `${listing.location.government || ''} ${listing.location.city || ''}`.trim() : 
      'غير محدد',
    budgetMin: listing.budget?.min || 0,
    budgetMax: listing.budget?.max || 0,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    completionRate: 0,
    skills: listing.provider?.providerProfile?.skills || [],
    imageUrl: listing.provider?.avatarUrl || '',
    isPremium: listing.provider?.isPremium || false,
    isTopRated: listing.provider?.isTopRated || false,
    isVerified: listing.provider?.isVerified || false,
    memberSince: listing.provider?.createdAt || '',
    availability: listing.availability || { days: [], timeSlots: [] },
    providerUpgradeStatus: 'none' as const
  }));

  // Process requests data
  const processedRequests = requests.map((request: any) => ({
    id: request._id,
    title: request.title,
    description: request.description,
    budget: request.budget || { min: 0, max: 0, currency: 'EGP' },
    location: request.location?.address || 'غير محدد',
    category: request.category,
    postedBy: {
      id: request.seeker?._id || '',
      name: request.seeker?.name ? 
        `${request.seeker.name.first || ''} ${request.seeker.name.last || ''}`.trim() : 
        'مستخدم',
      avatar: request.seeker?.avatarUrl || '',
      isPremium: request.seeker?.isPremium || false,
    },
    timePosted: request.createdAt || new Date().toISOString(),
    createdAt: request.createdAt || new Date().toISOString(),
    responses: request.offersCount || 0,
    urgency: request.urgency || 'medium',
    deadline: request.deadline || '',
    requiredSkills: request.requiredSkills || [],
    status: request.status || 'open',
    availability: request.availability || { days: [], timeSlots: [] },
  }));

  // Popular categories for quick access
  const popularCategories = [
    'سباكة', 'كهرباء', 'نجارة', 'نقاشة', 'تنظيف', 'تكييفات',
    'صيانة أجهزة', 'نقل عفش', 'توصيل', 'دروس خصوصية'
  ];

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Update URL
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

  // Handle provider selection
  const handleViewProvider = (providerId: string) => {
    navigate(`/provider/${providerId}`);
  };

  // Handle request selection
  const handleViewRequest = (requestId: string) => {
    navigate(`/requests/${requestId}`);
  };

  const handleApplyToRequest = (requestId: string) => {
    navigate(`/requests/${requestId}/respond`);
  };

  // Render search interface
  const renderSearchInterface = () => (
    <div className="max-w-4xl mx-auto">
      {/* Intent Toggle */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl p-2 shadow-sm border">
          <div className="flex">
            <button
              onClick={() => setUserIntent('need-service')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all ${
                userIntent === 'need-service'
                  ? 'bg-deep-teal text-white shadow-md'
                  : 'text-gray-600 hover:text-deep-teal'
              }`}
            >
              <Users className="w-5 h-5" />
              محتاج حد يشتغللي
            </button>
            <button
              onClick={() => setUserIntent('want-work')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-medium transition-all ${
                userIntent === 'want-work'
                  ? 'bg-deep-teal text-white shadow-md'
                  : 'text-gray-600 hover:text-deep-teal'
              }`}
            >
              <FileText className="w-5 h-5" />
              عايز أشغل
            </button>
          </div>
        </div>
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
              userIntent === 'need-service' 
                ? "محتاج سباك؟ نجار؟ حد ينضف؟ اكتب اللي محتاجه هنا..."
                : "ابحث عن طلبات في مجالك..."
            }
            className="w-full pl-4 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-deep-teal focus:outline-none transition-colors"
          />
        </div>
      </div>

             {/* Popular Categories - Only show for seekers or when provider wants to browse */}
       {(userIntent === 'need-service' || (userIntent === 'want-work' && !user?.providerProfile?.skills)) && (
         <div className="mb-8">
           <h3 className="text-lg font-semibold text-gray-700 mb-4">
             {userIntent === 'need-service' ? 'خدمات شائعة' : 'فئات الخدمات'}
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
       )}
    </div>
  );

  // Render results
  const renderResults = () => {
    if (userIntent === 'need-service') {
      if (providersLoading) {
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
            <p className="text-gray-600">جاري البحث عن المحترفين...</p>
          </div>
        );
      }

      if (processedProviders.length === 0 && (searchQuery || selectedCategory)) {
        return (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">مفيش محترفين متاحين</h3>
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

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedProviders.map((provider) => (
            <ServiceCard
              key={provider.id}
              provider={provider}
              onViewDetails={() => handleViewProvider(provider.providerId || provider.id)}
            />
          ))}
        </div>
      );
    } else {
      if (requestsLoading) {
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-teal mx-auto mb-4"></div>
            <p className="text-gray-600">جاري البحث عن الطلبات...</p>
          </div>
        );
      }

      if (processedRequests.length === 0 && (searchQuery || selectedCategory)) {
        return (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">مفيش طلبات متاحة</h3>
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

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedRequests.map((request) => (
            <ServiceRequestCard
              key={request.id}
              request={request}
              onInterested={handleApplyToRequest}
              onViewDetails={handleViewRequest}
              alreadyApplied={false}
            />
          ))}
        </div>
      );
    }
  };

  // Render smart default state
  const renderSmartDefaultState = () => {
    if (userIntent === 'need-service') {
      return (
        <div className="text-center py-16">
          <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            استكشف المحترفين المتاحين
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            اختر فئة أو اكتب ما تحتاجه لرؤية المحترفين المتاحين في مجالك
          </p>
          
          {/* Quick Actions */}
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
         } else {
       return (
         <div className="text-center py-16">
           <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
           <h2 className="text-2xl font-bold text-gray-700 mb-4">
             {user?.providerProfile?.skills ? 'طلبات العمل المتاحة لك' : 'ابحث عن فرص العمل'}
           </h2>
           <p className="text-gray-600 mb-8 max-w-md mx-auto">
             {user?.providerProfile?.skills 
               ? 'هنا الطلبات المتاحة في مجالك. يمكنك البحث عن طلبات محددة أو تصفح الفئات الأخرى.'
               : 'اختر فئة أو اكتب ما تبحث عنه لرؤية طلبات الخدمات المتاحة'
             }
           </p>
         </div>
       );
     }
  };

  return (
    <PageLayout
      title="البحث"
      subtitle={
        userIntent === 'need-service' 
          ? 'ابحث عن المحترف المناسب'
          : 'ابحث عن فرص العمل'
      }
      user={user}
    >
      <div className="max-w-6xl mx-auto px-4">
        {renderSearchInterface()}
        
                 {/* Results Section */}
         <div className="mb-8">
           {/* Show results even without search - smart defaults */}
           {((searchQuery || selectedCategory) || processedProviders.length > 0 || processedRequests.length > 0) ? (
             <>
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-800">
                   {userIntent === 'need-service' 
                     ? `المحترفين المتاحين (${processedProviders.length})`
                     : `طلبات الخدمات (${processedRequests.length})`
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
             renderSmartDefaultState()
           )}
         </div>
      </div>
    </PageLayout>
  );
};

export default SearchPage; 
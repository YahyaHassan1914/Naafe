import { useState, useEffect } from 'react';
import { Search, Menu, X, Bell, CheckCircle, MessageCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from './ui/Button';
import UserDropdown from './ui/UserDropdown';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../admin/components/UI/Modal';
import { FormInput } from './ui';
import { useSocket } from '../hooks/useSocket';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

// Define NotificationItem type locally
interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  relatedChatId?: string;
  isRead: boolean;
  createdAt: string;
}

const Header = ({ onSearch, searchValue = '' }: HeaderProps) => {
  const { user, logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // --- Notification state ---
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const { connected, on } = useSocket(accessToken || undefined);

  // Helper: check if user is provider
  const isProvider = user && user.roles.includes('provider');

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (!accessToken) return;
    fetch('/api/notifications?limit=10', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data.notifications)) {
          setNotifications(data.data.notifications);
        }
      });
  }, [accessToken, user]);

  // Listen for real-time notification events
  useEffect(() => {
    if (!connected) return;
    
    // Listen for offer accepted notifications
    const offOfferAccepted = on('notify:offerAccepted', (...args: unknown[]) => {
      const payload = args[0] as { notification: NotificationItem };
      if (payload && payload.notification) {
        setNotifications(prev => [payload.notification, ...prev].slice(0, 10));
      }
    });

    // Listen for offer received notifications
    const offOfferReceived = on('notify:offerReceived', (...args: unknown[]) => {
      const payload = args[0] as { notification: NotificationItem };
      if (payload && payload.notification) {
        setNotifications(prev => [payload.notification, ...prev].slice(0, 10));
      }
    });

    // Listen for new message notifications
    const offNewMessage = on('notify:newMessage', (...args: unknown[]) => {
      const payload = args[0] as { notification: NotificationItem };
      if (payload && payload.notification) {
        setNotifications(prev => [payload.notification, ...prev].slice(0, 10));
      }
    });

    return () => {
      offOfferAccepted?.();
      offOfferReceived?.();
      offNewMessage?.();
    };
  }, [connected, on]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        // Smart navigation based on current location
        const currentPath = location.pathname;
        if (currentPath.includes('/search/providers')) {
          // Already on providers search, maintain context
          navigate(`/search/providers?query=${encodeURIComponent(searchQuery.trim())}`);
        } else if (currentPath.includes('/search/service-requests')) {
          // Already on service requests search, maintain context
          navigate(`/search/service-requests?query=${encodeURIComponent(searchQuery.trim())}`);
        } else if (currentPath.includes('/categories')) {
          // On categories page, default to providers search
          navigate(`/search/providers?query=${encodeURIComponent(searchQuery.trim())}`);
        } else {
          // Default to providers search for other pages
          navigate(`/search/providers?query=${encodeURIComponent(searchQuery.trim())}`);
        }
      }
      setShowMobileSearch(false);
    }
  };

  const handleMobileSearchClick = () => {
    setShowMobileSearch(!showMobileSearch);
    setShowMobileMenu(false);
  };

  const handleMobileMenuClick = () => {
    setShowMobileMenu(!showMobileMenu);
    setShowMobileSearch(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  };

  // Navigation items: only show 'لوحة التحكم' for providers
  const navigationItems = [
    { label: 'الخدمات', href: '/categories' },
    ...(isProvider ? [
      { label: 'لوحة التحكم', href: '/provider-dashboard' }
    ] : []),
    { label: 'أعلن معنا', href: '/advertise' },
    { label: 'استكشف', href: '/search' },
  ];

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string, relatedChatId?: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
      }
      
      // Navigate to chat if relatedChatId is provided
      if (relatedChatId) {
        navigate(`/chat/${relatedChatId}`);
        setShowNotificationModal(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer_received':
        return MessageCircle;
      case 'offer_accepted':
        return CheckCircle;
      case 'new_message':
        return MessageCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'offer_received':
        return 'bg-blue-100 text-blue-600';
      case 'offer_accepted':
        return 'bg-green-100 text-green-600';
      case 'new_message':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-20">
            {/* Right Section - Logo and Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                aria-label="تبديل القائمة"
                onClick={handleMobileMenuClick}
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              
              {/* Logo */}
              <Link 
                to="/" 
                className="flex items-center gap-2 text-xl font-bold text-deep-teal hover:text-deep-teal/90 transition-colors duration-200 rounded-lg px-3 py-2 hover:bg-bright-orange/10 focus:outline-none focus:ring-2 focus:ring-deep-teal/50"
                onClick={closeMobileMenu}
              >
                <img 
                  src="/images/logo-no-bg.png" 
                  alt="شعار نافع" 
                  className="h-10 w-auto"
                />
                <span>نافع</span>
              </Link>
            </div>

            {/* Center Section - Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center gap-6">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <Link 
                      to={item.href} 
                      className={`font-medium transition-colors duration-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-teal/50
                        ${location.pathname === item.href ? 'text-deep-teal font-extrabold underline underline-offset-8 decoration-bright-orange decoration-4' : 'text-text-primary hover:text-deep-teal/90 hover:bg-bright-orange/10'}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link 
                    to="/request-service"
                    className={`font-medium transition-colors duration-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-teal/50
                      ${location.pathname === '/request-service' ? 'text-deep-teal font-extrabold underline underline-offset-8 decoration-bright-orange decoration-4' : 'text-text-primary hover:text-deep-teal/90 hover:bg-bright-orange/10'}`}
                  >
                    طلب خدمة
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Left Section - Search, Auth */}
            <div className="flex items-center gap-3">
              {/* Desktop Search */}
              <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                <FormInput
                  type="text"
                  placeholder="البحث عن الخدمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="البحث عن الخدمات"
                  variant="search"
                  className="min-w-[200px] pr-10"
                  icon={<Search className="h-4 w-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 search-icon" />}
                />
              </form>
              
              {/* Mobile Search Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-label="البحث عن الخدمات"
                onClick={handleMobileSearchClick}
              >
                <Search className="h-5 w-5 text-text-primary" />
              </Button>
              
              {/* Authentication Section */}
              <div className="flex items-center gap-2">
                {/* Notification Button */}
                <button
                  type="button"
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="الإشعارات"
                  onClick={() => setShowNotificationModal(true)}
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                  )}
                </button>
                {user ? (
                  <UserDropdown user={user} onLogout={logout} />
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/login')}
                      className="hidden sm:inline-flex"
                    >
                      تسجيل الدخول
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/register')}
                      className="hidden sm:inline-flex"
                    >
                      إنشاء حساب
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          {showMobileSearch && (
            <div className="pb-4 md:hidden">
              <form onSubmit={handleSearchSubmit} className="relative">
                <FormInput
                  type="text"
                  placeholder="البحث عن الخدمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="البحث عن الخدمات"
                  variant="search"
                  autoFocus
                  className="w-full pr-10"
                  icon={<Search className="h-4 w-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 search-icon" />}
                />
              </form>
            </div>
          )}

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="lg:hidden pb-4">
              <nav className="bg-white rounded-lg shadow-lg p-4">
                <ul className="flex flex-col gap-2">
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                      <Link 
                        to={item.href} 
                        className={`block font-medium transition-colors duration-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-teal/50
                          ${location.pathname === item.href ? 'text-deep-teal font-extrabold underline underline-offset-8 decoration-bright-orange decoration-4' : 'text-text-primary hover:text-deep-teal/90 hover:bg-bright-orange/10'}`}
                        onClick={closeMobileMenu}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2 border-t border-gray-200 space-y-2">
                    <Link 
                      to="/request-service"
                      className={`block font-medium transition-colors duration-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-teal/50
                        ${location.pathname === '/request-service' ? 'text-deep-teal font-extrabold underline underline-offset-8 decoration-bright-orange decoration-4' : 'text-text-primary hover:text-deep-teal/90 hover:bg-bright-orange/10'}`}
                      onClick={closeMobileMenu}
                    >
                      طلب خدمة
                    </Link>
                  </li>
                  {/* Mobile Auth Buttons */}
                  {!user && (
                    <li className="pt-2 border-t border-gray-200 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          navigate('/login');
                          closeMobileMenu();
                        }}
                      >
                        تسجيل الدخول
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          navigate('/register');
                          closeMobileMenu();
                        }}
                      >
                        إنشاء حساب
                      </Button>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Notification Modal */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title="الإشعارات"
        size="lg"
      >
        <div className="w-full">
          {/* Header Stats */}
          <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-soft-teal/10 to-deep-teal/5 rounded-xl border border-soft-teal/20">
            <div className="flex items-center gap-3">
              <div className="bg-deep-teal/10 p-2 rounded-full">
                <Bell className="w-5 h-5 text-deep-teal" />
              </div>
              <div>
                <span className="text-deep-teal font-semibold text-lg">
                  {notifications.filter(n => !n.isRead).length} إشعار جديد
                </span>
                <p className="text-text-secondary text-sm">
                  من أصل {notifications.length} إشعار إجمالي
                </p>
              </div>
            </div>
            {notifications.some(n => !n.isRead) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 border-deep-teal text-deep-teal hover:bg-deep-teal hover:text-white transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                تعليم الكل كمقروء
              </Button>
            )}
          </div>

          {/* Notification List */}
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">لا توجد إشعارات</h3>
                <p className="text-text-secondary">ستظهر الإشعارات الجديدة هنا</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                const iconColor = getNotificationColor(notif.type);
                return (
                  <div
                    key={notif._id}
                    className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border hover:shadow-md ${
                      !notif.isRead 
                        ? 'bg-gradient-to-r from-soft-teal/10 to-deep-teal/5 border-soft-teal/30 hover:border-soft-teal/50' 
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'
                    }`}
                    onClick={() => handleMarkAsRead(notif._id, notif.relatedChatId)}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColor} ring-2 ring-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`text-sm leading-relaxed mb-1 ${
                        !notif.isRead 
                          ? 'font-semibold text-deep-teal' 
                          : 'text-text-primary'
                      }`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {notif.relatedChatId && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleMarkAsRead(notif._id, notif.relatedChatId);
                        }}
                        className="opacity-80 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        دردشة
                      </Button>
                    )}
                    {!notif.isRead && (
                      <div className="w-2.5 h-2.5 bg-deep-teal rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowNotificationModal(false);
                  navigate('/notifications');
                }}
                className="flex items-center gap-2 text-deep-teal border-deep-teal hover:bg-deep-teal hover:text-white transition-all"
              >
                عرض جميع الإشعارات ({notifications.length})
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default Header;
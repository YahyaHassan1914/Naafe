import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import NotificationBell from '../ui/NotificationBell';
import UserDropdown from '../ui/UserDropdown';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { useUnreadNotificationCount } = useApi();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCountQuery = useUnreadNotificationCount();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getRoleBasedLinks = () => {
    if (!user) return [];

    const baseLinks = [
      { to: '/dashboard', label: 'الرئيسية', icon: '🏠' },
      { to: '/search', label: 'البحث', icon: '🔍' },
    ];

    if (user.role === 'seeker') {
      return [
        ...baseLinks,
        { to: '/my-requests', label: 'طلباتي', icon: '📋' },
        { to: '/hired-providers', label: 'المزودين المعينين', icon: '👥' },
      ];
    }

    if (user.role === 'provider') {
      return [
        ...baseLinks,
        { to: '/my-offers', label: 'عروضي', icon: '💼' },
        { to: '/earnings', label: 'أرباحي', icon: '💰' },
        { to: '/schedule', label: 'جدولي', icon: '📅' },
      ];
    }

    if (user.role === 'admin') {
      return [
        ...baseLinks,
        { to: '/admin/users', label: 'المستخدمين', icon: '👥' },
        { to: '/admin/verifications', label: 'التحققات', icon: '✅' },
        { to: '/admin/reports', label: 'التقارير', icon: '📊' },
      ];
    }

    return baseLinks;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
          : 'bg-white'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 space-x-reverse">
            <div className="text-2xl font-bold text-deep-teal">نافع</div>
            <div className="hidden sm:block text-sm text-text-secondary">
              منصة الخدمات المصرية
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
            {isAuthenticated && (
              <>
                {getRoleBasedLinks().map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActiveRoute(link.to)
                        ? 'text-deep-teal bg-teal-50'
                        : 'text-text-secondary hover:text-deep-teal hover:bg-gray-50'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationBell 
                  unreadCount={unreadCountQuery.data?.data || 0}
                  isLoading={unreadCountQuery.isLoading}
                />

                {/* User Dropdown */}
                <UserDropdown
                  user={user}
                  onLogout={handleLogout}
                />
              </>
            ) : (
              <>
                {/* Login/Register Buttons */}
                <div className="hidden sm:flex items-center space-x-3 space-x-reverse">
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      إنشاء حساب
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
        >
          <div className="px-4 py-6 space-y-4">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-deep-teal text-white rounded-full flex items-center justify-center font-semibold">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {user?.email}
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="space-y-2">
                  {getRoleBasedLinks().map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActiveRoute(link.to)
                          ? 'text-deep-teal bg-teal-50'
                          : 'text-text-secondary hover:text-deep-teal hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </nav>

                {/* Mobile Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
                  >
                    <span>👤</span>
                    <span>الملف الشخصي</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
                  >
                    <span>⚙️</span>
                    <span>الإعدادات</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full text-right"
                  >
                    <span>🚪</span>
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Guest Mobile Menu */}
                <div className="space-y-3">
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="w-full">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="lg" className="w-full">
                      إنشاء حساب جديد
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 
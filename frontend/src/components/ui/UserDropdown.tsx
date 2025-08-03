import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';

interface UserDropdownProps {
  user: User | null;
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const getRoleName = (role: string) => {
    const roleNames = {
      seeker: 'مستفيد',
      provider: 'مزود خدمة',
      admin: 'مدير'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      seeker: 'text-blue-600 bg-blue-50',
      provider: 'text-green-600 bg-green-50',
      admin: 'text-purple-600 bg-purple-50'
    };
    return roleColors[role as keyof typeof roleColors] || 'text-gray-600 bg-gray-50';
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={handleToggle}
        className="flex items-center space-x-3 space-x-reverse p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-deep-teal focus:ring-offset-2"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-deep-teal text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user.firstName?.charAt(0) || 'U'
          )}
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-text-primary">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-text-secondary">
            {getRoleName(user.role)}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-deep-teal text-white rounded-full flex items-center justify-center font-semibold">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.firstName?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-text-secondary truncate">
                  {user.email}
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                  {getRoleName(user.role)}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/profile"
              className="flex items-center space-x-3 space-x-reverse px-4 py-2 text-sm text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>👤</span>
              <span>الملف الشخصي</span>
            </Link>

            <Link
              to="/settings"
              className="flex items-center space-x-3 space-x-reverse px-4 py-2 text-sm text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>⚙️</span>
              <span>الإعدادات</span>
            </Link>

            {user.role === 'provider' && (
              <Link
                to="/verification"
                className="flex items-center space-x-3 space-x-reverse px-4 py-2 text-sm text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span>✅</span>
                <span>التحقق من الحساب</span>
              </Link>
            )}

            <Link
              to="/help"
              className="flex items-center space-x-3 space-x-reverse px-4 py-2 text-sm text-text-secondary hover:text-deep-teal hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>❓</span>
              <span>المساعدة</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 space-x-reverse px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full text-right"
            >
              <span>🚪</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown; 
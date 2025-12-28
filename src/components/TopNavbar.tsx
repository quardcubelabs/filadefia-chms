'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import UserDropdown from '@/components/UserDropdown';
import { 
  Search, 
  Bell, 
  Settings, 
  Moon, 
  Sun,
  Menu,
  X
} from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface TopNavbarProps {
  title?: string;
  subtitle?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export default function TopNavbar({
  title,
  subtitle,
  darkMode = false,
  onToggleDarkMode,
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearch,
  actions,
  onMenuClick
}: TopNavbarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDepartmentLeader, departmentName } = useDepartmentAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Auto-generate title if not provided
  const displayTitle = title || `Hello ${user?.profile?.first_name || user?.email?.split('@')[0] || 'User'}`;
  const displaySubtitle = subtitle || (isDepartmentLeader && departmentName 
    ? `Department Leader - ${departmentName}` 
    : 'Tanzania Assemblies of God - FCC'
  );

  return (
    <header className={`${bgColor} border-b ${borderColor} sticky top-0 z-40 shadow-sm`}>
      <div className="lg:ml-0 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu Button (mobile) + Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${textPrimary} truncate hidden sm:block`}>
                {displayTitle}
              </h1>
              {displaySubtitle && (
                <p className={`text-xs sm:text-sm ${textSecondary} mt-0.5 sm:mt-1 hidden sm:block truncate`}>
                  {displaySubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Center Section - Search (if enabled) */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textSecondary}`} />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          )}

          {/* Right Section - Actions & User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Custom Actions */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}

            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDarkMode}
                className="p-2"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/notifications')}
              className="relative p-2"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Dropdown */}
            <UserDropdown darkMode={darkMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
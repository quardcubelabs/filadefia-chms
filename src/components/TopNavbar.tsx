'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useZoneAccess } from '@/hooks/useZoneAccess';
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
  const { user, supabase } = useAuth();
  const { isDepartmentLeader, departmentId, departmentName } = useDepartmentAccess();
  const { isZoneLeader, zoneId, zoneName } = useZoneAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load notification count for zone/department leaders
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user || !supabase) return;

      try {
        // For department leaders - get announcements targeted to their department
        if (isDepartmentLeader && departmentId) {
          const { data, error } = await supabase
            .from('announcements')
            .select('id, title, content, created_at, priority, is_active')
            .eq('department_id', departmentId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
            setNotifications(data);
            setNotificationCount(data.length);
          }
        }
        // For zone leaders - get announcements targeted to their zone
        else if (isZoneLeader && zoneId) {
          const { data, error } = await supabase
            .from('announcements')
            .select('id, title, content, created_at, priority, is_active')
            .eq('zone_id', zoneId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
            setNotifications(data);
            setNotificationCount(data.length);
          }
        }
        // For admin/pastor - get all recent announcements
        else if (user?.profile?.role === 'administrator' || user?.profile?.role === 'pastor') {
          const { data, error } = await supabase
            .from('announcements')
            .select('id, title, content, created_at, priority, is_active')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data) {
            setNotifications(data);
            setNotificationCount(data.length);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, [user, supabase, isDepartmentLeader, departmentId, isZoneLeader, zoneId]);

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
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setShowNotifications(false);
                            router.push('/messages');
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.priority === 'high' ? 'bg-red-500' :
                              notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        router.push('/messages');
                      }}
                      className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium py-2"
                    >
                      View All Messages
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <UserDropdown darkMode={darkMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
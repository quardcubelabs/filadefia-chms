'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { 
  Home,
  Calendar,
  Users,
  Settings,
  MessageSquare,
  FileText,
  DollarSign,
  BarChart3,
  LogOut,
  ChevronLeft,
  UserCheck,
  MapPin,
  X,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  darkMode?: boolean;
  onSignOut?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function Sidebar({ darkMode = false, onSignOut, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { departmentId, isDepartmentLeader, loading: deptAccessLoading } = useDepartmentAccess();

  const navItems: NavItem[] = useMemo(() => {
    // Don't calculate nav items until department access is loaded
    // This prevents flickering when the isDepartmentLeader status changes
    if (deptAccessLoading) {
      // Return minimal nav items while loading
      return [
        { icon: <Home className="h-5 w-5" />, label: 'Dashboard', href: '/dashboard' },
      ];
    }

    const dashboardHref = isDepartmentLeader && departmentId 
      ? `/departments/${departmentId}` 
      : '/dashboard';

    const dashboardLabel = isDepartmentLeader && departmentId ? 'Department Dashboard' : 'Dashboard';

    const baseNavItems = [
      { icon: <Home className="h-5 w-5" />, label: dashboardLabel, href: dashboardHref },
      { icon: <Users className="h-5 w-5" />, label: 'Members', href: '/members' },
      { icon: <UserCheck className="h-5 w-5" />, label: 'Attendance', href: '/attendance' },
      { icon: <Calendar className="h-5 w-5" />, label: 'Events', href: '/events' },
      { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', href: '/messages' },
      { icon: <DollarSign className="h-5 w-5" />, label: 'Finance', href: '/finance' },
      { icon: <BarChart3 className="h-5 w-5" />, label: 'Reports', href: '/reports' },
      { icon: <FileText className="h-5 w-5" />, label: 'Documents', href: '/documents' },
      { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/settings' },
    ];

    // Only show Departments and Zones pages for non-department leaders
    if (!isDepartmentLeader) {
      baseNavItems.splice(3, 0, { icon: <Briefcase className="h-5 w-5" />, label: 'Departments', href: '/departments' });
      baseNavItems.splice(4, 0, { icon: <MapPin className="h-5 w-5" />, label: 'Zones', href: '/zones' });
    }

    return baseNavItems;
  }, [isDepartmentLeader, departmentId, deptAccessLoading]);

  const isActive = (href: string) => pathname === href;

  // Handle navigation click on mobile
  const handleNavClick = () => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed left-0 top-0 h-full ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-r flex flex-col py-4 lg:py-6 z-50 transition-all duration-300 ease-in-out shadow-lg ${
        mobileOpen 
          ? 'w-48 translate-x-0 lg:hidden' 
          : 'hidden lg:flex'
      } ${
        isExpanded 
          ? 'lg:w-64' 
          : 'lg:w-20'
      }`}
    >
        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className={`absolute top-3 right-3 p-1.5 rounded-lg lg:hidden ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Logo Section */}
        <div className="px-4 lg:px-5 mb-6 lg:mb-8">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <img 
                src="/tag-logo.png" 
                alt="TAG Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                mobileOpen ? 'w-auto opacity-100' : isExpanded ? 'lg:w-auto lg:opacity-100' : 'lg:w-0 lg:opacity-0'
              }`}
            >
              <h2 className={`text-base lg:text-xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } whitespace-nowrap`}>
                FCC CHMS
              </h2>
              <p className={`text-xs lg:text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              } whitespace-nowrap`}>
                Church Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 lg:px-3 space-y-0.5 lg:space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 group relative ${
                  active
                    ? 'bg-red-100 text-red-700 shadow-md ring-1 ring-red-200'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
                    : 'text-gray-600 hover:bg-red-100 hover:text-red-600 hover:shadow-sm'
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="[&>svg]:h-4 [&>svg]:w-4 lg:[&>svg]:h-5 [&>svg]:w-5">
                    {item.icon}
                  </div>
                </div>

                {/* Label */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    mobileOpen ? 'w-auto opacity-100' : isExpanded ? 'lg:w-auto lg:opacity-100' : 'lg:w-0 lg:opacity-0'
                  }`}
                >
                  <span className="text-sm lg:text-base font-medium whitespace-nowrap">{item.label}</span>
                </div>

                {/* Hover tooltip when collapsed */}
                {!mobileOpen && !isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm lg:text-base rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg hidden lg:block">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-gray-900 border-b-4 border-b-transparent"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Expand/Collapse Indicator */}
        <div className="px-5 mt-auto hidden lg:block">
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-lg ${
              darkMode 
                ? 'bg-gray-800 text-gray-400' 
                : 'bg-gray-100 text-gray-600'
            } transition-all duration-300 ${
              isExpanded ? 'mx-auto rotate-180' : 'mx-auto'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </div>
        </div>
      </aside>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Calendar,
  Users,
  Settings,
  MessageSquare,
  FileText,
  DollarSign,
  BarChart3,
  Bell,
  LogOut,
  ChevronLeft,
  Church
} from 'lucide-react';

interface SidebarProps {
  darkMode?: boolean;
  onSignOut?: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

export default function Sidebar({ darkMode = false, onSignOut }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Users className="h-5 w-5" />, label: 'Members', href: '/members' },
    { icon: <Calendar className="h-5 w-5" />, label: 'Events', href: '/events', badge: 3 },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', href: '/messages', badge: 12 },
    { icon: <DollarSign className="h-5 w-5" />, label: 'Finance', href: '/finance' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Reports', href: '/reports' },
    { icon: <FileText className="h-5 w-5" />, label: 'Documents', href: '/documents' },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', href: '/notifications' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  const bgColor = darkMode ? 'bg-tag-gray-900' : 'bg-white';
  const borderColor = darkMode ? 'border-tag-gray-800' : 'border-tag-gray-100';
  const textPrimary = darkMode ? 'text-white' : 'text-tag-gray-900';
  const textSecondary = darkMode ? 'text-tag-gray-400' : 'text-tag-gray-600';
  const hoverBg = darkMode ? 'hover:bg-tag-gray-800' : 'hover:bg-tag-gray-50';

  return (
    <>
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`fixed left-0 top-0 h-full ${bgColor} border-r ${borderColor} flex flex-col py-6 z-50 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Section */}
        <div className="px-5 mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 p-1">
              <img 
                src="/tag-logo.png" 
                alt="TAG Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <h2 className={`text-lg font-bold ${textPrimary} whitespace-nowrap`}>
                FCC CHMS
              </h2>
              <p className={`text-xs ${textSecondary} whitespace-nowrap`}>
                Church Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-tag-red-500 to-tag-red-600 text-white shadow-lg shadow-tag-red-500/30'
                    : `${textSecondary} ${hoverBg} hover:text-tag-gray-900`
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 relative">
                  {item.icon}
                  {item.badge && !isExpanded && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-tag-yellow-500 text-tag-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div
                  className={`flex items-center justify-between flex-1 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                  }`}
                >
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                  {item.badge && isExpanded && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      active 
                        ? 'bg-white text-tag-red-600' 
                        : 'bg-tag-yellow-500 text-tag-black'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Hover tooltip when collapsed */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-tag-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-tag-gray-900 border-b-4 border-b-transparent"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className={`mx-3 my-4 border-t ${borderColor}`}></div>

        {/* Sign Out Button */}
        <div className="px-3">
          <button
            onClick={onSignOut}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${textSecondary} ${hoverBg} hover:text-tag-red-600`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <LogOut className="h-5 w-5" />
            </div>

            {/* Label */}
            <span
              className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}
            >
              Sign Out
            </span>

            {/* Hover tooltip when collapsed */}
            {!isExpanded && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-tag-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                Sign Out
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-tag-gray-900 border-b-4 border-b-transparent"></div>
              </div>
            )}
          </button>
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="px-5 mt-4">
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-lg ${darkMode ? 'bg-tag-gray-800' : 'bg-tag-gray-100'} ${textSecondary} transition-all duration-300 ${
              isExpanded ? 'mx-auto rotate-180' : 'mx-auto'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </div>
        </div>
      </aside>

      {/* Spacer to prevent content overlap */}
      <div className={`transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`} />
    </>
  );
}

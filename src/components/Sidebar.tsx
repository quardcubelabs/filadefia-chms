'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faCalendarDays,
  faUsers,
  faCog,
  faComments,
  faFile,
  faDollarSign,
  faChartBar,
  faBell,
  faChevronLeft,
  faChurch,
  faBriefcase
} from '@fortawesome/free-solid-svg-icons';

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
    { icon: <FontAwesomeIcon icon={faHome} className="h-5 w-5" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />, label: 'Members', href: '/members' },
    { icon: <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />, label: 'Departments', href: '/departments' },
    { icon: <FontAwesomeIcon icon={faCalendarDays} className="h-5 w-5" />, label: 'Events', href: '/events', badge: 3 },
    { icon: <FontAwesomeIcon icon={faComments} className="h-5 w-5" />, label: 'Messages', href: '/messages', badge: 12 },
    { icon: <FontAwesomeIcon icon={faDollarSign} className="h-5 w-5" />, label: 'Finance', href: '/finance' },
    { icon: <FontAwesomeIcon icon={faChartBar} className="h-5 w-5" />, label: 'Reports', href: '/reports' },
    { icon: <FontAwesomeIcon icon={faFile} className="h-5 w-5" />, label: 'Documents', href: '/documents' },
    { icon: <FontAwesomeIcon icon={faBell} className="h-5 w-5" />, label: 'Notifications', href: '/notifications' },
    { icon: <FontAwesomeIcon icon={faCog} className="h-5 w-5" />, label: 'Settings', href: '/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed left-0 top-0 h-full ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-r flex flex-col py-6 z-50 transition-all duration-300 ease-in-out shadow-lg ${
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
              <h2 className={`text-lg font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } whitespace-nowrap`}>
                FCC CHMS
              </h2>
              <p className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              } whitespace-nowrap`}>
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
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 relative">
                  {item.icon}
                  {item.badge && !isExpanded && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 text-gray-900 text-xs rounded-full flex items-center justify-center font-bold border-2 border-white">
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
                        ? 'bg-white text-blue-600' 
                        : 'bg-yellow-400 text-gray-900'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Hover tooltip when collapsed */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-gray-900 border-b-4 border-b-transparent"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Expand/Collapse Indicator */}
        <div className="px-5 mt-auto">
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-lg ${
              darkMode 
                ? 'bg-gray-800 text-gray-400' 
                : 'bg-gray-100 text-gray-600'
            } transition-all duration-300 ${
              isExpanded ? 'mx-auto rotate-180' : 'mx-auto'
            }`}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
          </div>
        </div>
      </aside>
  );
}

'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  navbarActions?: React.ReactNode;
  darkMode?: boolean;
  className?: string;
}

export default function MainLayout({
  children,
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearch,
  navbarActions,
  darkMode: initialDarkMode = false,
  className = ''
}: MainLayoutProps) {
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgColor} ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode} 
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="lg:ml-20 transition-all duration-300">
        {/* Top Navbar */}
        <TopNavbar
          title={title}
          subtitle={subtitle}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          actions={navbarActions}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* Page Content */}
        <main className={`p-3 sm:p-4 md:p-6 lg:p-8 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
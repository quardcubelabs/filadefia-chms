'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Calendar,
  Users,
  Search,
  Bell,
  Mail,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
  }, [user, authLoading]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fcc-blue-600"></div>
      </div>
    );
  }

  // Don't render dashboard if no user (will redirect to login)
  if (!user) {
    return null;
  }

  const bgColor = darkMode ? 'bg-[#1a1d2e]' : 'bg-[#f5f6fa]';
  const cardBg = darkMode ? 'bg-[#252836]' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-[#2d3142]' : 'border-gray-100';

  return (
    <div className={`min-h-screen ${bgColor} flex`}>
      {/* Sidebar Component */}
      <Sidebar darkMode={darkMode} onSignOut={signOut} />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40`}>
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-md p-1.5">
                <img 
                  src="/tag-logo.png" 
                  alt="TAG Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${textPrimary} flex items-center`}>
                  Hello {user?.email?.split('@')[0] || 'User'} 👋
                </h1>
                <p className={`text-sm ${textSecondary} mt-1`}>Tanzania Assemblies of God - FCC</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search"
                  className={`pl-12 pr-4 py-2.5 ${darkMode ? 'bg-[#1a1d2e] text-white' : 'bg-gray-50 text-gray-900'} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64`}
                />
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textSecondary} hover:text-blue-500 transition-colors`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Mail Icon */}
              <button className={`p-2.5 rounded-xl ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textSecondary} hover:text-blue-500 transition-colors`}>
                <Mail className="h-5 w-5" />
              </button>

              {/* Notification Bell */}
              <button className={`relative p-2.5 rounded-xl ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textSecondary} hover:text-blue-500 transition-colors`}>
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full"></span>
              </button>

              {/* User Avatar */}
              <button className={`flex items-center space-x-3 pl-4 border-l ${borderColor}`}>
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                  alt="User"
                  className="h-10 w-10 rounded-full"
                />
                <ChevronDown className={`h-4 w-4 ${textSecondary}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Stats and Charts */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Sunday Service Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <Calendar className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-2`}>Sunday Service</p>
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>76</h3>
                </div>

                {/* Church Income Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <svg className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-2`}>Church Income</p>
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$56K</h3>
                </div>

                {/* Total Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <Users className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-2`}>Total Members</p>
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>783K</h3>
                </div>

                {/* Active Events Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <svg className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-2`}>Active Events</p>
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>12</h3>
                </div>
              </div>

              {/* Members Donut Chart */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Members (%)</h3>
                  <select className={`px-4 py-2 ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textPrimary} border ${borderColor} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Total Members</p>
                    <p className={`text-3xl font-bold ${textPrimary}`}>562,084 People</p>
                  </div>

                  {/* Donut Chart */}
                  <div className="relative">
                    <svg className="transform -rotate-90" width="180" height="180">
                      <circle
                        cx="90"
                        cy="90"
                        r="70"
                        fill="none"
                        stroke={darkMode ? '#1a1d2e' : '#e5e7eb'}
                        strokeWidth="20"
                      />
                      <circle
                        cx="90"
                        cy="90"
                        r="70"
                        fill="none"
                        stroke="url(#donutGradient)"
                        strokeWidth="20"
                        strokeDasharray={`${2 * Math.PI * 70 * 0.90} ${2 * Math.PI * 70 * 0.10}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className={`text-3xl font-bold ${textPrimary}`}>90%</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className={`text-sm ${textSecondary}`}>New</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <span className={`text-sm ${textSecondary}`}>Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className={`text-sm ${textSecondary}`}>Regular</span>
                  </div>
                </div>
              </div>

              {/* Attendance Revenue Chart */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Attendance</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-gray-400"></div>
                        <span className={`text-sm ${textSecondary}`}>Net Profit</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span className={`text-sm ${textSecondary}`}>Revenue</span>
                      </div>
                    </div>
                    <select className={`px-4 py-2 ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textPrimary} border ${borderColor} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                      <option>2024</option>
                      <option>2023</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Total Revenue</p>
                    <p className={`text-3xl font-bold ${textPrimary}`}>$25,612k</p>
                  </div>
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Total Profit</p>
                    <p className={`text-3xl font-bold ${textPrimary}`}>$25,612k</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${textPrimary}`}>80K</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              {/* Attendance Line Chart */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>Attendance</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span className={`text-sm ${textSecondary}`}>New</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className={`text-sm ${textSecondary}`}>Regular</span>
                      </div>
                    </div>
                  </div>
                  <select className={`px-4 py-2 ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textPrimary} border ${borderColor} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                    <option>Regularly</option>
                    <option>Monthly</option>
                  </select>
                </div>

                <div className="mb-6">
                  <p className={`text-sm ${textSecondary} mb-1`}>Regular</p>
                  <p className={`text-3xl font-bold ${textPrimary}`}>650</p>
                </div>

                {/* Line Chart Visualization */}
                <div className="relative h-48">
                  <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                    {/* Cyan Wave */}
                    <path
                      d="M 0 100 Q 75 60, 150 80 T 300 100 T 450 80 T 600 100"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      opacity="0.6"
                    />
                    {/* Blue Wave */}
                    <path
                      d="M 0 120 Q 75 80, 150 100 T 300 120 T 450 60 T 600 80"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                    {/* Dot on blue line */}
                    <circle cx="450" cy="60" r="6" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                    {/* Vertical line from dot */}
                    <line x1="450" y1="60" x2="450" y2="200" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
                  </svg>
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <span key={day} className={`text-xs ${textSecondary}`}>{day}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visitors Area Chart */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Visitors</h3>
                  <select className={`px-4 py-2 ${darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50'} ${textPrimary} border ${borderColor} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                <div className="mb-6">
                  <p className={`text-sm ${textSecondary} mb-1`}>14 Apr</p>
                  <p className={`text-2xl font-bold text-blue-500`}>
                    32.61 <span className="text-sm text-green-500">36% ↑</span>
                  </p>
                </div>

                {/* Area Chart */}
                <div className="relative h-48">
                  <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                    {/* Area fill */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 150 Q 100 120, 200 100 T 400 80 T 500 40 L 600 60 L 600 200 L 0 200 Z"
                      fill="url(#areaGradient)"
                    />
                    {/* Line */}
                    <path
                      d="M 0 150 Q 100 120, 200 100 T 400 80 T 500 40 L 600 60"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                    {/* Dot */}
                    <circle cx="500" cy="40" r="6" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                    {/* Vertical line */}
                    <line x1="500" y1="40" x2="500" y2="200" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
                  </svg>
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month) => (
                      <span key={month} className={`text-xs ${textSecondary}`}>{month}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Best Department Leaders */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Best Department Leaders</h3>
                  <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center">
                    See all
                    <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Pastor John Mwanga', role: 'Senior Pastor', reviews: 451 },
                    { name: 'Sister Grace Ndosi', role: 'Women Leader', reviews: 387 },
                    { name: 'Bro. David Kilima', role: 'Youth Leader', reviews: 324 }
                  ].map((leader, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'hover:bg-[#1a1d2e]' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`}
                            alt={leader.name}
                            className="h-12 w-12 rounded-full"
                          />
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{idx + 1}</span>
                          </div>
                        </div>
                        <div>
                          <p className={`font-semibold ${textPrimary}`}>{leader.name}</p>
                          <p className={`text-sm ${textSecondary}`}>{leader.role}</p>
                          <div className="flex items-center mt-1">
                            <div className="flex text-yellow-400 text-xs">
                              {'★'.repeat(5)}
                            </div>
                            <span className={`text-xs ${textSecondary} ml-2`}>{leader.reviews} reviews</span>
                          </div>
                        </div>
                      </div>
                      <button className="px-5 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
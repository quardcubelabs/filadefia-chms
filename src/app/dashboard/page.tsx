'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { AnimatedChart } from '@/components/AnimatedChart';
import { AnimatedSVGPath, AnimatedCircle } from '@/components/AnimatedSVG';
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
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    console.log('Dashboard - Auth state:', { user: !!user, loading: authLoading });
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login...');
      window.location.href = '/login';
      return;
    }
  }, [user, authLoading]);

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const buttonBg = darkMode ? 'bg-gray-800' : 'bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Sidebar Component */}
      <Sidebar darkMode={darkMode} onSignOut={signOut} />

      {/* Main Content */}
      <div className="ml-20">
        {/* Header */}
        <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40`}>
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className={`text-2xl font-bold ${textPrimary} flex items-center`}>
                  Hello {user?.profile?.first_name || user?.email?.split('@')[0] || 'User'} 👋
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
                  className={`pl-12 pr-4 py-2.5 ${inputBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64`}
                />
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Mail Icon */}
              <button className={`p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}>
                <Mail className="h-5 w-5" />
              </button>

              {/* Notification Bell */}
              <button className={`relative p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}>
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-tag-red-500 rounded-full"></span>
              </button>

              {/* User Avatar */}
              <button className={`flex items-center space-x-3 pl-4 border-l ${borderColor}`}>
                <img
                  src={
                    user?.profile?.avatar_url || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`
                  }
                  alt={`${user?.profile?.first_name || 'User'} ${user?.profile?.last_name || ''}`.trim()}
                  className="h-10 w-10 rounded-full object-cover"
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
                  <AnimatedCounter 
                    end={76} 
                    duration={2000} 
                    delay={200}
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>

                {/* Church Income Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <svg className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-2`}>Church Income</p>
                  <AnimatedCounter 
                    end={56} 
                    duration={2200} 
                    delay={400}
                    prefix="$"
                    suffix="K"
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>

                {/* Total Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <Users className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-2`}>Total Members</p>
                  <AnimatedCounter 
                    end={783} 
                    duration={2400} 
                    delay={600}
                    suffix="K"
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>

                {/* Active Events Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <svg className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-2`}>Active Events</p>
                  <AnimatedCounter 
                    end={12} 
                    duration={2000} 
                    delay={800}
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Members Donut Chart */}
              <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>Members (%)</h3>
                  <select className={`px-6 py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-8">
                  {/* Left side - Total Members */}
                  <div className="flex-shrink-0">
                    <p className={`text-sm ${textSecondary} mb-3`}>Total Members</p>
                    <div className={`text-4xl font-bold ${textPrimary}`}>
                      <AnimatedCounter 
                        end={562084} 
                        duration={3000} 
                        delay={1000}
                        formatNumber={(num) => num.toLocaleString()}
                        suffix=" People"
                      />
                    </div>
                  </div>

                  {/* Right side - Donut Chart and Legend */}
                  <div className="flex items-center gap-12">
                    {/* Donut Chart */}
                    <AnimatedChart type="donut" delay={1200}>
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        <svg className="transform -rotate-90" width="200" height="200" viewBox="0 0 200 200">
                        <defs>
                          {/* Gradient for cyan segment */}
                          <linearGradient id="memberGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                          </linearGradient>
                          {/* Gradient for blue segment */}
                          <linearGradient id="memberGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                          </linearGradient>
                          {/* Gradient for pink segment */}
                          <linearGradient id="memberGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        
                        {/* Background circle */}
                        <circle
                          cx="100"
                          cy="100"
                          r="75"
                          fill="none"
                          stroke={darkMode ? '#1f2937' : '#f5f5f5'}
                          strokeWidth="28"
                        />
                        
                        {/* Cyan segment (Youth) - 20% - Thick layer */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="url(#memberGradient1)"
                          strokeWidth="32"
                          strokeDasharray={`${2 * Math.PI * 80 * 0.20} ${2 * Math.PI * 80 * 0.80}`}
                          strokeLinecap="butt"
                        />
                        
                        {/* Blue segment (Adults) - 55% - Thinnest layer */}
                        <circle
                          cx="100"
                          cy="100"
                          r="72"
                          fill="none"
                          stroke="url(#memberGradient2)"
                          strokeWidth="20"
                          strokeDasharray={`${2 * Math.PI * 72 * 0.55} ${2 * Math.PI * 72 * 0.45}`}
                          strokeDashoffset={`${-2 * Math.PI * 72 * 0.20}`}
                          strokeLinecap="butt"
                        />
                        
                        {/* Pink segment (Seniors) - 25% - Medium-thick layer */}
                        <circle
                          cx="100"
                          cy="100"
                          r="76"
                          fill="none"
                          stroke="url(#memberGradient3)"
                          strokeWidth="28"
                          strokeDasharray={`${2 * Math.PI * 76 * 0.25} ${2 * Math.PI * 76 * 0.75}`}
                          strokeDashoffset={`${-2 * Math.PI * 76 * 0.75}`}
                          strokeLinecap="butt"
                        />
                        </svg>
                        
                        {/* Center text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                          <p className={`text-xs ${textSecondary} mb-1`}>Members</p>
                          <AnimatedCounter 
                            end={90} 
                            duration={2000} 
                            delay={2000}
                            suffix="%"
                            className="text-3xl font-bold text-blue-600"
                          />
                        </div>
                      </div>
                    </AnimatedChart>

                    {/* Legend - Vertical layout */}
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-sm bg-cyan-400 flex-shrink-0"></div>
                        <span className={`text-sm ${textSecondary}`}>Youth</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-sm bg-blue-600 flex-shrink-0"></div>
                        <span className={`text-sm ${textSecondary}`}>Adults</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-sm bg-pink-500 flex-shrink-0"></div>
                        <span className={`text-sm ${textSecondary}`}>Seniors</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Offerings Chart */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${textPrimary}`}>Weekly Offerings</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-300"></div>
                      <span className={`text-xs ${textSecondary}`}>Last month</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-600"></div>
                      <span className={`text-xs ${textSecondary}`}>Revenue</span>
                    </div>
                    <select className={`px-4 py-1.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                      <option>2024</option>
                      <option>2023</option>
                    </select>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className={`text-xs ${textSecondary} mb-1`}>Total Revenue</p>
                    <div className={`text-2xl font-bold ${textPrimary}`}>
                      <AnimatedCounter 
                        end={25452} 
                        duration={2500} 
                        delay={1400}
                        prefix="TZS "
                        suffix="k"
                        formatNumber={(num) => num.toLocaleString()}
                      />
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs ${textSecondary} mb-1`}>Total Profit</p>
                    <div className={`text-2xl font-bold ${textPrimary}`}>
                      <AnimatedCounter 
                        end={25452} 
                        duration={2500} 
                        delay={1600}
                        prefix="TZS "
                        suffix="k"
                        formatNumber={(num) => num.toLocaleString()}
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 px-6 py-3 rounded-xl">
                    <AnimatedCounter 
                      end={80} 
                      duration={2000} 
                      delay={1800}
                      suffix="K"
                      className="text-2xl font-bold text-blue-600"
                    />
                  </div>
                </div>

                {/* Bar Chart */}
                <AnimatedChart type="bar" delay={2000}>
                  <div className="relative" style={{ height: '180px' }}>
                  {/* Floating label above bar 06 */}
                  <div className="absolute top-0 left-[62%] transform -translate-x-1/2 bg-blue-600 px-3 py-1.5 rounded-lg shadow-lg z-10">
                    <p className="text-white text-sm font-bold">80K</p>
                  </div>

                  {/* Bar Chart Container */}
                  <div className="h-full flex items-end justify-between gap-4 pt-10">
                    {[
                      { revenue: 70, forecast: 65, label: '01' },
                      { revenue: 95, forecast: 90, label: '02' },
                      { revenue: 85, forecast: 80, label: '03' },
                      { revenue: 65, forecast: 70, label: '04' },
                      { revenue: 105, forecast: 100, label: '05' },
                      { revenue: 130, forecast: 120, label: '06' },
                      { revenue: 60, forecast: 65, label: '07' },
                      { revenue: 100, forecast: 95, label: '08' }
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        {/* Bar Group */}
                        <div className="w-full flex items-end justify-center gap-1">
                          {/* Revenue Bar (Dark Blue) */}
                          <div 
                            className="flex-1 bg-blue-600 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-blue-700"
                            style={{ height: `${bar.revenue}px` }}
                          ></div>
                          {/* Forecast Bar (Light Purple/Blue) */}
                          <div 
                            className="flex-1 bg-purple-400 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-purple-500"
                            style={{ height: `${bar.forecast}px` }}
                          ></div>
                        </div>
                        {/* Label */}
                        <span className={`text-xs mt-2 ${textSecondary}`}>{bar.label}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                </AnimatedChart>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              {/* Attendance Line Chart */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-2xl font-bold ${textPrimary}`}>Attendance</h3>
                  </div>
                  <select className={`px-4 py-2 ${inputBg} ${textSecondary} border ${borderColor} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                    <option>Regularly</option>
                    <option>Monthly</option>
                  </select>
                </div>

                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-sm bg-cyan-400"></div>
                    <span className={`text-sm ${textSecondary}`}>New</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                    <span className={`text-sm ${textSecondary}`}>Regular</span>
                  </div>
                </div>

                {/* Line Chart Visualization */}
                <div className="relative h-56 mt-8">
                  {/* Value label on chart */}
                  <div className="absolute top-8 right-32 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100">
                    <p className={`text-xs ${textSecondary}`}>Regular</p>
                    <AnimatedCounter 
                      end={650} 
                      duration={2000} 
                      delay={2200}
                      className="text-lg font-bold text-blue-600"
                    />
                  </div>

                  <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                      {/* Cyan smooth wave - crossing pattern */}
                      <AnimatedSVGPath
                        d="M 0 140 C 50 100, 80 80, 100 100 S 150 140, 200 130 S 250 100, 300 110 S 350 130, 400 120 S 450 100, 500 110 S 550 120, 600 100"
                        stroke="#22d3ee"
                        strokeWidth={3.5}
                        delay={2600}
                        duration={2.5}
                      />
                      {/* Blue smooth wave - main wave with crossings */}
                      <AnimatedSVGPath
                        d="M 0 150 C 50 130, 80 110, 100 120 S 150 150, 200 140 S 250 80, 300 90 S 350 100, 400 80 S 450 70, 500 90 S 550 100, 600 80"
                        stroke="#2563eb"
                        strokeWidth={3.5}
                        delay={2800}
                        duration={2.5}
                      />
                      {/* Dot on blue line at Thursday */}
                      <AnimatedCircle cx={400} cy={80} r={7} fill="#2563eb" stroke="white" strokeWidth={3} delay={3200} />
                      {/* Vertical line from dot */}
                      <line x1="400" y1="80" x2="400" y2="200" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.5"/>
                  </svg>
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <span key={day} className={`text-sm ${idx === 4 ? textPrimary + ' font-medium' : textSecondary}`}>{day}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visitors Area Chart */}
              <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>Visitors</h3>
                  <select className={`px-6 py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                {/* Area Chart */}
                <AnimatedChart type="area" delay={2400}>
                  <div className="relative h-64">
                    {/* Floating value label */}
                    <div className="absolute top-8 right-32 z-10">
                      <p className={`text-sm ${textSecondary} mb-1`}>14 Apr</p>
                      <div className="text-3xl font-bold text-blue-600">
                        <AnimatedCounter 
                          end={32.61} 
                          duration={2500} 
                          delay={3000}
                          formatNumber={(num) => num.toFixed(2)}
                        /> 
                        <span className="text-base font-semibold text-green-500">30% ↑</span>
                      </div>
                    </div>

                    <svg className="w-full h-full" viewBox="0 0 700 250" preserveAspectRatio="none">
                      <defs>
                        {/* Gradient fill for area */}
                        <linearGradient id="visitorsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.25 }} />
                          <stop offset="50%" style={{ stopColor: '#93c5fd', stopOpacity: 0.15 }} />
                          <stop offset="100%" style={{ stopColor: '#dbeafe', stopOpacity: 0.05 }} />
                        </linearGradient>
                      </defs>
                      
                      {/* Area fill - smooth wave */}
                      <path
                        d="M 0 170 C 80 150, 100 140, 150 130 S 220 110, 280 135 S 340 150, 380 120 S 430 90, 470 100 S 520 120, 580 80 L 700 50 L 700 250 L 0 250 Z"
                        fill="url(#visitorsGradient)"
                      />
                      
                      {/* Line - smooth wave */}
                      <path
                        d="M 0 170 C 80 150, 100 140, 150 130 S 220 110, 280 135 S 340 150, 380 120 S 430 90, 470 100 S 520 120, 580 80 L 700 50"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Dot at May */}
                      <circle cx="470" cy="100" r="8" fill="#2563eb" stroke="white" strokeWidth="3"/>
                      
                      {/* Vertical dashed line */}
                      <line 
                        x1="470" 
                        y1="100" 
                        x2="470" 
                        y2="250" 
                        stroke="#cbd5e1" 
                        strokeWidth="1.5" 
                        strokeDasharray="5 5" 
                        opacity="0.5"
                      />
                    </svg>
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, idx) => (
                        <span key={month} className={`text-sm ${idx === 4 ? textPrimary + ' font-medium' : textSecondary}`}>
                          {month}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedChart>
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
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'hover:bg-tag-gray-900' : 'hover:bg-tag-gray-50'} transition-colors cursor-pointer`}>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {/* Badge positioned on left side */}
                          <div className="absolute -top-1 -left-1 h-7 w-7 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center z-10">
                            <span className="text-white text-sm font-bold">{idx + 1}</span>
                          </div>
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`}
                            alt={leader.name}
                            className="h-12 w-12 rounded-full"
                          />
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
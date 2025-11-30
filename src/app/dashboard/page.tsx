'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
<<<<<<< HEAD
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar,
  Users,
  Search,
  Bell,
  Mail,
  ChevronDown,
  Sun,
  Moon,
  Building2
} from 'lucide-react';
=======
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { AnimatedChart } from '@/components/AnimatedChart';
import { AnimatedSVGPath, AnimatedCircle } from '@/components/AnimatedSVG';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarDays,
  faUsers,
  faSearch,
  faBell,
  faEnvelope,
  faChevronDown,
  faSun,
  faMoon,
  faDollarSign,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    totalDepartments: 0,
    departmentStats: [],
    membersByAge: { youth: 0, adults: 0, seniors: 0 }
  });
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    monthlyIncome: 0,
    weeklyOfferings: [] as Array<{ week: string, amount: number, label: string }>
  });
  const [departmentLeaders, setDepartmentLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    console.log('Dashboard - Auth state:', { user: !!user, loading: authLoading });
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login...');
      window.location.href = '/login';
      return;
    }

    if (user && !authLoading) {
      fetchDashboardData();
      fetchFinancialData();
      fetchDepartmentLeaders();
      fetchNotifications();
      fetchMessages();
      fetchUserProfile();
    }
  }, [user, authLoading]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowNotifications(false);
        setShowMessages(false);
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      if (!supabase) return;

      setLoading(true);

      // Fetch total members count
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, date_of_birth')
        .eq('status', 'active');

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      // Fetch total departments count
      const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true);

      if (departmentsError) {
        console.error('Error fetching departments:', departmentsError);
        return;
      }

      // Fetch department member counts
      const { data: departmentStats, error: departmentStatsError } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          department_members!inner(member_id)
        `)
        .eq('is_active', true)
        .eq('department_members.is_active', true);

      if (departmentStatsError) {
        console.error('Error fetching department stats:', departmentStatsError);
      }

      // Calculate age groups
      const currentYear = new Date().getFullYear();
      const membersByAge = {
        youth: 0,   // 15-35
        adults: 0,  // 36-60
        seniors: 0  // 61+
      };

      members?.forEach(member => {
        const birthYear = new Date(member.date_of_birth).getFullYear();
        const age = currentYear - birthYear;
        
        if (age >= 15 && age <= 35) {
          membersByAge.youth++;
        } else if (age >= 36 && age <= 60) {
          membersByAge.adults++;
        } else if (age > 60) {
          membersByAge.seniors++;
        }
      });

      setDashboardData({
        totalMembers: members?.length || 0,
        totalDepartments: departments?.length || 0,
        departmentStats: departmentStats || [],
        membersByAge
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      const supabase = createClient();
      if (!supabase) return;

      // Fetch total income (all income transactions)
      const { data: incomeData, error: incomeError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true);
      
      if (incomeError) {
        console.error('Error fetching income data:', incomeError);
        return;
      }
      
      const totalIncome = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      // Fetch current month income
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
      
      if (monthlyError) {
        console.error('Error fetching monthly data:', monthlyError);
        return;
      }
      
      const monthlyIncome = monthlyData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      // Fetch weekly offerings for the last 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const { data: weekData, error: weekError } = await supabase
          .from('financial_transactions')
          .select('amount')
          .eq('transaction_type', 'offering')
          .eq('verified', true)
          .gte('date', weekStart.toISOString().split('T')[0])
          .lte('date', weekEnd.toISOString().split('T')[0]);
        
        if (!weekError) {
          const weekAmount = weekData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
          weeks.push({
            week: `W${8-i}`,
            amount: weekAmount,
            label: String(8-i).padStart(2, '0')
          });
        }
      }
      
      setFinancialData({
        totalIncome,
        monthlyIncome,
        weeklyOfferings: weeks
      });
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchDepartmentLeaders = async () => {
    try {
      const supabase = createClient();
      if (!supabase) return;

      // Fetch departments with their leaders
      const { data: departmentLeadersData, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          leader_id,
          members:members!leader_id(
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('is_active', true)
        .not('leader_id', 'is', null)
        .limit(3);

      if (error) {
        console.error('Error fetching department leaders:', error);
        return;
      }

      // Transform the data for display
      const formattedLeaders = departmentLeadersData?.map((dept: any) => ({
        id: dept.id,
        name: dept.members ? `${dept.members.first_name} ${dept.members.last_name}` : 'Unknown Leader',
        role: `${dept.name} Leader`,
        departmentName: dept.name,
        photo_url: dept.members?.photo_url
      })) || [];

      setDepartmentLeaders(formattedLeaders);

    } catch (error) {
      console.error('Error fetching department leaders:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Mock notifications - replace with real Supabase query later
      const mockNotifications = [
        {
          id: 1,
          title: 'New Member Registration',
          message: 'John Doe has registered as a new member',
          time: '5 minutes ago',
          type: 'member',
          read: false
        },
        {
          id: 2,
          title: 'Payment Received',
          message: 'Monthly tithe payment of TZS 500,000 received',
          time: '1 hour ago',
          type: 'payment',
          read: false
        },
        {
          id: 3,
          title: 'Event Reminder',
          message: 'Youth Conference starts tomorrow at 9:00 AM',
          time: '3 hours ago',
          type: 'event',
          read: true
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Mock messages - replace with real Supabase query later
      const mockMessages = [
        {
          id: 1,
          sender: 'Pastor Michael',
          subject: 'Sunday Service Update',
          preview: 'Please note the change in service time...',
          time: '2 hours ago',
          read: false
        },
        {
          id: 2,
          sender: 'Finance Team',
          subject: 'Monthly Financial Report',
          preview: 'Attached is the financial report for...',
          time: '1 day ago',
          read: true
        },
        {
          id: 3,
          sender: 'Events Committee',
          subject: 'Upcoming Conference',
          preview: 'Registration for the annual conference...',
          time: '2 days ago',
          read: false
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleViewDepartmentLeader = (leaderId: string) => {
    // Navigate to department leader profile or details page
    window.location.href = `/members/${leaderId}`;
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const fetchUserProfile = async () => {
    try {
      const supabase = createClient();
      if (!user?.id) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          member:members(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id) return;

    try {
      setIsUpdatingProfile(true);
      const supabase = createClient();

      // Upload photo to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // If user has a member record, update it too
      if (userProfile?.member) {
        await supabase
          .from('members')
          .update({ photo_url: publicUrl })
          .eq('id', userProfile.member.id);
      }

      // Refresh user profile
      await fetchUserProfile();
      
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
      setPhotoFile(null);
    }
  };

  const updateUserProfile = async (updates: any) => {
    if (!user?.id) return;

    try {
      setIsUpdatingProfile(true);
      const supabase = createClient();

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // If user has a member record, update relevant fields
      if (userProfile?.member && (updates.first_name || updates.last_name)) {
        const memberUpdates: any = {};
        if (updates.first_name) memberUpdates.first_name = updates.first_name;
        if (updates.last_name) memberUpdates.last_name = updates.last_name;

        await supabase
          .from('members')
          .update(memberUpdates)
          .eq('id', userProfile.member.id);
      }

      // Refresh user profile
      await fetchUserProfile();
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const markMessageAsRead = (messageId: number) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

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
                <FontAwesomeIcon icon={faSearch} className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${textSecondary}`} />
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
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="h-5 w-5" />
              </button>

<<<<<<< HEAD
              {/* Mail Icon with Dropdown */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => {
                    setShowMessages(!showMessages);
                    setShowNotifications(false);
                    setShowProfile(false);
                  }}
                  className={`relative p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}
                >
                  <Mail className="h-5 w-5" />
                  {messages.filter(msg => !msg.read).length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-tag-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Messages Dropdown */}
                {showMessages && (
                  <div className={`absolute right-0 top-full mt-2 w-80 ${cardBg} border ${borderColor} rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto`}>
                    <div className={`p-4 border-b ${borderColor}`}>
                      <h3 className={`font-semibold ${textPrimary}`}>Messages</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 border-b ${borderColor} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer ${!message.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => markMessageAsRead(message.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`font-medium text-sm ${textPrimary}`}>{message.sender}</p>
                            <span className={`text-xs ${textSecondary}`}>{message.time}</span>
                          </div>
                          <p className={`text-sm font-medium ${textPrimary} mb-1`}>{message.subject}</p>
                          <p className={`text-sm ${textSecondary} truncate`}>{message.preview}</p>
                        </div>
                      ))}
                    </div>
                    <div className={`p-4 border-t ${borderColor}`}>
                      <button 
                        className="w-full text-center text-blue-500 hover:text-blue-600 text-sm font-medium"
                        onClick={() => window.location.href = '/messages'}
                      >
                        View All Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell with Dropdown */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMessages(false);
                    setShowProfile(false);
                  }}
                  className={`relative p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(notif => !notif.read).length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-tag-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 top-full mt-2 w-80 ${cardBg} border ${borderColor} rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto`}>
                    <div className={`p-4 border-b ${borderColor}`}>
                      <h3 className={`font-semibold ${textPrimary}`}>Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border-b ${borderColor} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`font-medium text-sm ${textPrimary}`}>{notification.title}</p>
                            <span className={`text-xs ${textSecondary}`}>{notification.time}</span>
                          </div>
                          <p className={`text-sm ${textSecondary}`}>{notification.message}</p>
                        </div>
                      ))}
                    </div>
                    <div className={`p-4 border-t ${borderColor}`}>
                      <button 
                        className="w-full text-center text-blue-500 hover:text-blue-600 text-sm font-medium"
                        onClick={() => window.location.href = '/notifications'}
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar with Profile Dropdown */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowMessages(false);
                    setShowNotifications(false);
                  }}
                  className={`flex items-center space-x-3 pl-4 border-l ${borderColor}`}
                >
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

                {/* Profile Dropdown */}
                {showProfile && (
                  <div className={`absolute right-0 top-full mt-2 w-64 ${cardBg} border ${borderColor} rounded-xl shadow-lg z-50`}>
                    <div className={`p-4 border-b ${borderColor}`}>
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            user?.profile?.avatar_url || 
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`
                          }
                          alt="Profile"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div>
                          <p className={`font-semibold ${textPrimary}`}>
                            {user?.profile?.first_name || user?.email?.split('@')[0] || 'User'} {user?.profile?.last_name || ''}
                          </p>
                          <p className={`text-sm ${textSecondary}`}>
                            {user?.profile?.role || 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          setShowProfile(false);
                          setShowProfileModal(true);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${textPrimary} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfile(false);
                          setShowSettingsModal(true);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${textPrimary} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        Settings
                      </button>
                      <button 
                        onClick={signOut}
                        className={`w-full text-left px-4 py-2 text-sm text-red-500 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
=======
              {/* Mail Icon */}
              <button className={`p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}>
                <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5" />
              </button>

              {/* Notification Bell */}
              <button className={`relative p-2.5 rounded-xl ${buttonBg} ${textSecondary} hover:text-tag-red-500 transition-colors`}>
                <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
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
                <FontAwesomeIcon icon={faChevronDown} className={`h-4 w-4 ${textSecondary}`} />
              </button>
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
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
                {/* Total Departments Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-2xl mb-4`}>
<<<<<<< HEAD
                    <Building2 className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-2`}>Total Departments</p>
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : dashboardData.totalDepartments}
                  </h3>
=======
                    <FontAwesomeIcon icon={faCalendarDays} className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-2`}>Sunday Service</p>
                  <AnimatedCounter 
                    end={76} 
                    duration={2000} 
                    delay={200}
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
                </div>

                {/* Church Income Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <svg className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-2`}>Church Income</p>
<<<<<<< HEAD
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : `TZS ${(financialData.totalIncome / 1000000).toFixed(1)}M`}
                  </h3>
=======
                  <AnimatedCounter 
                    end={56} 
                    duration={2200} 
                    delay={400}
                    prefix="$"
                    suffix="K"
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
                </div>

                {/* Total Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-3xl p-6 shadow-sm`}>
                  <div className={`inline-flex p-4 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                    <FontAwesomeIcon icon={faUsers} className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-2`}>Total Members</p>
<<<<<<< HEAD
                  <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : dashboardData.totalMembers.toLocaleString()}
                  </h3>
=======
                  <AnimatedCounter 
                    end={783} 
                    duration={2400} 
                    delay={600}
                    suffix="K"
                    className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
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
<<<<<<< HEAD
                    <p className={`text-4xl font-bold ${textPrimary}`}>
                      {loading ? '...' : `${dashboardData.totalMembers.toLocaleString()} People`}
                    </p>
=======
                    <div className={`text-4xl font-bold ${textPrimary}`}>
                      <AnimatedCounter 
                        end={562084} 
                        duration={3000} 
                        delay={1000}
                        formatNumber={(num) => num.toLocaleString()}
                        suffix=" People"
                      />
                    </div>
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
                  </div>

                  {/* Right side - Donut Chart and Legend */}
                  <div className="flex items-center gap-12">
                    {/* Donut Chart */}
<<<<<<< HEAD
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      {(() => {
                        if (loading) {
                          return (
                            <div className="w-[200px] h-[200px] flex items-center justify-center">
                              <p className={textSecondary}>Loading...</p>
                            </div>
                          );
                        }

                        const totalMembers = dashboardData.totalMembers;
                        if (totalMembers === 0) {
                          return (
                            <div className="w-[200px] h-[200px] flex items-center justify-center">
                              <p className={textSecondary}>No data</p>
                            </div>
                          );
                        }

                        const youthPercentage = (dashboardData.membersByAge.youth / totalMembers) * 100;
                        const adultsPercentage = (dashboardData.membersByAge.adults / totalMembers) * 100;
                        const seniorsPercentage = (dashboardData.membersByAge.seniors / totalMembers) * 100;

                        const youthRatio = dashboardData.membersByAge.youth / totalMembers;
                        const adultsRatio = dashboardData.membersByAge.adults / totalMembers;
                        const seniorsRatio = dashboardData.membersByAge.seniors / totalMembers;

                        return (
                          <svg className="transform -rotate-90" width="200" height="200" viewBox="0 0 200 200">
                            <defs>
                              <linearGradient id="memberGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                              </linearGradient>
                              <linearGradient id="memberGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                              </linearGradient>
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
                            
                            {/* Youth segment (Cyan) */}
                            {youthRatio > 0 && (
                              <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="url(#memberGradient1)"
                                strokeWidth="32"
                                strokeDasharray={`${2 * Math.PI * 80 * youthRatio} ${2 * Math.PI * 80 * (1 - youthRatio)}`}
                                strokeLinecap="butt"
                              />
                            )}
                            
                            {/* Adults segment (Blue) */}
                            {adultsRatio > 0 && (
                              <circle
                                cx="100"
                                cy="100"
                                r="72"
                                fill="none"
                                stroke="url(#memberGradient2)"
                                strokeWidth="20"
                                strokeDasharray={`${2 * Math.PI * 72 * adultsRatio} ${2 * Math.PI * 72 * (1 - adultsRatio)}`}
                                strokeDashoffset={`${-2 * Math.PI * 72 * youthRatio}`}
                                strokeLinecap="butt"
                              />
                            )}
                            
                            {/* Seniors segment (Pink) */}
                            {seniorsRatio > 0 && (
                              <circle
                                cx="100"
                                cy="100"
                                r="76"
                                fill="none"
                                stroke="url(#memberGradient3)"
                                strokeWidth="28"
                                strokeDasharray={`${2 * Math.PI * 76 * seniorsRatio} ${2 * Math.PI * 76 * (1 - seniorsRatio)}`}
                                strokeDashoffset={`${-2 * Math.PI * 76 * (youthRatio + adultsRatio)}`}
                                strokeLinecap="butt"
                              />
                            )}
                          </svg>
                        );
                      })()}
                      
                      {/* Center text */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className={`text-xs ${textSecondary} mb-1`}>Active</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {loading ? '...' : '100%'}
                        </p>
=======
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
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
                      </div>
                    </AnimatedChart>

                    {/* Legend - Vertical layout */}
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between space-x-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-sm bg-cyan-400 flex-shrink-0"></div>
                          <span className={`text-sm ${textSecondary}`}>Youth (15-35)</span>
                        </div>
                        <span className={`text-sm font-semibold ${textPrimary}`}>
                          {loading ? '...' : `${dashboardData.membersByAge.youth} (${dashboardData.totalMembers > 0 ? Math.round((dashboardData.membersByAge.youth / dashboardData.totalMembers) * 100) : 0}%)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-sm bg-blue-600 flex-shrink-0"></div>
                          <span className={`text-sm ${textSecondary}`}>Adults (36-60)</span>
                        </div>
                        <span className={`text-sm font-semibold ${textPrimary}`}>
                          {loading ? '...' : `${dashboardData.membersByAge.adults} (${dashboardData.totalMembers > 0 ? Math.round((dashboardData.membersByAge.adults / dashboardData.totalMembers) * 100) : 0}%)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-sm bg-pink-500 flex-shrink-0"></div>
                          <span className={`text-sm ${textSecondary}`}>Seniors (61+)</span>
                        </div>
                        <span className={`text-sm font-semibold ${textPrimary}`}>
                          {loading ? '...' : `${dashboardData.membersByAge.seniors} (${dashboardData.totalMembers > 0 ? Math.round((dashboardData.membersByAge.seniors / dashboardData.totalMembers) * 100) : 0}%)`}
                        </span>
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
<<<<<<< HEAD
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {loading ? 'Loading...' : `TZS ${(financialData.totalIncome / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${textSecondary} mb-1`}>Monthly Income</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {loading ? 'Loading...' : `TZS ${(financialData.monthlyIncome / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-blue-600' : 'bg-blue-50'} px-6 py-3 rounded-xl`}>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                      {loading ? '...' : `${Math.max(...(financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)) || [0]))}K`}
                    </p>
=======
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
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
                  </div>
                </div>

                {/* Bar Chart */}
<<<<<<< HEAD
                <div className="relative" style={{ height: '180px' }}>
                  {/* Floating label above highest bar */}
                  {financialData.weeklyOfferings.length > 0 && (
                    <div className="absolute top-0 left-[62%] transform -translate-x-1/2 bg-blue-600 px-3 py-1.5 rounded-lg shadow-lg z-10">
                      <p className="text-white text-sm font-bold">
                        {Math.max(...financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)), 0)}K
                      </p>
                    </div>
                  )}
=======
                <AnimatedChart type="bar" delay={2000}>
                  <div className="relative" style={{ height: '180px' }}>
                  {/* Floating label above bar 06 */}
                  <div className="absolute top-0 left-[62%] transform -translate-x-1/2 bg-blue-600 px-3 py-1.5 rounded-lg shadow-lg z-10">
                    <p className="text-white text-sm font-bold">80K</p>
                  </div>
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990

                  {/* Bar Chart Container */}
                  <div className="h-full flex items-end justify-between gap-4 pt-10">
                    {(financialData.weeklyOfferings.length > 0 ? financialData.weeklyOfferings : [
                      { week: 'W1', amount: 0, label: '01' },
                      { week: 'W2', amount: 0, label: '02' },
                      { week: 'W3', amount: 0, label: '03' },
                      { week: 'W4', amount: 0, label: '04' },
                      { week: 'W5', amount: 0, label: '05' },
                      { week: 'W6', amount: 0, label: '06' },
                      { week: 'W7', amount: 0, label: '07' },
                      { week: 'W8', amount: 0, label: '08' }
                    ]).map((bar, idx) => {
                      const maxAmount = Math.max(...financialData.weeklyOfferings.map(w => w.amount), 1);
                      const height = Math.max((bar.amount / maxAmount) * 120, 10);
                      const forecastHeight = Math.max(height * 0.9, 8);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          {/* Bar Group */}
                          <div className="w-full flex items-end justify-center gap-1">
                            {/* Revenue Bar (Dark Blue) */}
                            <div 
                              className="flex-1 bg-blue-600 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-blue-700"
                              style={{ height: `${height}px` }}
                              title={`Week ${idx + 1}: TZS ${bar.amount.toLocaleString()}`}
                            ></div>
                            {/* Forecast Bar (Light Purple/Blue) */}
                            <div 
                              className="flex-1 bg-purple-400 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-purple-500"
                              style={{ height: `${forecastHeight}px` }}
                            ></div>
                          </div>
                          {/* Label */}
                          <span className={`text-xs mt-2 ${textSecondary}`}>{bar.label}</span>
                        </div>
<<<<<<< HEAD
                      );
                    })}
=======
                        {/* Label */}
                        <span className={`text-xs mt-2 ${textSecondary}`}>{bar.label}</span>
                      </div>
                    ))}
                    </div>
>>>>>>> e5e40eee531cdac6ebbecc1660e8fb12df5c9990
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
                    <FontAwesomeIcon icon={faChevronDown} className="ml-1 h-4 w-4 -rotate-90" />
                  </button>
                </div>

                <div className="space-y-4">
                  {departmentLeaders.length > 0 ? (
                    departmentLeaders.map((leader: any, idx: number) => (
                      <div key={leader.id} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'hover:bg-tag-gray-900' : 'hover:bg-tag-gray-50'} transition-colors cursor-pointer`}>
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {/* Badge positioned on left side */}
                            <div className="absolute -top-1 -left-1 h-7 w-7 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center z-10">
                              <span className="text-white text-sm font-bold">{idx + 1}</span>
                            </div>
                            <img
                              src={leader.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`}
                              alt={leader.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          </div>
                          <div>
                            <p className={`font-semibold ${textPrimary}`}>{leader.name}</p>
                            <p className={`text-sm ${textSecondary}`}>{leader.role}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex text-yellow-400 text-xs">
                                {'★'.repeat(5)}
                              </div>
                              <span className={`text-xs ${textSecondary} ml-2`}>{leader.departmentName}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleViewDepartmentLeader(leader.id)}
                          className="px-5 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 ${textSecondary}`}>
                      {loading ? 'Loading department leaders...' : 'No department leaders found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${textPrimary}`}>Profile Information</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className={`text-gray-500 hover:${textPrimary}`}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {userProfile ? (
                <div className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={userProfile.photo_url || '/default-avatar.png'}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                      <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPhotoFile(file);
                              handlePhotoUpload(file);
                            }
                          }}
                        />
                        📷
                      </label>
                    </div>
                    {isUpdatingProfile && (
                      <p className="text-blue-500 mt-2">Updating photo...</p>
                    )}
                  </div>

                  {/* Profile Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={userProfile.first_name || ''}
                        onChange={(e) => setUserProfile({...userProfile, first_name: e.target.value})}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textPrimary}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={userProfile.last_name || ''}
                        onChange={(e) => setUserProfile({...userProfile, last_name: e.target.value})}
                        className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textPrimary}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={userProfile.email || ''}
                        readOnly
                        className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textSecondary} bg-gray-100`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                        Role
                      </label>
                      <input
                        type="text"
                        value={userProfile.role || ''}
                        readOnly
                        className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textSecondary} bg-gray-100`}
                      />
                    </div>
                    {userProfile.member && (
                      <>
                        <div>
                          <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                            Member Number
                          </label>
                          <input
                            type="text"
                            value={userProfile.member.member_number || ''}
                            readOnly
                            className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textSecondary} bg-gray-100`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                            Phone
                          </label>
                          <input
                            type="text"
                            value={userProfile.member.phone || ''}
                            readOnly
                            className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textSecondary} bg-gray-100`}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className={`px-4 py-2 border ${borderColor} rounded-md ${textSecondary} hover:${textPrimary}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        updateUserProfile({
                          first_name: userProfile.first_name,
                          last_name: userProfile.last_name
                        });
                        setShowProfileModal(false);
                      }}
                      disabled={isUpdatingProfile}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={textSecondary}>Loading profile...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${textPrimary}`}>Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`text-gray-500 hover:${textPrimary}`}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Appearance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={textSecondary}>Dark Mode</span>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        darkMode ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={textPrimary}>Email Notifications</span>
                      <p className={`text-sm ${textSecondary}`}>Receive notifications via email</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={textPrimary}>Push Notifications</span>
                      <p className={`text-sm ${textSecondary}`}>Receive push notifications</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Privacy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={textPrimary}>Profile Visibility</span>
                      <p className={`text-sm ${textSecondary}`}>Make your profile visible to other members</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Account</h3>
                <div className="space-y-3">
                  <button className={`w-full text-left px-4 py-3 border ${borderColor} rounded-md hover:bg-gray-50 ${textPrimary}`}>
                    Change Password
                  </button>
                  <button className={`w-full text-left px-4 py-3 border ${borderColor} rounded-md hover:bg-gray-50 ${textPrimary}`}>
                    Export Data
                  </button>
                  <button className="w-full text-left px-4 py-3 border border-red-300 rounded-md hover:bg-red-50 text-red-600">
                    Delete Account
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
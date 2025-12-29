'use client';

import { useAuth, AuthStatus } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import AttendanceCard from '@/components/AttendanceCard';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';

import { 
  Building2,
  Crown,
  Users,
  ChevronDown
} from 'lucide-react';

// Loading component to prevent blank pages
function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, status, signOut, supabase } = useAuth();
  const { departmentId, isDepartmentLeader, loading: deptAccessLoading } = useDepartmentAccess();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Handle auth state changes and department leader redirect
  useEffect(() => {
    // Don't do anything while loading - prevents premature redirects and flickering
    if (authLoading || status === AuthStatus.LOADING || deptAccessLoading) return;

    // Only redirect if definitively unauthenticated
    if (status === AuthStatus.UNAUTHENTICATED && !user) {
      router.replace('/login');
      return;
    }

    // Redirect department leaders to their department dashboard
    if (isDepartmentLeader && departmentId) {
      router.replace(`/departments/${departmentId}`);
      return;
    }

    // User is authenticated admin - load data if not already loaded
    if (user && !isDataLoaded && !isDepartmentLeader) {
      setIsDataLoaded(true);
      fetchDashboardData();
      fetchFinancialData();
      fetchDepartmentLeaders();
      fetchUserProfile();
    }
  }, [user, authLoading, status, isDataLoaded, isDepartmentLeader, departmentId, deptAccessLoading]);

  // Close dropdowns when clicking outside


  const fetchDashboardData = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      setLoading(true);

      // Fetch total members count (admin view - all members)
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, date_of_birth, department_members(department_id)')
        .eq('status', 'active');

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      // Fetch all departments count (admin view)
      const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true);

      if (departmentsError) {
        console.error('Error fetching departments:', departmentsError);
        return;
      }

      // Fetch department member counts (admin view - all departments)
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

      members?.forEach((member: any) => {
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
        departmentStats: departmentStats || [] as any,
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
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      // Fetch total income (all income transactions) with department filtering
      let incomeQuery = supabase
        .from('financial_transactions')
        .select('amount')
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true);

      // Admin view - no department filtering needed

      const { data: incomeData, error: incomeError } = await incomeQuery;
      
      if (incomeError) {
        // Handle network errors gracefully
        if (incomeError.message?.includes('Failed to fetch')) {
          console.warn('Network error fetching income data, will retry on reconnect');
        } else {
          console.error('Error fetching income data:', incomeError.message || incomeError);
        }
        return;
      }
      
      const totalIncome = incomeData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      // Fetch current month income with department filtering
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      let monthlyQuery = supabase
        .from('financial_transactions')
        .select('amount')
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0]);

      // Admin view - no department filtering needed

      const { data: monthlyData, error: monthlyError } = await monthlyQuery;
      
      if (monthlyError) {
        if (monthlyError.message?.includes('Failed to fetch')) {
          console.warn('Network error fetching monthly data, will retry on reconnect');
        } else {
          console.error('Error fetching monthly data:', monthlyError.message || monthlyError);
        }
        return;
      }
      
      const monthlyIncome = monthlyData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
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
          const weekAmount = weekData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
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
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      // Fetch departments with their leaders
      const { data: departmentLeadersData, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          leader_id,
          leader:members!leader_id(
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
        id: dept.leader?.id || dept.leader_id,
        name: dept.leader ? `${dept.leader.first_name} ${dept.leader.last_name}` : 'Unknown Leader',
        role: `${dept.name} Leader`,
        departmentName: dept.name,
        photo_url: dept.leader?.photo_url
      })) || [];

      setDepartmentLeaders(formattedLeaders);

    } catch (error) {
      console.error('Error fetching department leaders:', error);
    }
  };





  const handleViewDepartmentLeader = (leaderId: string) => {
    // Navigate to department leader profile or details page
    window.location.href = `/members/${leaderId}`;
  };



  const fetchUserProfile = async () => {
    try {
      if (!supabase || !user?.id) {
        console.error('Supabase client not available or no user');
        return;
      }

      if (!supabase) return;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message || error);
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile...');
          if (!supabase) return;
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email || '',
              role: 'member',
              first_name: user.email?.split('@')[0] || 'User',
              last_name: '',
              is_active: true
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return;
          }
          
          setUserProfile(newProfile);
          return;
        }
        return;
      }

      setUserProfile(profile);
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message || error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id) return;

    try {
      setIsUpdatingProfile(true);

      // First, check if user has permission to upload
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      console.log('Current user for upload:', userData?.user?.id, user?.profile?.role);

      // Upload photo to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      console.log('Attempting to upload to:', filePath);

      // Try uploading to different buckets if one fails
      let uploadData, uploadError;
      let successfulBucket = null;
      const bucketsToTry = ['photos', 'profile-photos', 'member-photos'];
      
      for (const bucket of bucketsToTry) {
        console.log(`Attempting upload to bucket: ${bucket}`);
        if (!supabase) return;
        const result = await supabase.storage
          .from(bucket)
          .upload(filePath, file);
        
        if (!result.error) {
          uploadData = result.data;
          uploadError = null;
          successfulBucket = bucket;
          console.log(`Upload successful to bucket: ${bucket}`);
          break;
        } else {
          console.log(`Upload failed to bucket ${bucket}:`, result.error);
          uploadError = result.error;
        }
      }

      if (uploadError || !successfulBucket) {
        console.error('All storage uploads failed:', uploadError);
        if (uploadError?.message?.includes('row-level security')) {
          throw new Error(`Storage access denied. Please create storage buckets (${bucketsToTry.join(', ')}) in Supabase Dashboard > Storage and set them as public.`);
        }
        throw new Error(`Upload failed to all buckets. Last error: ${uploadError?.message || 'Unknown error'}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL from the successful bucket
      if (!supabase) return '';
      const { data: { publicUrl } } = supabase.storage
        .from(successfulBucket)
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);

      // Update profile with new photo URL
      if (!supabase) return '';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Note: Member records are managed separately from profiles

      // Refresh user profile
      await fetchUserProfile();
      
      alert('Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Error uploading photo: ${errorMessage}\n\nPlease check browser console for details.`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updateUserProfile = async (updates: any) => {
    if (!user?.id) return;

    try {
      setIsUpdatingProfile(true);

      // Update profiles table
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Note: Member records are managed separately from profiles

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



  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? '' : 'border border-gray-200';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-gray-800' : 'bg-white';

  // Show loading screen while authenticating or checking department access - prevents blank pages and flickering
  if (authLoading || status === AuthStatus.LOADING || deptAccessLoading) {
    return <DashboardLoading />;
  }

  // Show loading while waiting for redirect (user is null but status might not be updated yet)
  if (!user && status === AuthStatus.AUTHENTICATED) {
    return <DashboardLoading />;
  }

  // If unauthenticated, redirect to login instead of showing loading
  if (!user && status === AuthStatus.UNAUTHENTICATED) {
    router.replace('/login');
    return <DashboardLoading />;
  }

  // Show loading only briefly while department leader is being redirected
  if (isDepartmentLeader && departmentId && !deptAccessLoading) {
    // Force redirect if it hasn't happened yet
    router.replace(`/departments/${departmentId}`);
    return <DashboardLoading />;
  }

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Sidebar Component */}
      <Sidebar darkMode={darkMode} onSignOut={signOut} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-20 transition-all duration-300">
        {/* Top Navbar */}
        <TopNavbar
          title={`Hello ${user?.profile?.first_name || user?.email?.split('@')[0] || 'User'}`}
          subtitle="Tanzania Assemblies of God - FCC"
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Dashboard Content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
          {/* Admin Dashboard - Church-wide data */}

          {/* ========== MOBILE VIEW (shown only on small screens) ========== */}
          <div className="block sm:hidden space-y-3">
            {/* Mobile Stats Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Total Departments */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-xl p-3 shadow-sm`}>
                <div className={`inline-flex p-2 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-lg mb-2`}>
                  <Building2 className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <p className={`text-[10px] ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-0.5`}>Total Departments</p>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : dashboardData.totalDepartments}
                </h3>
              </div>

              {/* Church Income */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-xl p-3 shadow-sm`}>
                <div className={`inline-flex p-2 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-lg mb-2`}>
                  <svg className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-[10px] ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-0.5`}>Church Income</p>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : `TZS ${(financialData.totalIncome / 1000000).toFixed(1)}M`}
                </h3>
              </div>

              {/* Total Members */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-xl p-3 shadow-sm`}>
                <div className={`inline-flex p-2 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-lg mb-2`}>
                  <Users className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <p className={`text-[10px] ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-0.5`}>Total Members</p>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : dashboardData.totalMembers.toLocaleString()}
                </h3>
              </div>

              {/* Active Events */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-xl p-3 shadow-sm`}>
                <div className={`inline-flex p-2 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-lg mb-2`}>
                  <svg className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-[10px] ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-0.5`}>Active Events</p>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>12</h3>
              </div>
            </div>

            {/* Mobile Members Summary Card */}
            <div className={`${cardBg} rounded-xl p-3 ${borderClass} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${textPrimary}`}>Members Distribution</h3>
                <select className={`px-2 py-1 ${inputBg} ${textSecondary} ${borderClass} rounded text-xs`}>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className={`text-[10px] ${textSecondary} mb-1`}>Total</p>
                  <p className={`text-lg font-bold ${textPrimary}`}>
                    {loading ? '...' : `${dashboardData.totalMembers.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 mx-auto mb-1"></div>
                    <p className={`text-[9px] ${textSecondary}`}>Youth</p>
                    <p className={`text-xs font-semibold ${textPrimary}`}>{loading ? '...' : dashboardData.membersByAge.youth}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600 mx-auto mb-1"></div>
                    <p className={`text-[9px] ${textSecondary}`}>Adults</p>
                    <p className={`text-xs font-semibold ${textPrimary}`}>{loading ? '...' : dashboardData.membersByAge.adults}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-pink-500 mx-auto mb-1"></div>
                    <p className={`text-[9px] ${textSecondary}`}>Seniors</p>
                    <p className={`text-xs font-semibold ${textPrimary}`}>{loading ? '...' : dashboardData.membersByAge.seniors}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Weekly Offerings Card */}
            <div className={`${cardBg} rounded-xl p-3 ${borderClass} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${textPrimary}`}>Weekly Offerings</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-blue-600"></div>
                    <span className={`text-[9px] ${textSecondary}`}>Revenue</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] ${textSecondary} mb-1`}>Total Revenue</p>
                  <p className={`text-sm md:text-base font-bold ${textPrimary} truncate`}>
                    {loading ? '...' : `TZS ${(financialData.totalIncome / 1000).toFixed(0)}k`}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right ml-2">
                  <p className={`text-[10px] ${textSecondary} mb-1`}>Monthly</p>
                  <p className={`text-sm md:text-base font-semibold ${textPrimary} truncate`}>
                    {loading ? '...' : `TZS ${(financialData.monthlyIncome / 1000).toFixed(0)}k`}
                  </p>
                </div>

                <div className="flex-shrink-0 ml-3">
                  <div className={`${darkMode ? 'bg-blue-600' : 'bg-blue-50'} px-3 py-1 rounded-lg`}>
                    <p className={`text-sm md:text-base font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                      {loading ? '...' : `${Math.max(...(financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)) || [0]))}K`}
                    </p>
                  </div>
                </div>
              </div>
              {/* Mini Bar Chart */}
              <div className="h-16 flex items-end gap-1">
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
                  const height = Math.max((bar.amount / maxAmount) * 48, 4);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${height}px` }}
                      ></div>
                      <span className={`text-[8px] mt-1 ${textSecondary}`}>{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Attendance Card */}
              <div className={`${cardBg} rounded-xl p-3 ${borderClass} shadow-sm`}>
                <h3 className={`text-sm font-bold ${textPrimary} mb-3`}>Attendance Overview</h3>
                <AttendanceCard 
                  period="monthly"
                  noWrapper
                />
              </div>

            {/* Mobile Department Leaders */}
            <div className={`${cardBg} rounded-xl p-3 ${borderClass} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${textPrimary}`}>Best Leaders</h3>
                <span className={`text-[10px] ${textSecondary}`}>{departmentLeaders.length} leaders</span>
              </div>
              <div className="space-y-2">
                {departmentLeaders.length > 0 ? (
                  departmentLeaders.slice(0, 4).map((leader, index) => (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="relative">
                        <img
                          src={leader.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`}
                          alt={leader.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        {index < 3 && (
                          <div className="absolute -top-0.5 -left-0.5 bg-red-500 rounded-full p-0.5 shadow-sm">
                            <Crown className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${textPrimary} truncate`}>{leader.name}</p>
                        <p className={`text-[10px] ${textSecondary} truncate`}>{leader.departmentName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex text-yellow-400 text-[8px]">
                          {'★★★★★'}
                        </div>
                        <span className={`text-[8px] ${textSecondary}`}>5.0</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs text-center py-4 ${textSecondary}`}>
                    {loading ? 'Loading...' : 'No leaders found'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========== DESKTOP VIEW (hidden on small screens) ========== */}
          <div className="hidden sm:grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 w-full">
            {/* Left Column - Stats and Charts */}
            <div className="col-span-1 lg:col-span-7 space-y-4 sm:space-y-6 w-full">
              {/* Stats Cards Grid - 2x2 on mobile, 2x2 on desktop */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 w-full">
                {/* Total Departments Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0`}>
                  <div className={`inline-flex p-2.5 sm:p-4 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-xl sm:rounded-2xl mb-3 sm:mb-4`}>
                    <Building2 className={`h-5 w-5 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Total Departments</p>
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : dashboardData.totalDepartments}
                  </h3>
                </div>

                {/* Church Income Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0`}>
                  <div className={`inline-flex p-2.5 sm:p-4 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-xl sm:rounded-2xl mb-3 sm:mb-4`}>
                    <svg className={`h-5 w-5 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Church Income</p>
                  <h3 className={`text-xl sm:text-2xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : `TZS ${(financialData.totalIncome / 1000000).toFixed(1)}M`}
                  </h3>
                </div>

                {/* Total Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0`}>
                  <div className={`inline-flex p-2.5 sm:p-4 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-xl sm:rounded-2xl mb-3 sm:mb-4`}>
                    <Users className={`h-5 w-5 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Total Members</p>
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : dashboardData.totalMembers.toLocaleString()}
                  </h3>
                </div>

                {/* Active Events Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0`}>
                  <div className={`inline-flex p-2.5 sm:p-4 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-xl sm:rounded-2xl mb-3 sm:mb-4`}>
                    <svg className={`h-5 w-5 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Active Events</p>
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>12</h3>
                </div>
              </div>

              {/* Members Donut Chart */}
              <div className={`${cardBg} rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 border ${borderColor} shadow-sm w-full`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
                  <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${textPrimary}`}>Members (%)</h3>
                  <select className={`px-4 sm:px-6 py-2 sm:py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tag-red-500 focus:border-tag-red-500`}>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 lg:gap-8">
                  {/* Left side - Total Members */}
                  <div className="flex-shrink-0 text-center lg:text-left w-full lg:w-auto">
                    <p className={`text-xs sm:text-sm ${textSecondary} mb-2 sm:mb-3`}>Total Members</p>
                    <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${textPrimary}`}>
                      {loading ? '...' : `${dashboardData.totalMembers.toLocaleString()} People`}
                    </p>
                  </div>

                  {/* Right side - Donut Chart and Legend */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 lg:gap-12 w-full lg:w-auto">
                    {/* Donut Chart */}
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      {(() => {
                        if (loading) {
                          return (
                            <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] flex items-center justify-center">
                              <p className={textSecondary}>Loading...</p>
                            </div>
                          );
                        }

                        const totalMembers = dashboardData.totalMembers;
                        if (totalMembers === 0) {
                          return (
                            <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] flex items-center justify-center">
                              <p className={textSecondary}>No data</p>
                            </div>
                          );
                        }

                        const youthRatio = dashboardData.membersByAge.youth / totalMembers;
                        const adultsRatio = dashboardData.membersByAge.adults / totalMembers;
                        const seniorsRatio = dashboardData.membersByAge.seniors / totalMembers;

                        return (
                          <svg className="transform -rotate-90 w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px]" viewBox="0 0 200 200">
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
                                <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
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
                        <p className={`text-[10px] sm:text-xs ${textSecondary} mb-0.5 sm:mb-1`}>Active</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                          {loading ? '...' : '100%'}
                        </p>
                      </div>
                    </div>

                    {/* Legend - Vertical layout */}
                    <div className="flex flex-col space-y-3 sm:space-y-4 w-full sm:w-auto">
                      <div className="flex items-center justify-between space-x-4 sm:space-x-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-cyan-400 flex-shrink-0"></div>
                          <span className={`text-xs sm:text-sm ${textSecondary}`}>Youth (15-35)</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                          {loading ? '...' : `${dashboardData.membersByAge.youth} (${dashboardData.totalMembers > 0 ? Math.round((dashboardData.membersByAge.youth / dashboardData.totalMembers) * 100) : 0}%)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-4 sm:space-x-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-blue-600 flex-shrink-0"></div>
                          <span className={`text-xs sm:text-sm ${textSecondary}`}>Adults (36-60)</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                          {loading ? '...' : `${dashboardData.membersByAge.adults} (${dashboardData.totalMembers > 0 ? Math.round((dashboardData.membersByAge.adults / dashboardData.totalMembers) * 100) : 0}%)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-4 sm:space-x-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-red-500 flex-shrink-0"></div>
                          <span className={`text-xs sm:text-sm ${textSecondary}`}>Seniors (61+)</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                          {loading ? '...' : `${dashboardData.membersByAge.seniors} (${dashboardData.totalMembers > 0 ? Math.round((dashboardData.membersByAge.seniors / dashboardData.totalMembers) * 100) : 0}%)`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Offerings Chart */}
              <div className={`${cardBg} rounded-2xl sm:rounded-3xl p-3 sm:p-6 border ${borderColor} shadow-sm w-full`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <h3 className={`text-base sm:text-lg md:text-xl font-bold ${textPrimary}`}>Weekly Offerings</h3>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-gray-300"></div>
                      <span className={`text-[10px] sm:text-xs ${textSecondary}`}>Last month</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-blue-600"></div>
                      <span className={`text-[10px] sm:text-xs ${textSecondary}`}>Revenue</span>
                    </div>
                    <select className={`px-3 sm:px-4 py-1 sm:py-1.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50`}>
                      <option>2024</option>
                      <option>2023</option>
                    </select>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex-1 min-w-[100px]">
                    <p className={`text-[10px] sm:text-xs ${textSecondary} mb-0.5 sm:mb-1`}>Total Revenue</p>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${textPrimary}`}>
                      {loading ? 'Loading...' : `TZS ${(financialData.totalIncome / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <p className={`text-[10px] sm:text-xs ${textSecondary} mb-0.5 sm:mb-1`}>Monthly Income</p>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${textPrimary}`}>
                      {loading ? 'Loading...' : `TZS ${(financialData.monthlyIncome / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-blue-600' : 'bg-blue-50'} px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl`}>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                      {loading ? '...' : `${Math.max(...(financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)) || [0]))}K`}
                    </p>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="relative" style={{ height: '140px' }}>
                  {/* Floating label above highest bar - visible only on small screens */}
                  {financialData.weeklyOfferings.length > 0 && (
                    <div className="absolute top-0 left-[62%] transform -translate-x-1/2 bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-lg z-10 block sm:hidden">
                      <p className="text-white text-xs font-bold">
                        {Math.max(...financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)), 0)}K
                      </p>
                    </div>
                  )}

                  {/* Bar Chart Container */}
                  <div className="h-full flex items-end justify-between gap-1 sm:gap-2 md:gap-4 pt-6 sm:pt-10">
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
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              {/* Attendance Card */}
              <AttendanceCard 
                period="monthly"
                className="rounded-3xl"
              />

              {/* Visitors Area Chart */}
              <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>Visitors</h3>
                  <select className={`px-6 py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tag-red-500 focus:border-tag-red-500`}>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                {/* Area Chart */}
                <div className="relative h-64">
                  {/* Floating value label */}
                  <div className="absolute top-8 right-32 z-10">
                    <p className={`text-sm ${textSecondary} mb-1`}>14 Apr</p>
                    <p className="text-3xl font-bold text-blue-600">
                      32.61 <span className="text-base font-semibold text-green-500">30% ↑</span>
                    </p>
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
              </div>

              {/* Best Department Leaders */}
              <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Best Department Leaders</h3>
                  <button className="text-sm text-red-600 hover:text-red-700 flex items-center">
                    See all
                    <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                  </button>
                </div>

                <div className="space-y-4">
                  {departmentLeaders.length > 0 ? (
                    departmentLeaders.map((leader: any) => (
                      <div key={leader.id} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'hover:bg-tag-gray-900' : 'hover:bg-tag-gray-50'} transition-colors cursor-pointer`}>
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {/* Badge positioned on left side */}
                            <div className="absolute -top-1 -left-1 h-6 w-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center z-10">
                              <Crown className="text-white h-3.5 w-3.5" />
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
                          className="px-5 py-2 bg-red-100 border border-red-600 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 hover:text-red-800 transition-colors"
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
                    <div className="relative inline-block w-44 h-44 overflow-visible">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                        <circle cx="64" cy="64" r="54" fill="none" stroke="#ffffff" strokeWidth="6" />
                        <circle cx="64" cy="64" r="64" fill="none" stroke="#fee2e2" strokeWidth="6" />
                      </svg>

                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full overflow-hidden bg-white shadow-inner">
                        <img
                          src={userProfile.photo_url || '/default-avatar.png'}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md cursor-pointer">
                        <div className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handlePhotoUpload(file);
                              }
                            }}
                          />
                          📷
                        </div>
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
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>
                        Phone
                      </label>
                      <input
                        type="text"
                        value={userProfile.phone || ''}
                        readOnly
                        className={`w-full px-3 py-2 border ${borderColor} rounded-md ${inputBg} ${textSecondary} bg-gray-100`}
                      />
                    </div>
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
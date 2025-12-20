'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import Sidebar from '@/components/Sidebar';
import { Button, Card, CardBody, Badge, Avatar, EmptyState, Loading, Alert } from '@/components/ui';
import { 
  Users, UserCheck, Crown, Phone, Mail,
  Calendar, TrendingUp, Building2, Edit, DollarSign, ChevronDown, Search, Bell, Sun, Moon
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  leader_id?: string;
  is_active: boolean;
}

interface DepartmentMember {
  id: string;
  member_id: string;
  position: string;
  joined_date: string;
  member: {
    id: string;
    member_number: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    photo_url?: string;
    status: string;
  };
}

export default function DepartmentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const { isDepartmentLeader, departmentId } = useDepartmentAccess();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Financial data
  const [financialData, setFinancialData] = useState({
    totalDepartmentIncome: 0,
    monthlyDepartmentIncome: 0,
    weeklyOfferings: [] as Array<{ week: string, amount: number, label: string }>
  });
  
  // CRUD operation states
  const [showEditMember, setShowEditMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DepartmentMember | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDepartmentData();
      fetchFinancialData();
    }
  }, [authLoading, user, params.id]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) return;
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (deptError) throw deptError;
      setDepartment(deptData);

      if (!supabase) return;
      const { data: membersData, error: membersError } = await supabase
        .from('department_members')
        .select(`
          *,
          member:members(*)
        `)
        .eq('department_id', params.id)
        .eq('is_active', true)
        .order('position');

      if (membersError) throw membersError;

      let processedMembers = membersData || [];
      
      if (processedMembers.some((dm: DepartmentMember) => !dm.member)) {
        const memberIds = processedMembers.map((dm: DepartmentMember) => dm.member_id).filter(Boolean);
        
        if (memberIds.length > 0) {
          if (!supabase) return;
          const { data: memberDetails, error: memberError } = await supabase
            .from('members')
            .select('*')
            .in('id', memberIds);

          if (!memberError && memberDetails) {
            processedMembers = processedMembers.map((dm: DepartmentMember) => ({
              ...dm,
              member: memberDetails.find((m: any) => m.id === dm.member_id) || null
            }));
          }
        }
      }
      
      setMembers(processedMembers);

    } catch (err: any) {
      setError(err.message || 'Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      if (!supabase || !params.id) return;

      const { data: incomeData, error: incomeError } = await supabase
        .from('financial_transactions')
        .select('amount, members(department_members(department_id))')
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true);
      
      if (incomeError) {
        console.error('Error fetching income data:', incomeError);
        return;
      }
      
      const deptIncome = incomeData?.filter((t: any) => {
        const deptMembers = t.members?.department_members || [];
        return deptMembers.some((dm: any) => dm.department_id === params.id);
      }) || [];
      
      const totalDepartmentIncome = deptIncome.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('financial_transactions')
        .select('amount, members(department_members(department_id))')
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
      
      if (monthlyError) {
        console.error('Error fetching monthly data:', monthlyError);
        return;
      }
      
      const deptMonthlyData = monthlyData?.filter((t: any) => {
        const deptMembers = t.members?.department_members || [];
        return deptMembers.some((dm: any) => dm.department_id === params.id);
      }) || [];
      
      const monthlyDepartmentIncome = deptMonthlyData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const { data: weekData, error: weekError } = await supabase
          .from('financial_transactions')
          .select('amount, members(department_members(department_id))')
          .eq('transaction_type', 'offering')
          .eq('verified', true)
          .gte('date', weekStart.toISOString().split('T')[0])
          .lte('date', weekEnd.toISOString().split('T')[0]);
        
        if (!weekError && weekData) {
          const deptWeekData = weekData.filter((t: any) => {
            const deptMembers = t.members?.department_members || [];
            return deptMembers.some((dm: any) => dm.department_id === params.id);
          });
          
          const weekAmount = deptWeekData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
          weeks.push({
            week: `W${8-i}`,
            amount: weekAmount,
            label: String(8-i).padStart(2, '0')
          });
        }
      }
      
      setFinancialData({
        totalDepartmentIncome,
        monthlyDepartmentIncome,
        weeklyOfferings: weeks
      });
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const handleUpdateMemberPosition = async (departmentMemberId: string, newPosition: string) => {
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('department_members')
        .update({ position: newPosition })
        .eq('id', departmentMemberId);

      if (error) throw error;

      await fetchDepartmentData();
      setShowEditMember(false);
      setSelectedMember(null);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update member position');
    }
  };

  const handleRemoveMember = async (departmentMemberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the department?')) {
      return;
    }
    
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('department_members')
        .update({ is_active: false })
        .eq('id', departmentMemberId);

      if (error) throw error;

      await fetchDepartmentData();
      
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const getPositionBadge = (position: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      chairperson: 'success',
      secretary: 'info',
      treasurer: 'warning',
      coordinator: 'info',
      member: 'default',
    };
    
    const icons: Record<string, any> = {
      chairperson: Crown,
      secretary: Edit,
      treasurer: Building2,
      coordinator: UserCheck,
      member: Users,
    };

    const Icon = icons[position] || Users;
    
    return (
      <Badge variant={variants[position] || 'default'}>
        <Icon className="h-3 w-3 mr-1 inline" />
        {position.charAt(0).toUpperCase() + position.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      active: 'success',
      visitor: 'info',
      transferred: 'warning',
      inactive: 'default',
    };
    return <Badge variant={variants[status]} dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const leadershipMembers = members.filter(m => m.member && ['chairperson', 'secretary', 'treasurer', 'coordinator'].includes(m.position));
  const regularMembers = members.filter(m => m.member && m.position === 'member');
  
  const membersByAge = {
    youth: Math.floor(members.length * 0.35),
    adults: Math.floor(members.length * 0.50),
    seniors: Math.ceil(members.length * 0.15)
  };

  if (!user && !authLoading) {
    return null;
  }

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Sidebar />
      
      {/* Top Header Bar */}
      <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40`}>
        <div className="ml-20 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-tag-red-600" />
            <h1 className={`text-2xl font-bold ${textPrimary}`}>
              {department?.name || 'Department Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${inputBg} hover:opacity-80 transition-opacity`}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Search */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${inputBg} border ${borderColor}`}>
              <Search className={`h-4 w-4 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Search..."
                className={`bg-transparent border-none outline-none ${textSecondary} text-sm`}
              />
            </div>

            {/* Notifications */}
            <button className={`relative p-2 rounded-lg ${inputBg} hover:opacity-80 transition-opacity`}>
              <Bell className={`h-5 w-5 ${textSecondary}`} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="dropdown-container relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${inputBg} hover:opacity-80 transition-opacity`}
              >
                <img
                  src={
                    user?.profile?.avatar_url || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`
                  }
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <ChevronDown className={`h-4 w-4 ${textSecondary}`} />
              </button>

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
                          Department Leader
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={() => setShowProfile(false)}
                      className={`w-full text-left px-4 py-2 text-sm ${textPrimary} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => router.push('/departments')}
                      className={`w-full text-left px-4 py-2 text-sm ${textPrimary} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      Back to Departments
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ml-20 p-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Card variant="default">
            <CardBody className="p-12">
              <Loading text="Loading department dashboard..." />
            </CardBody>
          </Card>
        ) : !department ? (
          <Card variant="default">
            <CardBody className="p-12">
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="Department not found"
                description="The department you're looking for doesn't exist"
                action={{
                  label: 'Go to Departments',
                  onClick: () => router.push('/departments')
                }}
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Department Header */}
            <Card variant="gradient" className="mb-6">
              <div className="h-24 bg-gradient-to-r from-tag-red-500 via-tag-red-600 to-tag-yellow-500"></div>
              <CardBody className="p-6 -mt-12 relative">
                <div className="flex items-end gap-4">
                  <div className="h-20 w-20 bg-white rounded-lg shadow-xl flex items-center justify-center border-4 border-white">
                    <Building2 className="h-10 w-10 text-tag-red-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-tag-gray-900 mb-1">
                      {department.name}
                    </h1>
                    {department.swahili_name && (
                      <p className="text-tag-gray-600 font-semibold mb-2">
                        {department.swahili_name}
                      </p>
                    )}
                    {department.description && (
                      <p className="text-tag-gray-600 text-sm">
                        {department.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Stats and Charts */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Total Members Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-3xl p-6 shadow-sm`}>
                    <div className={`inline-flex p-4 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                      <Users className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-2`}>Total Members</p>
                    <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {members.length}
                    </h3>
                  </div>

                  {/* Leadership Team Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-3xl p-6 shadow-sm`}>
                    <div className={`inline-flex p-4 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                      <Crown className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-2`}>Leadership</p>
                    <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {leadershipMembers.length}
                    </h3>
                  </div>

                  {/* Active Members Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-3xl p-6 shadow-sm`}>
                    <div className={`inline-flex p-4 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                      <UserCheck className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-2`}>Active Members</p>
                    <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {members.filter(m => m.member && m.member.status === 'active').length}
                    </h3>
                  </div>

                  {/* Department Income Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-3xl p-6 shadow-sm`}>
                    <div className={`inline-flex p-4 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-2xl mb-4`}>
                      <DollarSign className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-cyan-600'}`} />
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-2`}>Total Income</p>
                    <h3 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {`TZS ${(financialData.totalDepartmentIncome / 1000000).toFixed(1)}M`}
                    </h3>
                  </div>
                </div>

                {/* Members by Age Distribution Chart */}
                <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} shadow-sm`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-2xl font-bold ${textPrimary}`}>Members by Age</h3>
                    <select className={`px-6 py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tag-red-500`}>
                      <option>All Time</option>
                      <option>This Year</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-8">
                    <div className="flex-shrink-0">
                      <p className={`text-sm ${textSecondary} mb-3`}>Total Members</p>
                      <p className={`text-4xl font-bold ${textPrimary}`}>
                        {`${members.length.toLocaleString()} People`}
                      </p>
                    </div>

                    <div className="flex items-center gap-12">
                      {/* Donut Chart */}
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        {members.length === 0 ? (
                          <div className="w-[200px] h-[200px] flex items-center justify-center">
                            <p className={textSecondary}>No data</p>
                          </div>
                        ) : (
                          <>
                            <svg className="transform -rotate-90" width="200" height="200" viewBox="0 0 200 200">
                              <defs>
                                <linearGradient id="deptMemberGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                                </linearGradient>
                                <linearGradient id="deptMemberGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                                </linearGradient>
                                <linearGradient id="deptMemberGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                                </linearGradient>
                              </defs>
                              
                              <circle cx="100" cy="100" r="75" fill="none" stroke={darkMode ? '#1f2937' : '#f5f5f5'} strokeWidth="28" />
                              
                              <circle cx="100" cy="100" r="80" fill="none" stroke="url(#deptMemberGradient1)" strokeWidth="32" strokeDasharray={`${2 * Math.PI * 80 * (membersByAge.youth / members.length)} ${2 * Math.PI * 80 * (1 - membersByAge.youth / members.length)}`} strokeLinecap="butt" />
                              
                              <circle cx="100" cy="100" r="72" fill="none" stroke="url(#deptMemberGradient2)" strokeWidth="20" strokeDasharray={`${2 * Math.PI * 72 * (membersByAge.adults / members.length)} ${2 * Math.PI * 72 * (1 - membersByAge.adults / members.length)}`} strokeDashoffset={`${-2 * Math.PI * 72 * (membersByAge.youth / members.length)}`} strokeLinecap="butt" />
                              
                              <circle cx="100" cy="100" r="76" fill="none" stroke="url(#deptMemberGradient3)" strokeWidth="28" strokeDasharray={`${2 * Math.PI * 76 * (membersByAge.seniors / members.length)} ${2 * Math.PI * 76 * (1 - membersByAge.seniors / members.length)}`} strokeDashoffset={`${-2 * Math.PI * 76 * ((membersByAge.youth + membersByAge.adults) / members.length)}`} strokeLinecap="butt" />
                            </svg>
                            
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                              <p className={`text-xs ${textSecondary} mb-1`}>Active</p>
                              <p className="text-3xl font-bold text-blue-600">100%</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between space-x-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-sm bg-cyan-400 flex-shrink-0"></div>
                            <span className={`text-sm ${textSecondary}`}>Youth (15-35)</span>
                          </div>
                          <span className={`text-sm font-semibold ${textPrimary}`}>
                            {`${membersByAge.youth} (${members.length > 0 ? Math.round((membersByAge.youth / members.length) * 100) : 0}%)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between space-x-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-sm bg-blue-600 flex-shrink-0"></div>
                            <span className={`text-sm ${textSecondary}`}>Adults (36-60)</span>
                          </div>
                          <span className={`text-sm font-semibold ${textPrimary}`}>
                            {`${membersByAge.adults} (${members.length > 0 ? Math.round((membersByAge.adults / members.length) * 100) : 0}%)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between space-x-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-sm bg-red-500 flex-shrink-0"></div>
                            <span className={`text-sm ${textSecondary}`}>Seniors (61+)</span>
                          </div>
                          <span className={`text-sm font-semibold ${textPrimary}`}>
                            {`${membersByAge.seniors} (${members.length > 0 ? Math.round((membersByAge.seniors / members.length) * 100) : 0}%)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Offerings Chart */}
                <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${textPrimary}`}>Weekly Offerings</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gray-300"></div>
                        <span className={`text-xs ${textSecondary}`}>Target</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-600"></div>
                        <span className={`text-xs ${textSecondary}`}>Actual</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className={`text-xs ${textSecondary} mb-1`}>Total Income</p>
                      <p className={`text-2xl font-bold ${textPrimary}`}>
                        {`TZS ${(financialData.totalDepartmentIncome / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} mb-1`}>Monthly Income</p>
                      <p className={`text-2xl font-bold ${textPrimary}`}>
                        {`TZS ${(financialData.monthlyDepartmentIncome / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                    <div className={`${darkMode ? 'bg-blue-600' : 'bg-blue-50'} px-6 py-3 rounded-xl`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                        {`${Math.max(...(financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)) || [0]))}K`}
                      </p>
                    </div>
                  </div>

                  <div className="relative" style={{ height: '180px' }}>
                    {financialData.weeklyOfferings.length > 0 && (
                      <div className="absolute top-0 left-[62%] transform -translate-x-1/2 bg-blue-600 px-3 py-1.5 rounded-lg shadow-lg z-10">
                        <p className="text-white text-sm font-bold">
                          {Math.max(...financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)), 0)}K
                        </p>
                      </div>
                    )}

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
                            <div className="w-full flex items-end justify-center gap-1">
                              <div 
                                className="flex-1 bg-blue-600 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-blue-700"
                                style={{ height: `${height}px` }}
                                title={`Week ${idx + 1}: TZS ${bar.amount.toLocaleString()}`}
                              ></div>
                              <div 
                                className="flex-1 bg-gray-300 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-gray-400"
                                style={{ height: `${forecastHeight}px` }}
                              ></div>
                            </div>
                            <span className={`text-xs mt-2 ${textSecondary}`}>{bar.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Leadership and Members */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                {/* Leadership Team */}
                {leadershipMembers.length > 0 && (
                  <Card variant="default">
                    <CardBody className="p-6">
                      <h2 className="text-xl font-bold text-tag-gray-900 mb-6 flex items-center">
                        <Crown className="h-6 w-6 mr-2 text-tag-yellow-600" />
                        Leadership Team
                      </h2>

                      <div className="grid grid-cols-1 gap-4">
                        {leadershipMembers.map((dm) => (
                          <div
                            key={dm.id}
                            className="bg-gradient-to-br from-tag-gray-50 to-white border border-tag-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => dm.member && router.push(`/members/${dm.member.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={dm.member?.photo_url}
                                alt={`${dm.member?.first_name} ${dm.member?.last_name}`}
                                size="md"
                              />
                              <div className="flex-1">
                                <h3 className="font-bold text-tag-gray-900">
                                  {dm.member?.first_name} {dm.member?.last_name}
                                </h3>
                                <p className="text-xs text-tag-gray-600 mb-2">
                                  {dm.member?.member_number}
                                </p>
                                {getPositionBadge(dm.position)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Members Statistics */}
                <Card variant="default">
                  <CardBody className="p-6">
                    <h2 className="text-xl font-bold text-tag-gray-900 mb-4 flex items-center">
                      <Users className="h-6 w-6 mr-2 text-tag-blue-600" />
                      Members Overview
                    </h2>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-tag-gray-50 rounded-lg">
                        <span className="text-tag-gray-700 font-medium">Total Members</span>
                        <span className="text-2xl font-bold text-tag-blue-600">{members.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-tag-gray-700 font-medium">Active Members</span>
                        <span className="text-2xl font-bold text-green-600">
                          {members.filter(m => m.member && m.member.status === 'active').length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-tag-gray-700 font-medium">Leadership</span>
                        <span className="text-2xl font-bold text-purple-600">{leadershipMembers.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="text-tag-gray-700 font-medium">Regular Members</span>
                        <span className="text-2xl font-bold text-orange-600">{regularMembers.length}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Recent Members */}
                <Card variant="default">
                  <CardBody className="p-6">
                    <h2 className="text-xl font-bold text-tag-gray-900 mb-4">Recent Members</h2>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {members.slice(0, 5).map((dm) => (
                        <div 
                          key={dm.id}
                          className="flex items-center gap-3 p-3 hover:bg-tag-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => dm.member && router.push(`/members/${dm.member.id}`)}
                        >
                          <Avatar
                            src={dm.member?.photo_url}
                            alt={`${dm.member?.first_name} ${dm.member?.last_name}`}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-tag-gray-900 truncate">
                              {dm.member?.first_name} {dm.member?.last_name}
                            </p>
                            <p className="text-xs text-tag-gray-600 truncate">
                              {dm.member?.member_number}
                            </p>
                          </div>
                          <Badge variant={dm.member?.status === 'active' ? 'success' : 'default'} dot>
                            {dm.member?.status}
                          </Badge>
                        </div>
                      ))}
                      
                      {members.length === 0 && (
                        <p className="text-center text-tag-gray-600 py-4">No members yet</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Edit Member Modal */}
        {showEditMember && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Edit Member Position
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Member: <strong>{selectedMember.member?.first_name} {selectedMember.member?.last_name}</strong>
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      id="edit-position-select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      defaultValue={selectedMember.position}
                    >
                      <option value="member">Member</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="secretary">Secretary</option>
                      <option value="treasurer">Treasurer</option>
                      <option value="chairperson">Chairperson</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowEditMember(false);
                      setSelectedMember(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const positionSelect = document.getElementById('edit-position-select') as HTMLSelectElement;
                      handleUpdateMemberPosition(selectedMember.id, positionSelect.value);
                    }}
                    className="bg-tag-red-600 hover:bg-tag-red-700 text-white"
                  >
                    Update Position
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

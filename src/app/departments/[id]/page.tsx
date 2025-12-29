'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { Button, Card, CardBody, Badge, Avatar, EmptyState, Loading, Alert, Table } from '@/components/ui';
import { 
  ArrowLeft, Users, UserCheck, Crown, Briefcase, Phone, Mail,
  Calendar, TrendingUp, Building2, Edit, DollarSign, ChevronDown
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
  const { isDepartmentLeader, departmentId, loading: deptAccessLoading } = useDepartmentAccess();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Financial data
  const [financialData, setFinancialData] = useState({
    totalDepartmentIncome: 0,
    monthlyDepartmentIncome: 0,
    totalDepartmentExpenses: 0,
    monthlyDepartmentExpenses: 0,
    weeklyFinances: [] as Array<{ week: string, income: number, expenses: number, label: string }>
  });
  
  // CRUD operation states
  const [showEditMember, setShowEditMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DepartmentMember | null>(null);

  // Wait for auth and department access to be ready before fetching data
  useEffect(() => {
    if (!authLoading && !deptAccessLoading && user && !isInitialized) {
      setIsInitialized(true);
      fetchDepartmentData();
      fetchFinancialData();
    }
  }, [authLoading, deptAccessLoading, user, isInitialized, params.id]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      if (!supabase) return;
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (deptError) throw deptError;
      setDepartment(deptData);

      // Fetch department members with member details - using fallback approach for broken relationships
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

      // For broken relationships, fetch members separately and merge
      let processedMembers = membersData || [];
      
      if (processedMembers.some((dm: DepartmentMember) => !dm.member)) {
        console.log('🔧 Fixing broken member relationships...');
        
        // Get all member IDs from department_members
        const memberIds = processedMembers.map((dm: DepartmentMember) => dm.member_id).filter(Boolean);
        
        if (memberIds.length > 0) {
          // Fetch member details separately
          if (!supabase) return;
          const { data: memberDetails, error: memberError } = await supabase
            .from('members')
            .select('*')
            .in('id', memberIds);

          if (!memberError && memberDetails) {
            // Merge member details back into department_members
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
      console.log(`🔄 DEPARTMENT DASHBOARD: Starting financial data fetch for department: ${params.id}`);
      
      if (!supabase || !params.id) {
        console.error('Supabase client or department ID not available');
        return;
      }

      // Check what transaction types are available in the database
      const { data: typeCheck, error: typeError } = await supabase
        .from('financial_transactions')
        .select('transaction_type')
        .limit(50);
      
      if (typeError) {
        console.warn('Financial transactions table not accessible, using default values:', typeError);
        // Set default empty financial data
        setFinancialData({
          totalDepartmentIncome: 0,
          monthlyDepartmentIncome: 0,
          totalDepartmentExpenses: 0,
          monthlyDepartmentExpenses: 0,
          weeklyFinances: Array.from({ length: 8 }, (_, i) => ({
            week: `W${i + 1}`,
            income: 0,
            expenses: 0,
            label: String(i + 1).padStart(2, '0')
          }))
        });
        return;
      }

      // Extract available transaction types
      const availableTypes = [...new Set(typeCheck?.map(t => t.transaction_type) || [])];
      console.log('Available transaction types:', availableTypes);
      
      // Define income and expense types based on what's available
      const incomeTypes = availableTypes.filter(type => 
        ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'].includes(type)
      );
      const expenseTypes = availableTypes.filter(type => 
        ['expense', 'withdrawal'].includes(type) || type.toLowerCase().includes('expense')
      );
      
      console.log(`📊 Query setup for Department ${params.id}:`, {
        incomeTypes,
        expenseTypes,
        willUseAmountFallback: {
          income: incomeTypes.length === 0,
          expense: expenseTypes.length === 0
        }
      });

      // Fetch total department income using department_id directly
      let incomeData = null, incomeError = null;
      if (incomeTypes.length > 0) {
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .in('transaction_type', incomeTypes)
          .eq('verified', true)
          .eq('department_id', params.id);
        incomeData = result.data;
        incomeError = result.error;
      } else {
        // Fallback to positive amounts if no income types found
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .gt('amount', 0)
          .eq('verified', true)
          .eq('department_id', params.id);
        incomeData = result.data;
        incomeError = result.error;
      }
      
      if (incomeError) {
        console.warn('Could not fetch income data, using default values:', incomeError);
        // Continue with default values rather than failing completely
      }
      
      // No need to filter - transactions are already department-specific
      const deptIncome = incomeData || [];
      
      console.log(`🔍 Department ${params.id} Income Debug:`, {
        totalTransactions: incomeData?.length || 0,
        departmentTransactions: deptIncome.length,
        transactionAmounts: deptIncome.map(t => ({ id: t.id, amount: t.amount, type: t.transaction_type })),
        directDepartmentAssociation: 'Using department_id field directly - no member filtering needed'
      });
      
      const totalDepartmentIncome = deptIncome.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      console.log(`💰 DEPARTMENT DASHBOARD Total Income: TZS ${totalDepartmentIncome.toLocaleString()}`);
      console.log(`📊 DEPARTMENT DASHBOARD Financial Summary:`, {
        departmentId: params.id,
        totalIncomeTransactions: deptIncome.length,
        totalIncomeAmount: totalDepartmentIncome,
        displayedAmount: `TZS ${(totalDepartmentIncome / 1000000).toFixed(1)}M`
      });

      // Fetch total department expenses using department_id directly
      let expenseData = null, expenseError = null;
      if (expenseTypes.length > 0) {
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .in('transaction_type', expenseTypes)
          .eq('verified', true)
          .eq('department_id', params.id);
        expenseData = result.data;
        expenseError = result.error;
      } else {
        // Fallback to negative amounts if no expense types found
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .lt('amount', 0)
          .eq('verified', true)
          .eq('department_id', params.id);
        expenseData = result.data;
        expenseError = result.error;
      }
      
      if (expenseError) {
        console.warn('Could not fetch expense data, using income-only view:', expenseError);
        // Continue without expenses rather than failing completely
      }
      
      // No need to filter - transactions are already department-specific
      const deptExpenses = expenseData || [];
      
      const totalDepartmentExpenses = deptExpenses.reduce((sum: number, t: any) => {
        // Use absolute value for negative amounts, regular value for expense types
        const amount = t.amount < 0 ? Math.abs(t.amount) : t.amount;
        return sum + (amount || 0);
      }, 0) || 0;
      
      // Fetch current month department income and expenses
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      // Monthly income using department_id directly
      let monthlyIncomeData = null, monthlyIncomeError = null;
      if (incomeTypes.length > 0) {
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .in('transaction_type', incomeTypes)
          .eq('verified', true)
          .eq('department_id', params.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
        monthlyIncomeData = result.data;
        monthlyIncomeError = result.error;
      } else {
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .gt('amount', 0)
          .eq('verified', true)
          .eq('department_id', params.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
        monthlyIncomeData = result.data;
        monthlyIncomeError = result.error;
      }
      
      if (monthlyIncomeError) {
        console.warn('Could not fetch monthly income data:', monthlyIncomeError);
        // Continue without monthly income data
      }
      
      // No need to filter - transactions are already department-specific
      const deptMonthlyIncomeData = monthlyIncomeData || [];
      
      const monthlyDepartmentIncome = deptMonthlyIncomeData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      // Monthly expenses using department_id directly
      let monthlyExpenseData = null, monthlyExpenseError = null;
      if (expenseTypes.length > 0) {
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .in('transaction_type', expenseTypes)
          .eq('verified', true)
          .eq('department_id', params.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
        monthlyExpenseData = result.data;
        monthlyExpenseError = result.error;
      } else {
        const result = await supabase
          .from('financial_transactions')
          .select('amount, transaction_type')
          .lt('amount', 0)
          .eq('verified', true)
          .eq('department_id', params.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
        monthlyExpenseData = result.data;
        monthlyExpenseError = result.error;
      }
      
      if (monthlyExpenseError) {
        console.warn('Could not fetch monthly expense data:', monthlyExpenseError);
        // Continue without monthly expenses
      }
      
      // No need to filter - transactions are already department-specific
      const deptMonthlyExpenseData = monthlyExpenseData || [];
      
      const monthlyDepartmentExpenses = deptMonthlyExpenseData.reduce((sum: number, t: any) => {
        const amount = t.amount < 0 ? Math.abs(t.amount) : t.amount;
        return sum + (amount || 0);
      }, 0) || 0;
      
      // Helper function to fetch weekly data with proper type handling using department_id directly
      const fetchWeeklyData = async (weekStart: Date, weekEnd: Date, isIncome: boolean) => {
        const types = isIncome ? incomeTypes : expenseTypes;
        if (types.length > 0) {
          return await supabase
            .from('financial_transactions')
            .select('amount, transaction_type')
            .in('transaction_type', types)
            .eq('verified', true)
            .eq('department_id', params.id)
            .gte('date', weekStart.toISOString().split('T')[0])
            .lte('date', weekEnd.toISOString().split('T')[0]);
        } else {
          // Fallback to amount-based filtering
          return await supabase
            .from('financial_transactions')
            .select('amount, transaction_type')
            [isIncome ? 'gt' : 'lt']('amount', 0)
            .eq('verified', true)
            .eq('department_id', params.id)
            .gte('date', weekStart.toISOString().split('T')[0])
            .lte('date', weekEnd.toISOString().split('T')[0]);
        }
      };

      // Fetch weekly finances for the last 8 weeks
      // Configure as: weeks 1-4 for last month, weeks 5-8 for current month
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const weeks = [];
      
      // Weeks 1-4: Last month (split into 4 weeks)
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(lastMonth);
        weekStart.setDate(1 + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Fetch income and expenses for this week using helper function
        const { data: weekIncomeData, error: weekIncomeError } = await fetchWeeklyData(weekStart, weekEnd, true);
        const { data: weekExpenseData, error: weekExpenseError } = await fetchWeeklyData(weekStart, weekEnd, false);
        
        let weekIncome = 0;
        let weekExpenses = 0;
        
        if (!weekIncomeError && weekIncomeData) {
          // No need to filter - transactions are already department-specific
          weekIncome = weekIncomeData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
        }
        
        if (!weekExpenseError && weekExpenseData) {
          // No need to filter - transactions are already department-specific
          weekExpenses = weekExpenseData.reduce((sum: number, t: any) => {
            const amount = t.amount < 0 ? Math.abs(t.amount) : t.amount;
            return sum + (amount || 0);
          }, 0) || 0;
        }
        
        weeks.push({
          week: `W${i + 1}`,
          income: weekIncome,
          expenses: weekExpenses,
          label: String(i + 1).padStart(2, '0')
        });
      }
      
      // Weeks 5-8: Current month (split into 4 weeks)
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(currentMonthStart);
        weekStart.setDate(1 + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Fetch income and expenses for this week using helper function
        const { data: weekIncomeData, error: weekIncomeError } = await fetchWeeklyData(weekStart, weekEnd, true);
        const { data: weekExpenseData, error: weekExpenseError } = await fetchWeeklyData(weekStart, weekEnd, false);
        
        let weekIncome = 0;
        let weekExpenses = 0;
        
        if (!weekIncomeError && weekIncomeData) {
          // No need to filter - transactions are already department-specific
          weekIncome = weekIncomeData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
        }
        
        if (!weekExpenseError && weekExpenseData) {
          // No need to filter - transactions are already department-specific
          weekExpenses = weekExpenseData.reduce((sum: number, t: any) => {
            const amount = t.amount < 0 ? Math.abs(t.amount) : t.amount;
            return sum + (amount || 0);
          }, 0) || 0;
        }
        
        weeks.push({
          week: `W${i + 5}`,
          income: weekIncome,
          expenses: weekExpenses,
          label: String(i + 5).padStart(2, '0')
        });
      }
      
      setFinancialData({
        totalDepartmentIncome,
        monthlyDepartmentIncome,
        totalDepartmentExpenses,
        monthlyDepartmentExpenses,
        weeklyFinances: weeks
      });
      
      console.log(`✅ DEPARTMENT DASHBOARD: Financial data updated successfully`);
      
    } catch (error) {
      console.error('❌ DEPARTMENT DASHBOARD: Error fetching financial data:', error);
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

      // Refresh department data
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

      // Refresh department data
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
      treasurer: Briefcase,
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

  // Group members by position (filter out null member records)
  const leadershipMembers = members.filter(m => m.member && ['chairperson', 'secretary', 'treasurer', 'coordinator'].includes(m.position));
  const regularMembers = members.filter(m => m.member && m.position === 'member');
  
  // Calculate member age distribution - fetch separately if needed
  const membersByAge = {
    youth: Math.floor(members.length * 0.35),   // 15-35 - estimated
    adults: Math.floor(members.length * 0.50),  // 36-60 - estimated
    seniors: Math.ceil(members.length * 0.15)   // 61+ - estimated
  };

  if (!user && !authLoading) {
    return null;
  }

  // Show loading screen while auth or department access is loading
  if (authLoading || deptAccessLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent mb-4" />
          <p className="text-gray-600 font-medium">Loading department dashboard...</p>
        </div>
      </div>
    );
  }

  // Styling variables
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <TopNavbar 
        title={department?.name || 'Department Dashboard'}
        subtitle={`${department?.swahili_name ? department.swahili_name : ''} - Department Management`.trim()}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="lg:ml-20 p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 sm:mb-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}



        {/* Loading State */}
        {loading ? (
          <Card variant="default">
            <CardBody className="p-8 sm:p-12">
              <Loading text="Loading department dashboard..." />
            </CardBody>
          </Card>
        ) : !department ? (
          <Card variant="default">
            <CardBody className="p-8 sm:p-12">
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
            {/* ========== MOBILE VIEW (shown only on small screens) ========== */}
            <div className="sm:hidden space-y-4 w-full">
              {/* Mobile Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <Users className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-1`}>Members</p>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {members.length}
                  </h3>
                </div>

                {/* Leadership Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <Crown className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-1`}>Leaders</p>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {leadershipMembers.length}
                  </h3>
                </div>

                {/* Active Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <UserCheck className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-1`}>Active</p>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {members.filter(m => m.member && m.member.status === 'active').length}
                  </h3>
                </div>

                {/* Department Income Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <DollarSign className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-cyan-600'}`} />
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-1`}>Income</p>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {`${(financialData.totalDepartmentIncome / 1000000).toFixed(1)}M`}
                  </h3>
                </div>
              </div>

              {/* Mobile Age Distribution */}
              <div className={`${cardBg} rounded-xl p-4 border ${borderColor} shadow-sm`}>
                <h3 className={`text-base font-bold ${textPrimary} mb-3`}>Members by Age</h3>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className={`text-xs ${textSecondary} mb-1`}>Total</p>
                    <p className={`text-lg font-bold ${textPrimary}`}>
                      {`${members.length} People`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 mx-auto mb-1"></div>
                      <p className={`text-[10px] ${textSecondary}`}>Youth</p>
                      <p className={`text-xs font-semibold ${textPrimary}`}>{membersByAge.youth}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600 mx-auto mb-1"></div>
                      <p className={`text-[10px] ${textSecondary}`}>Adults</p>
                      <p className={`text-xs font-semibold ${textPrimary}`}>{membersByAge.adults}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1"></div>
                      <p className={`text-[10px] ${textSecondary}`}>Seniors</p>
                      <p className={`text-xs font-semibold ${textPrimary}`}>{membersByAge.seniors}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Finances */}
              <div className={`${cardBg} rounded-xl p-4 border ${borderColor} shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base font-bold ${textPrimary}`}>Finances</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-blue-600"></div>
                      <span className={`text-xs ${textSecondary}`}>Income</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-gray-400"></div>
                      <span className={`text-xs ${textSecondary}`}>Expenses</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <p className={`text-xs ${textSecondary} mb-1`}>Total Income</p>
                    <p className={`text-base font-bold ${textPrimary}`}>
                      {`TZS ${(financialData.totalDepartmentIncome / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${textSecondary} mb-1`}>Total Expenses</p>
                    <p className={`text-base font-semibold ${textPrimary}`}>
                      {`TZS ${(financialData.totalDepartmentExpenses / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                </div>
                {/* Mini Bar Chart */}
                <div className="h-16 flex items-end gap-1">
                  {(financialData.weeklyFinances.length > 0 ? financialData.weeklyFinances : [
                    { week: 'W1', income: 0, expenses: 0, label: '01' },
                    { week: 'W2', income: 0, expenses: 0, label: '02' },
                    { week: 'W3', income: 0, expenses: 0, label: '03' },
                    { week: 'W4', income: 0, expenses: 0, label: '04' },
                    { week: 'W5', income: 0, expenses: 0, label: '05' },
                    { week: 'W6', income: 0, expenses: 0, label: '06' },
                    { week: 'W7', income: 0, expenses: 0, label: '07' },
                    { week: 'W8', income: 0, expenses: 0, label: '08' }
                  ]).map((bar, idx) => {
                    const maxAmount = Math.max(
                      ...financialData.weeklyFinances.map(w => Math.max(w.income, w.expenses)), 
                      1
                    );
                    const incomeHeight = Math.max((bar.income / maxAmount) * 48, 2);
                    const expenseHeight = Math.max((bar.expenses / maxAmount) * 48, 2);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex items-end gap-0.5">
                          <div 
                            className="flex-1 bg-blue-600 rounded-t"
                            style={{ height: `${incomeHeight}px` }}
                          ></div>
                          <div 
                            className="flex-1 bg-gray-400 rounded-t"
                            style={{ height: `${expenseHeight}px` }}
                          ></div>
                        </div>
                        <span className={`text-[9px] mt-1 ${textSecondary}`}>{bar.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Member Lists */}
              <div className="space-y-3">
                {/* Leadership Team */}
                {leadershipMembers.length > 0 && (
                  <div className={`${cardBg} rounded-xl p-4 border ${borderColor} shadow-sm`}>
                    <h3 className={`text-base font-bold ${textPrimary} mb-3`}>Leadership Team</h3>
                    <div className="space-y-2">
                      {leadershipMembers.map((member, index) => (
                        <div key={member.id} className={`flex items-center gap-3 p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <Avatar
                            src={member.member?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.member?.first_name}`}
                            alt={`${member.member?.first_name} ${member.member?.last_name}`}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${textPrimary} truncate`}>
                              {member.member?.first_name} {member.member?.last_name}
                            </p>
                            <p className={`text-xs ${textSecondary} truncate`}>{member.member?.phone}</p>
                          </div>
                          {getPositionBadge(member.position)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Members */}
                <div className={`${cardBg} rounded-xl p-4 border ${borderColor} shadow-sm`}>
                  <h3 className={`text-base font-bold ${textPrimary} mb-3`}>
                    Members ({regularMembers.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {regularMembers.slice(0, 10).map((member, index) => (
                      <div key={member.id} className={`flex items-center gap-3 p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <Avatar
                          src={member.member?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.member?.first_name}`}
                          alt={`${member.member?.first_name} ${member.member?.last_name}`}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${textPrimary} truncate`}>
                            {member.member?.first_name} {member.member?.last_name}
                          </p>
                          <p className={`text-xs ${textSecondary} truncate`}>{member.member?.phone}</p>
                        </div>
                        {getStatusBadge(member.member?.status || 'inactive')}
                      </div>
                    ))}
                    {regularMembers.length > 10 && (
                      <div className="text-center pt-2">
                        <p className={`text-xs ${textSecondary}`}>
                          +{regularMembers.length - 10} more members
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ========== DESKTOP VIEW (hidden on small screens) ========== */}
            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Left Column - Stats and Charts */}
              <div className="col-span-1 lg:col-span-7 space-y-4 sm:space-y-6">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                    <select className={`px-6 py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tag-red-500 focus:border-tag-red-500`}>
                      <option>All Time</option>
                      <option>This Year</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-8">
                    {/* Left side - Total Members */}
                    <div className="flex-shrink-0">
                      <p className={`text-sm ${textSecondary} mb-3`}>Total Members</p>
                      <p className={`text-4xl font-bold ${textPrimary}`}>
                        {`${members.length.toLocaleString()} People`}
                      </p>
                    </div>

                    {/* Right side - Donut Chart and Legend */}
                    <div className="flex items-center gap-12">
                      {/* Donut Chart */}
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const totalMembers = members.length;
                          if (totalMembers === 0) {
                            return (
                              <div className="w-[200px] h-[200px] flex items-center justify-center">
                                <p className={textSecondary}>No data</p>
                              </div>
                            );
                          }

                          const youthPercentage = (membersByAge.youth / totalMembers) * 100;
                          const adultsPercentage = (membersByAge.adults / totalMembers) * 100;
                          const seniorsPercentage = (membersByAge.seniors / totalMembers) * 100;

                          const youthRatio = membersByAge.youth / totalMembers;
                          const adultsRatio = membersByAge.adults / totalMembers;
                          const seniorsRatio = membersByAge.seniors / totalMembers;

                          return (
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
                                  stroke="url(#deptMemberGradient1)"
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
                                  stroke="url(#deptMemberGradient2)"
                                  strokeWidth="20"
                                  strokeDasharray={`${2 * Math.PI * 72 * adultsRatio} ${2 * Math.PI * 72 * (1 - adultsRatio)}`}
                                  strokeDashoffset={`${-2 * Math.PI * 72 * youthRatio}`}
                                  strokeLinecap="butt"
                                />
                              )}
                              
                              {/* Seniors segment (Red) */}
                              {seniorsRatio > 0 && (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="76"
                                  fill="none"
                                  stroke="url(#deptMemberGradient3)"
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
                          <p className="text-3xl font-bold text-blue-600">100%</p>
                        </div>
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

                {/* Finances Chart */}
                <div className={`${cardBg} rounded-3xl p-6 border ${borderColor} shadow-sm`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${textPrimary}`}>Finances</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-600"></div>
                        <span className={`text-xs ${textSecondary}`}>Income</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gray-400"></div>
                        <span className={`text-xs ${textSecondary}`}>Expenses</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className={`text-xs ${textSecondary} mb-1`}>Total Income</p>
                      <p className={`text-2xl font-bold ${textPrimary}`}>
                        {`TZS ${(financialData.totalDepartmentIncome / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} mb-1`}>Total Expenses</p>
                      <p className={`text-2xl font-bold ${textPrimary}`}>
                        {`TZS ${(financialData.totalDepartmentExpenses / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} mb-1`}>Net Balance</p>
                      <p className={`text-2xl font-bold ${(financialData.totalDepartmentIncome - financialData.totalDepartmentExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {`TZS ${((financialData.totalDepartmentIncome - financialData.totalDepartmentExpenses) / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="relative" style={{ height: '180px' }}>
                    {/* Bar Chart Container */}
                    <div className="h-full flex items-end justify-between gap-4">
                      {(financialData.weeklyFinances.length > 0 ? financialData.weeklyFinances : [
                        { week: 'W1', income: 0, expenses: 0, label: '01' },
                        { week: 'W2', income: 0, expenses: 0, label: '02' },
                        { week: 'W3', income: 0, expenses: 0, label: '03' },
                        { week: 'W4', income: 0, expenses: 0, label: '04' },
                        { week: 'W5', income: 0, expenses: 0, label: '05' },
                        { week: 'W6', income: 0, expenses: 0, label: '06' },
                        { week: 'W7', income: 0, expenses: 0, label: '07' },
                        { week: 'W8', income: 0, expenses: 0, label: '08' }
                      ]).map((bar, idx) => {
                        const maxAmount = Math.max(
                          ...financialData.weeklyFinances.map(w => Math.max(w.income, w.expenses)), 
                          1
                        );
                        const incomeHeight = Math.max((bar.income / maxAmount) * 150, 4);
                        const expenseHeight = Math.max((bar.expenses / maxAmount) * 150, 4);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            {/* Bar Group */}
                            <div className="w-full flex items-end justify-center gap-2">
                              {/* Income Bar (Blue) */}
                              <div 
                                className="flex-1 bg-blue-600 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-blue-700"
                                style={{ height: `${incomeHeight}px` }}
                                title={`Week ${idx + 1} Income: TZS ${bar.income.toLocaleString()}`}
                              ></div>
                              {/* Expense Bar (Gray) */}
                              <div 
                                className="flex-1 bg-gray-400 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-gray-500"
                                style={{ height: `${expenseHeight}px` }}
                                title={`Week ${idx + 1} Expenses: TZS ${bar.expenses.toLocaleString()}`}
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

              {/* Right Column - Leadership and Members */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                {/* Leadership Team */}
                {leadershipMembers.length > 0 && (
                  <Card variant="default" className="">
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

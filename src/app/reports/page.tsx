'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select, 
  Badge, 
  Loading, 
  Alert,
  EmptyState
} from '@/components/ui';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Download,
  Eye,
  FileText,
  Building2,
  UserCheck,
  CreditCard,
  Activity,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ReportData {
  membershipStats: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    membersByGender: { male: number; female: number };
    membersByStatus: { active: number; visitor: number; transferred: number; inactive: number };
    membersByDepartment: Array<{ name: string; count: number }>;
  };
  financialStats: {
    totalIncome: number;
    totalExpenses: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    incomeByType: Array<{ type: string; amount: number }>;
    expensesByType: Array<{ type: string; amount: number }>;
    monthlyTrends: Array<{ month: string; income: number; expenses: number }>;
  };
  attendanceStats: {
    averageAttendance: number;
    attendanceByType: Array<{ type: string; count: number }>;
    attendanceTrends: Array<{ date: string; count: number }>;
  };
  departmentStats: Array<{
    id: string;
    name: string;
    memberCount: number;
    activeMembers: number;
    recentEvents: number;
  }>;
  eventStats: {
    totalEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    averageAttendance: number;
    eventsByType: Array<{ type: string; count: number }>;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'finance' | 'events' | 'departments'>('overview');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
    if (user) {
      loadReportData();
    }
  }, [user, authLoading, dateRange, dateFrom, dateTo]);

  const loadReportData = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = dateTo || new Date().toISOString().split('T')[0];
      const startDate = dateFrom || getStartDate(dateRange);

      const [
        membersData,
        transactionsData,
        attendanceData,
        departmentsData,
        eventsData
      ] = await Promise.all([
        loadMembershipStats(startDate, endDate),
        loadFinancialStats(startDate, endDate),
        loadAttendanceStats(startDate, endDate),
        loadDepartmentStats(),
        loadEventStats(startDate, endDate)
      ]);

      setReportData({
        membershipStats: membersData,
        financialStats: transactionsData,
        attendanceStats: attendanceData,
        departmentStats: departmentsData,
        eventStats: eventsData
      });
    } catch (err: any) {
      console.error('Error loading report data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range: string): string => {
    const now = new Date();
    switch (range) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now.toISOString().split('T')[0];
  };

  const loadMembershipStats = async (startDate: string, endDate: string) => {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, gender, status, created_at');

    if (membersError) throw membersError;

    const { data: departmentMembers, error: deptError } = await supabase
      .from('department_members')
      .select(`
        department_id,
        departments(name)
      `)
      .eq('is_active', true);

    if (deptError) throw deptError;

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter((m: any) => m.status === 'active').length || 0;
    const newMembersThisMonth = members?.filter((m: any) => {
      const createdAt = new Date(m.created_at);
      const monthStart = new Date();
      monthStart.setDate(1);
      return createdAt >= monthStart;
    }).length || 0;

    const membersByGender = {
      male: members?.filter((m: any) => m.gender === 'male').length || 0,
      female: members?.filter((m: any) => m.gender === 'female').length || 0
    };

    const membersByStatus = {
      active: members?.filter((m: any) => m.status === 'active').length || 0,
      visitor: members?.filter((m: any) => m.status === 'visitor').length || 0,
      transferred: members?.filter((m: any) => m.status === 'transferred').length || 0,
      inactive: members?.filter((m: any) => m.status === 'inactive').length || 0
    };

    const deptCounts = new Map();
    departmentMembers?.forEach((dm: any) => {
      if (dm.departments?.name) {
        deptCounts.set(dm.departments.name, (deptCounts.get(dm.departments.name) || 0) + 1);
      }
    });

    const membersByDepartment = Array.from(deptCounts.entries()).map(([name, count]) => ({
      name,
      count: count as number
    }));

    return {
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      membersByGender,
      membersByStatus,
      membersByDepartment
    };
  };

  const loadFinancialStats = async (startDate: string, endDate: string) => {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const incomeTypes = ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
    const expenseTypes = ['expense', 'welfare'];

    const totalIncome = transactions?.filter((t: any) => incomeTypes.includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const totalExpenses = transactions?.filter((t: any) => expenseTypes.includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyIncome = transactions?.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return incomeTypes.includes(t.transaction_type) &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    }).reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const monthlyExpenses = transactions?.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return expenseTypes.includes(t.transaction_type) &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    }).reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const incomeByType = incomeTypes.map(type => ({
      type,
      amount: transactions?.filter((t: any) => t.transaction_type === type)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0
    })).filter(item => item.amount > 0);

    const expensesByType = expenseTypes.map(type => ({
      type,
      amount: transactions?.filter((t: any) => t.transaction_type === type)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0
    })).filter(item => item.amount > 0);

    // Generate monthly trends for the last 6 months
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions?.filter((t: any) => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      }) || [];

      const income = monthTransactions.filter((t: any) => incomeTypes.includes(t.transaction_type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const expenses = monthTransactions.filter((t: any) => expenseTypes.includes(t.transaction_type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses
      });
    }

    return {
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      incomeByType,
      expensesByType,
      monthlyTrends
    };
  };

  const loadAttendanceStats = async (startDate: string, endDate: string) => {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const averageAttendance = attendance?.length ? 
      Math.round(attendance.reduce((sum: number, a: any) => sum + 1, 0) / 4) : 0; // Assuming 4 weeks

    const attendanceByType = [
      { type: 'Sunday Service', count: attendance?.filter((a: any) => a.attendance_type === 'sunday_service').length || 0 },
      { type: 'Midweek Fellowship', count: attendance?.filter((a: any) => a.attendance_type === 'midweek_fellowship').length || 0 },
      { type: 'Special Event', count: attendance?.filter((a: any) => a.attendance_type === 'special_event').length || 0 },
      { type: 'Department Meeting', count: attendance?.filter((a: any) => a.attendance_type === 'department_meeting').length || 0 }
    ].filter(item => item.count > 0);

    const attendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = attendance?.filter((a: any) => a.date === dateStr).length || 0;
      attendanceTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    return {
      averageAttendance,
      attendanceByType,
      attendanceTrends
    };
  };

  const loadDepartmentStats = async () => {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        department_members(count)
      `)
      .eq('is_active', true);

    if (deptError) throw deptError;

    return departments?.map((dept: any) => ({
      id: dept.id,
      name: dept.name,
      memberCount: dept.department_members?.length || 0,
      activeMembers: dept.department_members?.length || 0,
      recentEvents: 0 // This would require additional querying
    })) || [];
  };

  const loadEventStats = async (startDate: string, endDate: string) => {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate);

    if (error) throw error;

    const totalEvents = events?.length || 0;
    const upcomingEvents = events?.filter((e: any) => new Date(e.start_date) > new Date()).length || 0;
    const completedEvents = events?.filter((e: any) => new Date(e.end_date) < new Date()).length || 0;

    const eventsByType = [
      { type: 'Conference', count: events?.filter((e: any) => e.event_type === 'conference').length || 0 },
      { type: 'Crusade', count: events?.filter((e: any) => e.event_type === 'crusade').length || 0 },
      { type: 'Seminar', count: events?.filter((e: any) => e.event_type === 'seminar').length || 0 },
      { type: 'Prayer Night', count: events?.filter((e: any) => e.event_type === 'prayer_night').length || 0 },
      { type: 'Workshop', count: events?.filter((e: any) => e.event_type === 'workshop').length || 0 },
      { type: 'Fellowship', count: events?.filter((e: any) => e.event_type === 'fellowship').length || 0 }
    ].filter(item => item.count > 0);

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      averageAttendance: 0, // This would require event registration data
      eventsByType
    };
  };

  const formatCurrency = (amount: number) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  const exportReport = () => {
    // This would generate and download a PDF or Excel report
    alert('Export functionality would be implemented here');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights into church operations</p>
              </div>
              <div className="flex space-x-3">
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  options={[
                    { value: "week", label: "Last Week" },
                    { value: "month", label: "Last Month" },
                    { value: "quarter", label: "Last Quarter" },
                    { value: "year", label: "Last Year" }
                  ]}
                />
                <Button 
                  variant="outline"
                  onClick={exportReport}
                  icon={<Download className="h-4 w-4" />}
                >
                  Export Report
                </Button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert 
                variant="error" 
                onClose={() => setError(null)}
                className="mb-6"
              >
                {error}
              </Alert>
            )}

            {/* Custom Date Range */}
            <Card className="mb-6">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="From Date"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { key: 'overview', label: 'Overview', icon: BarChart3 },
                  { key: 'membership', label: 'Membership', icon: Users },
                  { key: 'finance', label: 'Finance', icon: DollarSign },
                  { key: 'events', label: 'Events', icon: Calendar },
                  { key: 'departments', label: 'Departments', icon: Building2 }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {!reportData ? (
              <EmptyState
                icon={<BarChart3 className="h-16 w-16 text-gray-400" />}
                title="Loading Report Data"
                description="Please wait while we generate your reports..."
              />
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardBody>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Members</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {reportData.membershipStats.totalMembers}
                              </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {reportData.membershipStats.activeMembers} active
                          </p>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(reportData.financialStats.monthlyIncome)}
                              </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {reportData.financialStats.monthlyIncome > reportData.financialStats.monthlyExpenses ? 'Surplus' : 'Deficit'}
                          </p>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Events</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {reportData.eventStats.totalEvents}
                              </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                              <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {reportData.eventStats.upcomingEvents} upcoming
                          </p>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Departments</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {reportData.departmentStats.length}
                              </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                              <Building2 className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Active departments
                          </p>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardBody>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Income</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(reportData.financialStats.totalIncome)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Expenses</span>
                              <span className="font-medium text-red-600">
                                {formatCurrency(reportData.financialStats.totalExpenses)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="font-medium text-gray-900">Net Amount</span>
                              <span className={`font-bold ${
                                reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses >= 0 
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses)}
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Breakdown</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Active Members</span>
                              <span className="font-medium">{reportData.membershipStats.activeMembers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">New This Month</span>
                              <span className="font-medium text-blue-600">
                                {reportData.membershipStats.newMembersThisMonth}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Male</span>
                              <span className="font-medium">{reportData.membershipStats.membersByGender.male}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Female</span>
                              <span className="font-medium">{reportData.membershipStats.membersByGender.female}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Membership Tab */}
                {activeTab === 'membership' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.membershipStats.totalMembers}
                            </p>
                            <p className="text-sm text-gray-600">Total Members</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.membershipStats.activeMembers}
                            </p>
                            <p className="text-sm text-gray-600">Active Members</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.membershipStats.newMembersThisMonth}
                            </p>
                            <p className="text-sm text-gray-600">New This Month</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <Building2 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.membershipStats.membersByDepartment.length}
                            </p>
                            <p className="text-sm text-gray-600">Departments</p>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardBody>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Members by Status</h3>
                          <div className="space-y-3">
                            {Object.entries(reportData.membershipStats.membersByStatus).map(([status, count]) => (
                              <div key={status} className="flex justify-between items-center">
                                <span className="capitalize text-gray-600">{status}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{count}</span>
                                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                                    <div 
                                      className="h-2 bg-blue-600 rounded-full"
                                      style={{ 
                                        width: `${(count / reportData.membershipStats.totalMembers * 100)}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Members by Department</h3>
                          <div className="space-y-3">
                            {reportData.membershipStats.membersByDepartment.slice(0, 5).map((dept) => (
                              <div key={dept.name} className="flex justify-between items-center">
                                <span className="text-gray-600">{dept.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{dept.count}</span>
                                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                                    <div 
                                      className="h-2 bg-green-600 rounded-full"
                                      style={{ 
                                        width: `${(dept.count / reportData.membershipStats.totalMembers * 100)}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Finance Tab */}
                {activeTab === 'finance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(reportData.financialStats.totalIncome)}
                            </p>
                            <p className="text-sm text-gray-600">Total Income</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(reportData.financialStats.totalExpenses)}
                            </p>
                            <p className="text-sm text-gray-600">Total Expenses</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <DollarSign className={`h-8 w-8 mx-auto mb-2 ${
                              reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <p className={`text-2xl font-bold ${
                              reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses)}
                            </p>
                            <p className="text-sm text-gray-600">Net Amount</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(reportData.financialStats.monthlyIncome)}
                            </p>
                            <p className="text-sm text-gray-600">Monthly Income</p>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardBody>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Type</h3>
                          <div className="space-y-3">
                            {reportData.financialStats.incomeByType.map((item) => (
                              <div key={item.type} className="flex justify-between items-center">
                                <span className="capitalize text-gray-600">{item.type}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                                    <div 
                                      className="h-2 bg-green-600 rounded-full"
                                      style={{ 
                                        width: `${(item.amount / reportData.financialStats.totalIncome * 100)}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardBody>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                          <div className="space-y-3">
                            {reportData.financialStats.monthlyTrends.map((item) => (
                              <div key={item.month} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.month}</span>
                                  <span className="font-medium">
                                    {formatCurrency(item.income - item.expenses)}
                                  </span>
                                </div>
                                <div className="flex space-x-1">
                                  <div className="flex-1 h-2 bg-green-200 rounded">
                                    <div 
                                      className="h-2 bg-green-600 rounded"
                                      style={{ 
                                        width: item.income > 0 ? `${Math.min(item.income / Math.max(...reportData.financialStats.monthlyTrends.map(t => t.income)) * 100, 100)}%` : '0%'
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 h-2 bg-red-200 rounded">
                                    <div 
                                      className="h-2 bg-red-600 rounded"
                                      style={{ 
                                        width: item.expenses > 0 ? `${Math.min(item.expenses / Math.max(...reportData.financialStats.monthlyTrends.map(t => t.expenses)) * 100, 100)}%` : '0%'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.eventStats.totalEvents}
                            </p>
                            <p className="text-sm text-gray-600">Total Events</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.eventStats.upcomingEvents}
                            </p>
                            <p className="text-sm text-gray-600">Upcoming</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.eventStats.completedEvents}
                            </p>
                            <p className="text-sm text-gray-600">Completed</p>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <div className="text-center">
                            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {reportData.eventStats.averageAttendance}
                            </p>
                            <p className="text-sm text-gray-600">Avg. Attendance</p>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    <Card>
                      <CardBody>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Type</h3>
                        <div className="space-y-3">
                          {reportData.eventStats.eventsByType.map((item) => (
                            <div key={item.type} className="flex justify-between items-center">
                              <span className="text-gray-600">{item.type}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{item.count}</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-2 bg-blue-600 rounded-full"
                                    style={{ 
                                      width: `${(item.count / reportData.eventStats.totalEvents * 100)}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}

                {/* Departments Tab */}
                {activeTab === 'departments' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reportData.departmentStats.map((dept) => (
                        <Card key={dept.id}>
                          <CardBody>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Members</span>
                                <span className="font-medium">{dept.memberCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Active</span>
                                <span className="font-medium text-green-600">{dept.activeMembers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Recent Events</span>
                                <span className="font-medium">{dept.recentEvents}</span>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

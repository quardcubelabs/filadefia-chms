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

    console.log('Loading financial stats from', startDate, 'to', endDate);

    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        member:members(first_name, last_name),
        department:departments(name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('verified', true);

    if (error) {
      console.error('Error loading financial transactions:', error);
      throw error;
    }

    console.log('Loaded', transactions?.length || 0, 'transactions');

    const incomeTypes = ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
    const expenseTypes = ['expense', 'welfare'];

    const totalIncome = transactions?.filter((t: any) => incomeTypes.includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;

    const totalExpenses = transactions?.filter((t: any) => expenseTypes.includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;

    console.log('Total Income:', totalIncome, 'Total Expenses:', totalExpenses);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyIncome = transactions?.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return incomeTypes.includes(t.transaction_type) &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    }).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;

    const monthlyExpenses = transactions?.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return expenseTypes.includes(t.transaction_type) &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    }).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;

    const incomeByType = incomeTypes.map(type => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      amount: transactions?.filter((t: any) => t.transaction_type === type)
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0
    })).filter(item => item.amount > 0);

    const expensesByType = expenseTypes.map(type => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      amount: transactions?.filter((t: any) => t.transaction_type === type)
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0
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
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
      const expenses = monthTransactions.filter((t: any) => expenseTypes.includes(t.transaction_type))
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses
      });
    }

    const result = {
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      incomeByType,
      expensesByType,
      monthlyTrends
    };

    console.log('Financial stats result:', result);
    return result;
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

    // Get departments with their leaders and member counts
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        swahili_name,
        description,
        is_active,
        created_at,
        leader:leader_id(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('is_active', true);

    if (deptError) throw deptError;

    // Get member counts for each department
    const { data: departmentMembers, error: membersError } = await supabase
      .from('department_members')
      .select(`
        department_id,
        member_id,
        position,
        is_active,
        joined_date,
        members(
          id,
          status
        )
      `)
      .eq('is_active', true);

    if (membersError) throw membersError;

    // Get financial data for each department
    const { data: financialData, error: finError } = await supabase
      .from('financial_transactions')
      .select(`
        department_id,
        transaction_type,
        amount,
        date,
        verified
      `)
      .eq('verified', true)
      .not('department_id', 'is', null);

    if (finError) throw finError;

    // Get recent events for each department
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_type,
        start_date,
        end_date
      `)
      .gte('start_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

    if (eventError) console.warn('Error loading events:', eventError);

    // Process the data
    const departmentMemberCounts = new Map();
    const departmentActiveCounts = new Map();
    
    departmentMembers?.forEach((dm: any) => {
      const deptId = dm.department_id;
      departmentMemberCounts.set(deptId, (departmentMemberCounts.get(deptId) || 0) + 1);
      
      if (dm.members?.status === 'active') {
        departmentActiveCounts.set(deptId, (departmentActiveCounts.get(deptId) || 0) + 1);
      }
    });

    const departmentFinancials = new Map();
    financialData?.forEach((ft: any) => {
      const deptId = ft.department_id;
      if (!departmentFinancials.has(deptId)) {
        departmentFinancials.set(deptId, {
          totalIncome: 0,
          totalExpenses: 0,
          transactionCount: 0,
          recentTransactions: 0
        });
      }
      
      const stats = departmentFinancials.get(deptId);
      const amount = parseFloat(ft.amount) || 0;
      
      if (ft.transaction_type === 'expense') {
        stats.totalExpenses += amount;
      } else {
        stats.totalIncome += amount;
      }
      
      stats.transactionCount++;
      
      // Count recent transactions (last 30 days)
      const transactionDate = new Date(ft.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (transactionDate >= thirtyDaysAgo) {
        stats.recentTransactions++;
      }
      
      departmentFinancials.set(deptId, stats);
    });

    return departments?.map((dept: any) => {
      const memberCount = departmentMemberCounts.get(dept.id) || 0;
      const activeMembers = departmentActiveCounts.get(dept.id) || 0;
      const financials = departmentFinancials.get(dept.id) || {
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0,
        recentTransactions: 0
      };
      
      const recentEvents = eventData?.filter((event: any) => {
        // This is a simplified approach - in a real app, you'd have department-event relationships
        return event.title.toLowerCase().includes(dept.name.toLowerCase());
      }).length || 0;

      return {
        id: dept.id,
        name: dept.name,
        swahiliName: dept.swahili_name,
        description: dept.description,
        memberCount,
        activeMembers,
        inactiveMembers: memberCount - activeMembers,
        leader: dept.leader ? {
          id: dept.leader.id,
          name: `${dept.leader.first_name} ${dept.leader.last_name}`,
          email: dept.leader.email,
          phone: dept.leader.phone
        } : null,
        recentEvents,
        totalIncome: financials.totalIncome,
        totalExpenses: financials.totalExpenses,
        netAmount: financials.totalIncome - financials.totalExpenses,
        transactionCount: financials.transactionCount,
        recentTransactions: financials.recentTransactions,
        createdAt: dept.created_at
      };
    }) || [];
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

  const exportReport = async (format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    if (!reportData) {
      alert('No data available to export');
      return;
    }

    try {
      // Save report to database first
      const reportTitle = `Church Report - ${format.toUpperCase()} - ${new Date().toLocaleDateString()}`;
      await saveReportToDatabase(format, reportTitle);

      // Then export in the requested format
      if (format === 'csv') {
        exportToCSV();
      } else if (format === 'excel') {
        await exportToExcel();
      } else {
        await exportToPDF();
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  const exportToCSV = () => {
    const csvData: string[] = [];
    
    // Header
    csvData.push('Tanzania Assemblies of God - FCC Report');
    csvData.push(`Generated on: ${new Date().toLocaleDateString()}`);
    csvData.push(`Report Period: ${dateFrom || getStartDate(dateRange)} to ${dateTo || new Date().toISOString().split('T')[0]}`);
    csvData.push(''); // Empty line
    
    // Membership Stats
    csvData.push('MEMBERSHIP STATISTICS');
    csvData.push(`Total Members,${reportData.membershipStats.totalMembers}`);
    csvData.push(`Active Members,${reportData.membershipStats.activeMembers}`);
    csvData.push(`New Members This Month,${reportData.membershipStats.newMembersThisMonth}`);
    csvData.push(`Male Members,${reportData.membershipStats.membersByGender.male}`);
    csvData.push(`Female Members,${reportData.membershipStats.membersByGender.female}`);
    csvData.push(''); // Empty line
    
    // Financial Stats
    csvData.push('FINANCIAL STATISTICS');
    csvData.push(`Total Income,${formatCurrency(reportData.financialStats.totalIncome)}`);
    csvData.push(`Total Expenses,${formatCurrency(reportData.financialStats.totalExpenses)}`);
    csvData.push(`Monthly Income,${formatCurrency(reportData.financialStats.monthlyIncome)}`);
    csvData.push(`Monthly Expenses,${formatCurrency(reportData.financialStats.monthlyExpenses)}`);
    csvData.push(''); // Empty line
    
    // Department Stats
    csvData.push('DEPARTMENT STATISTICS');
    csvData.push('Department Name,Total Members,Active Members,Leader,Total Income,Total Expenses,Net Amount,Recent Events');
    reportData.departmentStats.forEach(dept => {
      csvData.push(`${dept.name},${dept.memberCount},${dept.activeMembers},${dept.leader?.name || 'No Leader'},${formatCurrency(dept.totalIncome || 0)},${formatCurrency(dept.totalExpenses || 0)},${formatCurrency(dept.netAmount || 0)},${dept.recentEvents}`);
    });
    
    // Create and download CSV
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `church_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    // For Excel export, we'd use a library like xlsx
    // This is a simplified version that creates a basic HTML table
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tanzania Assemblies of God - FCC Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin: 20px 0; }
          .section { margin: 30px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tanzania Assemblies of God - FCC</h1>
          <h2>Comprehensive Church Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Report Period: ${dateFrom || getStartDate(dateRange)} to ${dateTo || new Date().toISOString().split('T')[0]}</p>
        </div>
        
        <div class="section">
          <h3>Membership Statistics</h3>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Members</td><td>${reportData.membershipStats.totalMembers}</td></tr>
            <tr><td>Active Members</td><td>${reportData.membershipStats.activeMembers}</td></tr>
            <tr><td>New Members This Month</td><td>${reportData.membershipStats.newMembersThisMonth}</td></tr>
            <tr><td>Male Members</td><td>${reportData.membershipStats.membersByGender.male}</td></tr>
            <tr><td>Female Members</td><td>${reportData.membershipStats.membersByGender.female}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Financial Statistics</h3>
          <table>
            <tr><th>Metric</th><th>Amount (TZS)</th></tr>
            <tr><td>Total Income</td><td>${formatCurrency(reportData.financialStats.totalIncome)}</td></tr>
            <tr><td>Total Expenses</td><td>${formatCurrency(reportData.financialStats.totalExpenses)}</td></tr>
            <tr><td>Net Amount</td><td>${formatCurrency(reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses)}</td></tr>
            <tr><td>Monthly Income</td><td>${formatCurrency(reportData.financialStats.monthlyIncome)}</td></tr>
            <tr><td>Monthly Expenses</td><td>${formatCurrency(reportData.financialStats.monthlyExpenses)}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Department Statistics</h3>
          <table>
            <tr>
              <th>Department</th>
              <th>Total Members</th>
              <th>Active Members</th>
              <th>Leader</th>
              <th>Total Income</th>
              <th>Total Expenses</th>
              <th>Net Amount</th>
              <th>Recent Events</th>
              <th>Recent Transactions</th>
            </tr>
            ${reportData.departmentStats.map(dept => `
              <tr>
                <td>${dept.name}</td>
                <td>${dept.memberCount}</td>
                <td>${dept.activeMembers}</td>
                <td>${dept.leader?.name || 'No Leader'}</td>
                <td>${formatCurrency(dept.totalIncome || 0)}</td>
                <td>${formatCurrency(dept.totalExpenses || 0)}</td>
                <td>${formatCurrency(dept.netAmount || 0)}</td>
                <td>${dept.recentEvents}</td>
                <td>${dept.recentTransactions || 0}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `church_report_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveReportToDatabase = async (reportType: string, reportTitle?: string) => {
    if (!supabase || !user || !reportData) {
      alert('Unable to save report. Please try again.');
      return;
    }

    try {
      const title = reportTitle || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      const reportRecord = {
        title,
        type: 'monthly' as const, // Using the report_type enum
        department_id: null, // For general reports
        period_start: dateFrom || getStartDate(dateRange),
        period_end: dateTo || new Date().toISOString().split('T')[0],
        data: {
          reportType,
          generatedAt: new Date().toISOString(),
          membershipStats: reportData.membershipStats,
          financialStats: reportData.financialStats,
          departmentStats: reportData.departmentStats,
          attendanceStats: reportData.attendanceStats
        },
        generated_by: user.id
      };

      const { error } = await supabase
        .from('reports')
        .insert([reportRecord]);

      if (error) {
        console.error('Error saving report:', error);
        alert('Error saving report to database. The report export will continue.');
      } else {
        alert('Report saved successfully to Documents section!');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. The export will continue.');
    }
  };

  const exportToPDF = async () => {
    // For PDF export, we'd use a library like jsPDF
    // This creates a simplified HTML version for print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tanzania Assemblies of God - FCC Report</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin: 20px 0; }
          .section { margin: 30px 0; page-break-inside: avoid; }
          h1 { font-size: 24px; }
          h2 { font-size: 18px; }
          h3 { font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tanzania Assemblies of God - FCC</h1>
          <h2>Comprehensive Church Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Report Period: ${dateFrom || getStartDate(dateRange)} to ${dateTo || new Date().toISOString().split('T')[0]}</p>
        </div>
        
        <div class="section">
          <h3>Executive Summary</h3>
          <p>Total Members: ${reportData.membershipStats.totalMembers} | Active Departments: ${reportData.departmentStats.length} | Total Income: ${formatCurrency(reportData.financialStats.totalIncome)}</p>
        </div>
        
        <div class="section">
          <h3>Membership Statistics</h3>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Members</td><td>${reportData.membershipStats.totalMembers}</td></tr>
            <tr><td>Active Members</td><td>${reportData.membershipStats.activeMembers}</td></tr>
            <tr><td>New Members This Month</td><td>${reportData.membershipStats.newMembersThisMonth}</td></tr>
            <tr><td>Male Members</td><td>${reportData.membershipStats.membersByGender.male}</td></tr>
            <tr><td>Female Members</td><td>${reportData.membershipStats.membersByGender.female}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Financial Overview</h3>
          <table>
            <tr><th>Metric</th><th>Amount (TZS)</th></tr>
            <tr><td>Total Income</td><td>${formatCurrency(reportData.financialStats.totalIncome)}</td></tr>
            <tr><td>Total Expenses</td><td>${formatCurrency(reportData.financialStats.totalExpenses)}</td></tr>
            <tr><td>Net Amount</td><td>${formatCurrency(reportData.financialStats.totalIncome - reportData.financialStats.totalExpenses)}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Department Performance</h3>
          <table>
            <tr>
              <th>Department</th>
              <th>Members</th>
              <th>Leader</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net</th>
            </tr>
            ${reportData.departmentStats.map(dept => `
              <tr>
                <td>${dept.name}</td>
                <td>${dept.memberCount}</td>
                <td>${dept.leader?.name || 'No Leader'}</td>
                <td>${formatCurrency(dept.totalIncome || 0)}</td>
                <td>${formatCurrency(dept.totalExpenses || 0)}</td>
                <td>${formatCurrency(dept.netAmount || 0)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 5px; cursor: pointer;">Print/Save as PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => exportReport('pdf')}
                    icon={<Download className="h-4 w-4" />}
                  >
                    Export PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => exportReport('excel')}
                    icon={<FileText className="h-4 w-4" />}
                  >
                    Excel
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => exportReport('csv')}
                    icon={<FileText className="h-4 w-4" />}
                  >
                    CSV
                  </Button>
                </div>
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
                    {/* Department Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardBody className="text-center">
                          <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Total Departments</p>
                          <p className="text-2xl font-bold text-gray-900">{reportData.departmentStats.length}</p>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="text-center">
                          <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Total Members</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {reportData.departmentStats.reduce((sum, dept) => sum + dept.memberCount, 0)}
                          </p>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="text-center">
                          <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Total Income</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(reportData.departmentStats.reduce((sum, dept) => sum + (dept.totalIncome || 0), 0))}
                          </p>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="text-center">
                          <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">With Leaders</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {reportData.departmentStats.filter(dept => dept.leader).length}
                          </p>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Detailed Department Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {reportData.departmentStats.map((dept) => (
                        <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                          <CardBody>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                                {dept.swahiliName && (
                                  <p className="text-xs text-gray-500">{dept.swahiliName}</p>
                                )}
                              </div>
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>

                            {/* Leader Information */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-600 mb-1">Department Leader</p>
                              {dept.leader ? (
                                <div>
                                  <p className="font-medium text-gray-900">{dept.leader.name}</p>
                                  {dept.leader.email && (
                                    <p className="text-xs text-gray-600">{dept.leader.email}</p>
                                  )}
                                  {dept.leader.phone && (
                                    <p className="text-xs text-gray-600">{dept.leader.phone}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-red-600 font-medium">No Leader Assigned</p>
                              )}
                            </div>

                            {/* Membership Statistics */}
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Members</span>
                                <span className="font-medium">{dept.memberCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Active Members</span>
                                <span className="font-medium text-green-600">{dept.activeMembers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Inactive Members</span>
                                <span className="font-medium text-red-600">{dept.inactiveMembers || 0}</span>
                              </div>
                              {dept.memberCount > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${(dept.activeMembers / dept.memberCount) * 100}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>

                            {/* Financial Statistics */}
                            <div className="space-y-2 mb-4 p-3 border rounded-lg">
                              <p className="text-xs font-medium text-gray-600 mb-2">Financial Overview</p>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Income</span>
                                <span className="font-medium text-green-600">{formatCurrency(dept.totalIncome || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Expenses</span>
                                <span className="font-medium text-red-600">{formatCurrency(dept.totalExpenses || 0)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="text-sm font-medium text-gray-700">Net Amount</span>
                                <span className={`font-bold ${
                                  (dept.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(dept.netAmount || 0)}
                                </span>
                              </div>
                            </div>

                            {/* Activity Statistics */}
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Recent Events</span>
                                <span className="font-medium">{dept.recentEvents}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Recent Transactions</span>
                                <span className="font-medium">{dept.recentTransactions || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Transactions</span>
                                <span className="font-medium">{dept.transactionCount || 0}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 pt-4 border-t flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/departments/${dept.id}`}
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => exportReport('csv')}
                                className="flex-1"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>

                    {/* Department Performance Table */}
                    <Card className="mt-8">
                      <CardBody>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance Summary</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.departmentStats
                                .sort((a, b) => (b.totalIncome || 0) - (a.totalIncome || 0))
                                .map((dept) => (
                                <tr key={dept.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                                    {dept.swahiliName && (
                                      <div className="text-sm text-gray-500">{dept.swahiliName}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {dept.leader?.name || (
                                      <span className="text-red-600 font-medium">No Leader</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>{dept.memberCount}</div>
                                    <div className="text-xs text-gray-500">({dept.activeMembers} active)</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-900 mr-2">
                                        {dept.memberCount > 0 ? Math.round((dept.activeMembers / dept.memberCount) * 100) : 0}%
                                      </span>
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            dept.memberCount > 0 
                                              ? (dept.activeMembers / dept.memberCount) >= 0.8 
                                                ? 'bg-green-600' 
                                                : (dept.activeMembers / dept.memberCount) >= 0.5 
                                                  ? 'bg-yellow-600' 
                                                  : 'bg-red-600'
                                              : 'bg-gray-400'
                                          }`}
                                          style={{ 
                                            width: dept.memberCount > 0 
                                              ? `${(dept.activeMembers / dept.memberCount) * 100}%` 
                                              : '0%'
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                    {formatCurrency(dept.totalIncome || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                    {formatCurrency(dept.totalExpenses || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-sm font-medium ${
                                      (dept.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(dept.netAmount || 0)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>Events: {dept.recentEvents}</div>
                                    <div>Transactions: {dept.recentTransactions || 0}</div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardBody>
                    </Card>
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

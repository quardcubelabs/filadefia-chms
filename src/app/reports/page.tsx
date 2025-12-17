
'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Printer,
  Mail,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  Building2,
  TrendingDown,
  CreditCard,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import { Card, CardBody, Button, Badge, Loading, Alert } from '@/components/ui';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { pdf } from '@react-pdf/renderer';
import { PDFReport } from '@/components/reports/PDFReport';

// Update the JumuiyaData interface to include all required properties
interface JumuiyaData {
  id: string;
  name: string;
  swahiliName?: string;
  leader?: string;
  memberCount: number;
  activeMembers: number;
  inactiveMembers?: number;
  recentEvents: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  recentTransactions?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
}

interface DepartmentData {
  id: string;
  name: string;
  swahiliName?: string;
  leader?: {
    name: string;
    email?: string;
    phone?: string;
  };
  memberCount: number;
  activeMembers: number;
  inactiveMembers?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  recentEvents: number;
  recentTransactions?: number;
  transactionCount?: number;
}

interface ReportData {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembers: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  totalOfferings: number;
  totalTithes: number;
  averageAttendance: number;
  totalEvents: number;
  jumuiyas: JumuiyaData[];
  monthlyTrends: Array<{
    month: string;
    members: number;
    income: number;
    expenses: number;
    attendance: number;
  }>;
  membershipStats: {
    activeMembers: number;
    newMembersThisMonth: number;
    membersByStatus: Record<string, number>;
    membersByDepartment: Array<{
      name: string;
      count: number;
    }>;
    totalMembers: number;
  };
  financialStats: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    monthlyIncome: number;
    incomeByType: Array<{
      type: string;
      amount: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      income: number;
      expenses: number;
    }>;
  };
  eventStats: {
    totalEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    averageAttendance: number;
    eventsByType: Array<{
      type: string;
      count: number;
    }>;
  };
  departmentStats: DepartmentData[];
}

type ReportType = 'membership' | 'financial' | 'attendance' | 'jumuiya' | 'comprehensive';
type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

// Additional type definitions for data structures
interface Member {
  id: string;
  status: string;
  created_at: string;
  department_members?: Array<{
    department_id: string;
    departments: { name: string };
  }>;
}

interface FinancialTransaction {
  id: string;
  transaction_type: string;
  amount: string | number;
  date: string;
  category?: string;
}

interface Event {
  id: string;
  event_type: string;
  start_date: string;
  event_registrations?: Array<{ id: string }>;
}

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
  leader_id?: string;
  department_members?: Array<{
    member_id: string;
    members: {
      id: string;
      status: string;
      first_name: string;
      last_name: string;
    };
  }>;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    departmentId, 
    departmentName, 
    isDepartmentLeader, 
    canAccessAllDepartments,
    loading: departmentLoading 
  } = useDepartmentAccess();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>('comprehensive');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedJumuiya, setSelectedJumuiya] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('membership');

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Set default date range based on period
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = '';

    switch (reportPeriod) {
      case 'weekly':
        start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'monthly':
        start = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
        break;
      case 'quarterly':
        start = new Date(today.setMonth(today.getMonth() - 3)).toISOString().split('T')[0];
        break;
      case 'yearly':
        start = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
        break;
    }

    if (reportPeriod !== 'custom') {
      setStartDate(start);
      setEndDate(end);
    }
  }, [reportPeriod]);

  // Show loading while department access is being determined
  if (authLoading || departmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('Generating report...', { reportType, startDate, endDate });

      // Fetch all data in parallel
      const [
        membersData,
        financialData,
        attendanceData,
        jumuiyasData,
        membershipStats,
        financialStats,
        eventStats,
        departmentStats
      ] = await Promise.all([
        fetchMembersData(),
        fetchFinancialData(),
        fetchAttendanceData(),
        fetchJumuiyasData(),
        fetchMembershipStats(),
        fetchFinancialStats(),
        fetchEventStats(),
        fetchDepartmentStats()
      ]);

      const defaultMembershipStats = {
        activeMembers: 0,
        newMembersThisMonth: 0,
        membersByStatus: {},
        membersByDepartment: [],
        totalMembers: 0
      };
      
      const defaultFinancialStats = {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        monthlyIncome: 0,
        incomeByType: [],
        monthlyTrends: []
      };
      
      const defaultEventStats = {
        totalEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        averageAttendance: 0,
        eventsByType: []
      };
      
      const finalMembershipStats = membershipStats || defaultMembershipStats;
      const finalFinancialStats = financialStats || defaultFinancialStats;
      const finalEventStats = eventStats || defaultEventStats;

      const reportData = {
        jumuiyas: jumuiyasData,
        membershipStats: finalMembershipStats,
        financialStats: finalFinancialStats,
        eventStats: finalEventStats,
        departmentStats: departmentStats || [],
        // Direct properties for compatibility
        totalMembers: finalMembershipStats.totalMembers,
        activeMembers: finalMembershipStats.activeMembers,
        inactiveMembers: finalMembershipStats.totalMembers - finalMembershipStats.activeMembers,
        newMembers: finalMembershipStats.newMembersThisMonth,
        totalIncome: finalFinancialStats.totalIncome,
        totalExpenses: finalFinancialStats.totalExpenses,
        netAmount: finalFinancialStats.netAmount,
        totalOfferings: finalFinancialStats.totalIncome, // Placeholder - should be calculated from specific offering types
        totalTithes: finalFinancialStats.totalIncome * 0.1, // Placeholder - should be calculated from specific tithe transactions
        monthlyIncome: finalFinancialStats.monthlyIncome,
        incomeByType: finalFinancialStats.incomeByType,
        monthlyTrends: finalFinancialStats.monthlyTrends,
        averageAttendance: finalEventStats.averageAttendance,
        totalEvents: finalEventStats.totalEvents
      };

      setReportData(reportData);
      setSuccess('Report generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      console.log('Report generated successfully:', reportData);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please check your database connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersData = async () => {
    if (!supabase) return null;
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    const activeMembers = members?.filter((m: any) => m.status === 'active').length || 0;
    const inactiveMembers = members?.filter((m: any) => m.status === 'inactive').length || 0;

    return {
      totalMembers: members?.length || 0,
      activeMembers,
      inactiveMembers,
      newMembers: members?.filter((m: any) => {
        const joinDate = new Date(m.created_at);
        return joinDate >= new Date(startDate) && joinDate <= new Date(endDate);
      }).length || 0,
      monthlyTrends: []
    };
  };

  const fetchFinancialData = async () => {
    try {
      console.log('Fetching financial data from financial_transactions table...');
      
      if (!supabase) return null;
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching financial data:', error);
        throw error;
      }

      console.log('Financial transactions found:', transactions?.length || 0);

      if (!transactions || transactions.length === 0) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netAmount: 0,
          totalOfferings: 0,
          totalTithes: 0
        };
      }

      // Calculate totals based on transaction_type enum
      const incomeTypes = ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
      const expenseTypes = ['expense', 'welfare'];
      
      const income = transactions
        .filter((t: any) => incomeTypes.includes(t.transaction_type))
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
        
      const expenses = transactions
        .filter((t: any) => expenseTypes.includes(t.transaction_type))
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
        
      const offerings = transactions
        .filter((t: any) => t.transaction_type === 'offering')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
        
      const tithes = transactions
        .filter((t: any) => t.transaction_type === 'tithe')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      return {
        totalIncome: income,
        totalExpenses: expenses,
        netAmount: income - expenses,
        totalOfferings: offerings,
        totalTithes: tithes
      };
    } catch (err) {
      console.error('Error in fetchFinancialData:', err);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        totalOfferings: 0,
        totalTithes: 0
      };
    }
  };

  const fetchAttendanceData = async () => {
    try {
      console.log('Fetching attendance data...');
      
      if (!supabase) return null;
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching attendance data:', error);
        // Don't throw error, just return default values
        return {
          averageAttendance: 0,
          totalEvents: 0
        };
      }

      console.log('Attendance records found:', attendance?.length || 0);

      if (!attendance || attendance.length === 0) {
        return {
          averageAttendance: 0,
          totalEvents: 0
        };
      }

      // Group by date to count unique attendance events
      const uniqueDates = [...new Set(attendance.map((a: any) => a.date))];
      const totalEvents = uniqueDates.length;
      
      // Count total attendees
      const totalAttendees = attendance.length;
      const averageAttendance = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;

      return {
        averageAttendance,
        totalEvents
      };
    } catch (err) {
      console.error('Error in fetchAttendanceData:', err);
      return {
        averageAttendance: 0,
        totalEvents: 0
      };
    }
  };

  const fetchJumuiyasData = async (): Promise<JumuiyaData[]> => {
    try {
      console.log('Fetching department data (jumuiyas equivalent)...');
      
      if (!supabase) return [];
      // Since there's no jumuiyas table, use departments as equivalent
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          swahili_name,
          description,
          leader_id,
          is_active,
          department_members(
            member_id,
            members(id, status)
          )
        `);

      if (error) {
        console.error('Error fetching departments data:', error);
        return [];
      }

      console.log('Departments found:', departments?.length || 0);

      if (!departments || departments.length === 0) {
        return [];
      }

      return departments.map((dept: any) => {
        const members = dept.department_members || [];
        const activeMembers = members.filter((dm: any) => 
          dm.members && dm.members.status === 'active'
        ).length;
        const totalMembers = members.length;

        return {
          id: dept.id,
          name: dept.name,
          swahiliName: dept.swahili_name || dept.name,
          leader: 'N/A', // Would need to fetch leader details separately
          memberCount: totalMembers,
          activeMembers,
          inactiveMembers: totalMembers - activeMembers,
          recentEvents: 0,
          totalIncome: 0, // Would need financial transactions by department
          totalExpenses: 0,
          netAmount: 0,
          recentTransactions: []
        };
      });
    } catch (err) {
      console.error('Error in fetchJumuiyasData:', err);
      return [];
    }
  };

  const fetchMembershipStats = async () => {
    try {
      console.log('Fetching membership statistics...');
      
      if (!supabase) return null;
      let query = supabase
        .from('members')
        .select('id, status, created_at, department_members(department_id, departments(name))');

      // Apply department filtering for department leaders
      if (isDepartmentLeader && departmentId) {
        query = query.eq('department_members.department_id', departmentId);
      }

      const { data: members, error } = await query;

      if (error) {
        console.error('Error fetching membership stats:', error);
        return {
          activeMembers: 0,
          newMembersThisMonth: 0,
          membersByStatus: {},
          membersByDepartment: [],
          totalMembers: 0
        };
      }

      const totalMembers = members?.length || 0;
      const activeMembers = members?.filter((m: any) => m.status === 'active').length || 0;
      
      // Calculate new members this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newMembersThisMonth = members?.filter((m: any) => {
        const createdDate = new Date(m.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length || 0;

      // Count members by status
      const membersByStatus = members?.reduce((acc: { [key: string]: number }, member: any) => {
        acc[member.status] = (acc[member.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Count members by department
      const departmentCounts: { [key: string]: number } = {};
      members?.forEach((member: any) => {
        if (member.department_members && member.department_members.length > 0) {
          member.department_members.forEach((dm: any) => {
            if (dm.departments && Array.isArray(dm.departments)) {
              // Handle array format
              dm.departments.forEach((dept: any) => {
                if (dept.name) {
                  departmentCounts[dept.name] = (departmentCounts[dept.name] || 0) + 1;
                }
              });
            } else if (dm.departments && dm.departments.name) {
              // Handle object format
              const deptName = dm.departments.name;
              departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
            }
          });
        } else {
          departmentCounts['Unassigned'] = (departmentCounts['Unassigned'] || 0) + 1;
        }
      });

      const membersByDepartment = Object.entries(departmentCounts).map(([name, count]) => ({
        name,
        count
      }));

      return {
        activeMembers,
        newMembersThisMonth,
        membersByStatus,
        membersByDepartment,
        totalMembers
      };
    } catch (err) {
      console.error('Error in fetchMembershipStats:', err);
      return {
        activeMembers: 0,
        newMembersThisMonth: 0,
        membersByStatus: {},
        membersByDepartment: [],
        totalMembers: 0
      };
    }
  };

  const fetchFinancialStats = async () => {
    try {
      console.log('Fetching financial statistics...');
      
      if (!supabase) return null;
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          members(department_members(department_id, departments(name)))
        `);

      // Apply department filtering for department leaders
      if (isDepartmentLeader && departmentId) {
        query = query.eq('members.department_members.department_id', departmentId);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching financial stats:', error);
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netAmount: 0,
          monthlyIncome: 0,
          incomeByType: [],
          monthlyTrends: []
        };
      }

      if (!transactions || transactions.length === 0) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netAmount: 0,
          monthlyIncome: 0,
          incomeByType: [],
          monthlyTrends: []
        };
      }

      const incomeTypes = ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
      const expenseTypes = ['expense', 'welfare'];

      const totalIncome = transactions
        .filter((t: FinancialTransaction) => incomeTypes.includes(t.transaction_type))
        .reduce((sum: number, t: FinancialTransaction) => sum + parseFloat(String(t.amount)), 0);

      const totalExpenses = transactions
        .filter((t: FinancialTransaction) => expenseTypes.includes(t.transaction_type))
        .reduce((sum: number, t: FinancialTransaction) => sum + parseFloat(String(t.amount)), 0);

      // Calculate this month's income
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyIncome = transactions
        .filter((t: FinancialTransaction) => {
          const transDate = new Date(t.date);
          return incomeTypes.includes(t.transaction_type) &&
                 transDate.getMonth() === currentMonth &&
                 transDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, t: FinancialTransaction) => sum + parseFloat(String(t.amount)), 0);

      // Group income by type
      const incomeByType = incomeTypes.map(type => ({
        type,
        amount: transactions
          .filter((t: FinancialTransaction) => t.transaction_type === type)
          .reduce((sum: number, t: FinancialTransaction) => sum + parseFloat(String(t.amount)), 0)
      })).filter(item => item.amount > 0);

      return {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        monthlyIncome,
        incomeByType,
        monthlyTrends: [] // Could implement monthly trends calculation
      };
    } catch (err) {
      console.error('Error in fetchFinancialStats:', err);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        monthlyIncome: 0,
        incomeByType: [],
        monthlyTrends: []
      };
    }
  };

  const fetchEventStats = async () => {
    try {
      console.log('Fetching event statistics...');
      
      if (!supabase) return null;
      let query = supabase
        .from('events')
        .select('id, event_type, start_date, department_id, event_registrations(id)');

      // Apply department filtering for department leaders
      if (isDepartmentLeader && departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching event stats:', error);
        return {
          totalEvents: 0,
          upcomingEvents: 0,
          completedEvents: 0,
          averageAttendance: 0,
          eventsByType: []
        };
      }

      const totalEvents = events?.length || 0;
      const now = new Date();
      
      const upcomingEvents = events?.filter((e: Event) => new Date(e.start_date) > now).length || 0;
      const completedEvents = totalEvents - upcomingEvents;

      // Calculate average attendance from registrations
      const totalRegistrations = events?.reduce((sum: number, event: Event) => 
        sum + (event.event_registrations?.length || 0), 0) || 0;
      const averageAttendance = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;

      // Group events by type
      const eventTypeCount: { [key: string]: number } = {};
      events?.forEach((event: Event) => {
        eventTypeCount[event.event_type] = (eventTypeCount[event.event_type] || 0) + 1;
      });

      const eventsByType = Object.entries(eventTypeCount).map(([type, count]) => ({
        type,
        count
      }));

      return {
        totalEvents,
        upcomingEvents,
        completedEvents,
        averageAttendance,
        eventsByType
      };
    } catch (err) {
      console.error('Error in fetchEventStats:', err);
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        averageAttendance: 0,
        eventsByType: []
      };
    }
  };

  const fetchDepartmentStats = async (): Promise<DepartmentData[]> => {
    try {
      console.log('Fetching department statistics...');
      
      if (!supabase) return [];
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          swahili_name,
          leader_id,
          department_members(
            member_id,
            members(id, status, first_name, last_name)
          )
        `);

      if (error) {
        console.error('Error fetching department stats:', error);
        return [];
      }

      return departments?.map((dept: any) => {
        const members = dept.department_members || [];
        const activeMembers = members.filter((dm: { member_id: string; members: { id: string; status: string; first_name: string; last_name: string } }) => 
          dm.members && dm.members.status === 'active'
        ).length;
        const totalMembers = members.length;

        return {
          id: dept.id,
          name: dept.name,
          swahiliName: dept.swahili_name,
          leader: dept.leader_id ? {
            name: 'Department Leader', // Would need separate query for leader details
            email: '',
            phone: ''
          } : undefined,
          memberCount: totalMembers,
          activeMembers,
          inactiveMembers: totalMembers - activeMembers,
          totalIncome: 0, // Would need financial transactions by department
          totalExpenses: 0,
          netAmount: 0,
          recentEvents: 0,
          recentTransactions: 0,
          transactionCount: 0
        };
      }) || [];
    } catch (err) {
      console.error('Error in fetchDepartmentStats:', err);
      return [];
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      const periodText = reportPeriod === 'weekly' ? 'Weekly' : 
                        reportPeriod === 'monthly' ? 'Monthly' : 
                        reportPeriod === 'quarterly' ? 'Quarterly' : 'Custom';
      
      const filename = `FCC-${periodText}-Report-${currentDate}.pdf`;
      
      // Generate PDF using react-pdf
      const pdfBlob = await pdf(
        <PDFReport 
          reportData={reportData}
          reportType={reportType}
          startDate={startDate}
          endDate={endDate}
        />
      ).toBlob();
      
      // Create download link and trigger download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    
    // Report Header
    csvContent += `Filadelfia Church Report\n`;
    csvContent += `Report Type: ${reportType.toUpperCase()}\n`;
    csvContent += `Period: ${startDate} to ${endDate}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    // Membership Statistics
    if (reportType === 'membership' || reportType === 'comprehensive') {
      csvContent += `MEMBERSHIP STATISTICS\n`;
      csvContent += `Total Members,${reportData.totalMembers}\n`;
      csvContent += `Active Members,${reportData.activeMembers}\n`;
      csvContent += `Inactive Members,${reportData.inactiveMembers}\n`;
      csvContent += `New Members,${reportData.newMembers}\n\n`;
      
      // Members by Department
      if (reportData.membershipStats.membersByDepartment.length > 0) {
        csvContent += `MEMBERS BY DEPARTMENT\n`;
        csvContent += `Department,Count\n`;
        reportData.membershipStats.membersByDepartment.forEach(dept => {
          csvContent += `"${dept.name}",${dept.count}\n`;
        });
        csvContent += '\n';
      }
    }

    // Financial Statistics
    if (reportType === 'financial' || reportType === 'comprehensive') {
      csvContent += `FINANCIAL STATISTICS\n`;
      csvContent += `Total Income,${reportData.totalIncome}\n`;
      csvContent += `Total Expenses,${reportData.totalExpenses}\n`;
      csvContent += `Net Amount,${reportData.netAmount}\n`;
      csvContent += `Total Offerings,${reportData.totalOfferings}\n`;
      csvContent += `Total Tithes,${reportData.totalTithes}\n\n`;

      // Income by Type
      if (reportData.financialStats.incomeByType.length > 0) {
        csvContent += `INCOME BY TYPE\n`;
        csvContent += `Type,Amount\n`;
        reportData.financialStats.incomeByType.forEach(item => {
          csvContent += `"${item.type}",${item.amount}\n`;
        });
        csvContent += '\n';
      }
    }

    // Event Statistics
    if (reportType === 'attendance' || reportType === 'comprehensive') {
      csvContent += `EVENT STATISTICS\n`;
      csvContent += `Total Events,${reportData.eventStats.totalEvents}\n`;
      csvContent += `Upcoming Events,${reportData.eventStats.upcomingEvents}\n`;
      csvContent += `Completed Events,${reportData.eventStats.completedEvents}\n`;
      csvContent += `Average Attendance,${reportData.eventStats.averageAttendance}\n\n`;

      // Events by Type
      if (reportData.eventStats.eventsByType.length > 0) {
        csvContent += `EVENTS BY TYPE\n`;
        csvContent += `Type,Count\n`;
        reportData.eventStats.eventsByType.forEach(item => {
          csvContent += `"${item.type}",${item.count}\n`;
        });
        csvContent += '\n';
      }
    }

    // Department Statistics
    if (reportType === 'jumuiya' || reportType === 'comprehensive') {
      if (reportData.departmentStats.length > 0) {
        csvContent += `DEPARTMENT STATISTICS\n`;
        csvContent += `Name,Swahili Name,Member Count,Active Members,Total Income,Total Expenses,Net Amount\n`;
        reportData.departmentStats.forEach(dept => {
          csvContent += `"${dept.name}","${dept.swahiliName || ''}",${dept.memberCount},${dept.activeMembers},${dept.totalIncome || 0},${dept.totalExpenses || 0},${dept.netAmount || 0}\n`;
        });
        csvContent += '\n';
      }
    }

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `filadelfia-report-${reportType}-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    if (!reportData) {
      setError('No report data available. Please generate a report first.');
      return;
    }

    try {
      setError(null); // Clear any previous errors
      if (format === 'pdf') {
        exportToPDF();
      } else {
        exportToCSV();
      }
      setSuccess(`Report exported to ${format.toUpperCase()} successfully!`);
      setTimeout(() => setSuccess(null), 3000); // Auto-hide success message
    } catch (err) {
      console.error('Error exporting report:', err);
      setSuccess(null); // Clear any success messages
      setError(`Failed to export report to ${format.toUpperCase()}`);
    }
  };







  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">Generate comprehensive reports for your church management system</p>
            
            {/* Department Leader Access Notification */}
            {isDepartmentLeader && departmentName && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Department Access: {departmentName}
                    </h3>
                    <p className="text-sm text-red-700">
                      You have access to reports for your department only. Select "Comprehensive" to view all available data for your department.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Report Configuration */}
          <Card className="mb-8">
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  >
                    <option value="membership">
                      {isDepartmentLeader ? `${departmentName} - Membership` : 'Membership'}
                    </option>
                    <option value="financial">
                      {isDepartmentLeader ? `${departmentName} - Financial` : 'Financial'}
                    </option>
                    <option value="attendance">
                      {isDepartmentLeader ? `${departmentName} - Attendance` : 'Attendance'}
                    </option>
                    <option value="jumuiya">
                      {isDepartmentLeader ? `${departmentName} - Department` : 'Jumuiya'}
                    </option>
                    <option value="comprehensive">
                      {isDepartmentLeader ? `${departmentName} - Comprehensive` : 'Comprehensive'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={reportPeriod !== 'custom'}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={reportPeriod !== 'custom'}
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <Button
                  onClick={generateReport}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {loading ? <Loading /> : <FileText className="h-4 w-4" />}
                  <span>Generate Report</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    console.log('🔍 Testing database connectivity...');
                    try {
                      if (!supabase) {
                        console.log('Supabase client not available');
                        return;
                      }
                      // Test basic table access
                      const { data: membersTest, error: membersError } = await supabase.from('members').select('count(*)').single();
                      console.log('Members table test:', { data: membersTest, error: membersError });
                      
                      const { data: deptTest, error: deptError } = await supabase.from('departments').select('count(*)').single();
                      console.log('Departments table test:', { data: deptTest, error: deptError });
                      
                      const { data: finTest, error: finError } = await supabase.from('financial_transactions').select('count(*)').single();
                      console.log('Financial transactions test:', { data: finTest, error: finError });
                      
                      const { data: eventsTest, error: eventsError } = await supabase.from('events').select('count(*)').single();
                      console.log('Events table test:', { data: eventsTest, error: eventsError });
                      
                      setSuccess('Database connectivity test completed. Check console for details.');
                    } catch (err) {
                      console.error('Database test error:', err);
                      setError('Database connectivity test failed. Check console for details.');
                    }
                  }}
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                >
                  Test DB Connection
                </Button>

                {reportData && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => exportReport('pdf')}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export PDF</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportReport('csv')}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export CSV</span>
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Report Content */}
          {reportData && (
            <div className="space-y-8">
              {/* Tab Navigation - Exact design from image */}
              <div className="mb-6">
                <nav className="flex space-x-0">
                  {[
                    { id: 'membership', label: 'Membership', icon: Users },
                    { id: 'finance', label: 'Finance', icon: DollarSign },
                    { id: 'events', label: 'Events', icon: Calendar },
                    { id: 'departments', label: 'Departments', icon: Building2 }
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-red-100 text-red-600 rounded-tl-lg'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Membership Tab */}
              {activeTab === 'membership' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                      width: item.income > 0 ? `${Math.min(item.income / Math.max(...reportData.financialStats.monthlyTrends.map((t: any) => t.income)) * 100, 100)}%` : '0%'
                                    }}
                                  />
                                </div>
                                <div className="flex-1 h-2 bg-red-200 rounded">
                                  <div
                                    className="h-2 bg-red-600 rounded"
                                    style={{
                                      width: item.expenses > 0 ? `${Math.min(item.expenses / Math.max(...reportData.financialStats.monthlyTrends.map((t: any) => t.expenses)) * 100, 100)}%` : '0%'
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
                          {reportData.departmentStats.reduce((sum: number, dept: DepartmentData) => sum + dept.memberCount, 0)}
                        </p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody className="text-center">
                        <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Total Income</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.departmentStats.reduce((sum: number, dept: DepartmentData) => sum + (dept.totalIncome || 0), 0))}
                        </p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody className="text-center">
                        <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">With Leaders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.departmentStats.filter((dept: DepartmentData) => dept.leader).length}
                        </p>
                      </CardBody>
                    </Card>
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
                              .sort((a: DepartmentData, b: DepartmentData) => (b.totalIncome || 0) - (a.totalIncome || 0))
                              .map((dept: DepartmentData) => (
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
            </div>
          )}

          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mt-6">
              {success}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

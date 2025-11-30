
'use client';

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
import jsPDF from 'jspdf';

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

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

      setReportData({
        ...membersData,
        ...financialData,
        ...attendanceData,
        jumuiyas: jumuiyasData,
        membershipStats,
        financialStats,
        eventStats,
        departmentStats
      });
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersData = async () => {
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
    const { data: transactions, error } = await supabase
      .from('offerings')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const income = transactions?.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    const expenses = transactions?.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    const offerings = transactions?.filter((t: any) => t.category === 'offering').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
    const tithes = transactions?.filter((t: any) => t.category === 'tithe').reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netAmount: income - expenses,
      totalOfferings: offerings,
      totalTithes: tithes
    };
  };

  const fetchAttendanceData = async () => {
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totalAttendance = attendance?.reduce((sum: number, a: any) => sum + (a.count || 0), 0) || 0;
    const averageAttendance = attendance?.length ? totalAttendance / attendance.length : 0;

    return {
      averageAttendance: Math.round(averageAttendance),
      totalEvents: attendance?.length || 0
    };
  };

  const fetchJumuiyasData = async (): Promise<JumuiyaData[]> => {
    const { data: jumuiyas, error } = await supabase
      .from('jumuiyas')
      .select(`
        *,
        members:members(count),
        offerings:offerings(amount, type)
      `);

    if (error) throw error;

    return jumuiyas?.map((j: any) => {
      const totalIncome = j.offerings?.filter((o: any) => o.type === 'income').reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0;
      const totalExpenses = j.offerings?.filter((o: any) => o.type === 'expense').reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0;

      return {
        id: j.id,
        name: j.name,
        swahiliName: j.swahili_name,
        leader: j.leader_name,
        memberCount: j.members?.[0]?.count || 0,
        activeMembers: j.members?.[0]?.count || 0,
        inactiveMembers: 0,
        recentEvents: 0,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        recentTransactions: []
      };
    }) || [];
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Filadelfia Church Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 20, 35);
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 42);
    
    let yPos = 55;

    // Membership Section
    if (reportType === 'membership' || reportType === 'comprehensive') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Membership Statistics', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Members: ${reportData.totalMembers}`, 25, yPos);
      yPos += 7;
      doc.text(`Active Members: ${reportData.activeMembers}`, 25, yPos);
      yPos += 7;
      doc.text(`Inactive Members: ${reportData.inactiveMembers}`, 25, yPos);
      yPos += 7;
      doc.text(`New Members: ${reportData.newMembers}`, 25, yPos);
      yPos += 15;
    }

    // Financial Section
    if (reportType === 'financial' || reportType === 'comprehensive') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Statistics', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Income: ${formatCurrency(reportData.totalIncome)}`, 25, yPos);
      yPos += 7;
      doc.text(`Total Expenses: ${formatCurrency(reportData.totalExpenses)}`, 25, yPos);
      yPos += 7;
      doc.text(`Net Amount: ${formatCurrency(reportData.netAmount)}`, 25, yPos);
      yPos += 7;
      doc.text(`Total Offerings: ${formatCurrency(reportData.totalOfferings)}`, 25, yPos);
      yPos += 7;
      doc.text(`Total Tithes: ${formatCurrency(reportData.totalTithes)}`, 25, yPos);
      yPos += 15;
    }

    // Attendance Section
    if (reportType === 'attendance' || reportType === 'comprehensive') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Attendance Statistics', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Average Attendance: ${reportData.averageAttendance}`, 25, yPos);
      yPos += 7;
      doc.text(`Total Events: ${reportData.totalEvents}`, 25, yPos);
      yPos += 15;
    }

    doc.save('filadelfia-report.pdf');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    if (!reportData) return;

    if (format === 'pdf') {
      exportToPDF();
    } else {
      // CSV export logic would go here
      console.log('CSV export not implemented yet');
    }
  };

  const fetchMembershipStats = async () => {
    const { data: members, error } = await supabase
      .from('members')
      .select('status, department_id, departments(name)')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    const membersByStatus: Record<string, number> = {};
    const membersByDepartment: Array<{ name: string; count: number }> = [];

    members?.forEach((member: any) => {
      // Count by status
      membersByStatus[member.status] = (membersByStatus[member.status] || 0) + 1;

      // Count by department
      const deptName = member.departments?.name || 'Unknown';
      const existingDept = membersByDepartment.find(d => d.name === deptName);
      if (existingDept) {
        existingDept.count++;
      } else {
        membersByDepartment.push({ name: deptName, count: 1 });
      }
    });

    const newMembersThisMonth = members?.filter((m: any) => {
      const joinDate = new Date(m.created_at);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length || 0;

    return {
      activeMembers: membersByStatus.active || 0,
      newMembersThisMonth,
      membersByStatus,
      membersByDepartment,
      totalMembers: members?.length || 0
    };
  };

  const fetchFinancialStats = async () => {
    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totalIncome = transactions?.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    const totalExpenses = transactions?.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

    const incomeByType: Array<{ type: string; amount: number }> = [];
    const monthlyTrends: Array<{ month: string; income: number; expenses: number }> = [];

    // Group by type
    const typeGroups: Record<string, number> = {};
    transactions?.forEach((t: any) => {
      if (t.type === 'income') {
        typeGroups[t.category || 'other'] = (typeGroups[t.category || 'other'] || 0) + t.amount;
      }
    });

    Object.entries(typeGroups).forEach(([type, amount]) => {
      incomeByType.push({ type, amount });
    });

    // Monthly trends (simplified)
    const monthlyIncome = totalIncome / 12; // Rough estimate

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      monthlyIncome,
      incomeByType,
      monthlyTrends
    };
  };

  const fetchEventStats = async () => {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totalEvents = events?.length || 0;
    const upcomingEvents = events?.filter((e: any) => new Date(e.date) > new Date()).length || 0;
    const completedEvents = totalEvents - upcomingEvents;

    const eventsByType: Array<{ type: string; count: number }> = [];
    const typeGroups: Record<string, number> = {};

    events?.forEach((e: any) => {
      typeGroups[e.type || 'other'] = (typeGroups[e.type || 'other'] || 0) + 1;
    });

    Object.entries(typeGroups).forEach(([type, count]) => {
      eventsByType.push({ type, count });
    });

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      averageAttendance: 0, // Would need attendance data
      eventsByType
    };
  };

  const fetchDepartmentStats = async (): Promise<DepartmentData[]> => {
    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        *,
        members:department_members(count),
        leaders:department_leaders(
          members:member_id(name, email, phone)
        ),
        financial_transactions!inner(amount, type, date)
      `)
      .gte('financial_transactions.date', startDate)
      .lte('financial_transactions.date', endDate);

    if (error) throw error;

    return departments?.map((dept: any) => {
      const totalIncome = dept.financial_transactions?.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
      const totalExpenses = dept.financial_transactions?.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

      return {
        id: dept.id,
        name: dept.name,
        swahiliName: dept.swahili_name,
        leader: dept.leaders?.[0]?.members ? {
          name: dept.leaders[0].members.name,
          email: dept.leaders[0].members.email,
          phone: dept.leaders[0].members.phone
        } : undefined,
        memberCount: dept.members?.[0]?.count || 0,
        activeMembers: dept.members?.[0]?.count || 0,
        inactiveMembers: 0,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        recentEvents: 0,
        recentTransactions: dept.financial_transactions?.length || 0,
        transactionCount: dept.financial_transactions?.length || 0
      };
    }) || [];
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="membership">Membership</option>
                    <option value="financial">Financial</option>
                    <option value="attendance">Attendance</option>
                    <option value="jumuiya">Jumuiya</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={reportPeriod !== 'custom'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {['membership', 'finance', 'events', 'departments'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
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
        </div>
      </div>
    </div>
  );
}

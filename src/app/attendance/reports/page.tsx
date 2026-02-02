'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Building2,
  UserCheck,
  UserX,
  Activity,
  Clock,
  ArrowLeft
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Legend,
  Pie,
  Area,
  AreaChart
} from 'recharts';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';

interface AttendanceStats {
  overview: {
    totalMembers: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    totalSessions: number;
  };
  dateStats: Array<{
    date: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }>;
  typeStats: Array<{
    type: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }>;
  topAttendees: Array<{
    id: string;
    first_name: string;
    last_name: string;
    member_number: string;
    attendance_rate: number;
    total_sessions: number;
    present_count: number;
  }>;
}

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
}

export default function AttendanceReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { departmentId, isDepartmentLeader } = useDepartmentAccess();
  
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(departmentId || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const COLORS = {
    primary: '#2563eb',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6'
  };

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.danger, COLORS.info];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [user, authLoading, router]);

  useEffect(() => {
    loadAttendanceStats();
  }, [selectedPeriod, selectedDepartment, selectedType]);

  const loadInitialData = async () => {
    try {
      // Load departments
      const deptResponse = await fetch('/api/departments');
      if (!deptResponse.ok) {
        throw new Error(`Failed to fetch departments: ${deptResponse.status}`);
      }
      const deptData = await deptResponse.json();
      if (deptData.data) {
        setDepartments(deptData.data);
      }
      
      // Set default department for department leaders
      if (!selectedDepartment && departmentId) {
        setSelectedDepartment(departmentId);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      alert('Failed to load departments. Please refresh the page.');
    }
  };

  const loadAttendanceStats = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        period: selectedPeriod
      });

      if (selectedDepartment !== 'all') {
        params.set('department_id', selectedDepartment);
      }

      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }

      const response = await fetch(`/api/attendance/stats?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      const data = await response.json();

      if (data.data) {
        setStats(data.data);
      } else {
        console.error('Failed to load attendance stats:', data.error);
        alert('Failed to load attendance statistics.');
      }
    } catch (error) {
      console.error('Error loading attendance stats:', error);
      alert('Failed to load attendance statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAttendanceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Unknown Department';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  // Aggregate chart data based on selected period
  const getAggregatedChartData = () => {
    if (!stats?.dateStats) return [];

    if (chartPeriod === 'daily') {
      // Show all 7 days of the week (Sun-Sat) like the reference design
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Group data by day of week
      const dayData: Record<number, { present: number; absent: number; total: number; sessions: number }> = {};
      
      // Initialize all days
      for (let i = 0; i < 7; i++) {
        dayData[i] = { present: 0, absent: 0, total: 0, sessions: 0 };
      }
      
      // Aggregate sessions by day of week
      stats.dateStats.forEach(item => {
        const date = new Date(item.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        dayData[dayOfWeek].present += item.present;
        dayData[dayOfWeek].absent += item.absent;
        dayData[dayOfWeek].total += item.total;
        dayData[dayOfWeek].sessions += 1;
      });

      return dayNames.map((name, index) => ({
        date: name,
        label: name,
        present: dayData[index].present,
        absent: dayData[index].absent,
        total: dayData[index].total,
        sessions: dayData[index].sessions,
        percentage: dayData[index].total > 0 ? (dayData[index].present / dayData[index].total) * 100 : 0
      }));
    }

    if (chartPeriod === 'weekly') {
      // Aggregate by week
      const weeklyData: Record<string, { present: number; absent: number; total: number; sessions: number }> = {};
      
      stats.dateStats.forEach(item => {
        const date = new Date(item.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start from Sunday
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { present: 0, absent: 0, total: 0, sessions: 0 };
        }
        weeklyData[weekKey].present += item.present;
        weeklyData[weekKey].absent += item.absent;
        weeklyData[weekKey].total += item.total;
        weeklyData[weekKey].sessions += 1;
      });

      return Object.entries(weeklyData)
        .map(([date, data]) => ({
          date,
          present: data.present,
          absent: data.absent,
          total: data.total,
          sessions: data.sessions,
          percentage: data.total > 0 ? (data.present / data.total) * 100 : 0,
          label: `Week of ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    if (chartPeriod === 'monthly') {
      // Aggregate by month
      const monthlyData: Record<string, { present: number; absent: number; total: number; sessions: number }> = {};
      
      stats.dateStats.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { present: 0, absent: 0, total: 0, sessions: 0 };
        }
        monthlyData[monthKey].present += item.present;
        monthlyData[monthKey].absent += item.absent;
        monthlyData[monthKey].total += item.total;
        monthlyData[monthKey].sessions += 1;
      });

      return Object.entries(monthlyData)
        .map(([date, data]) => ({
          date,
          present: data.present,
          absent: data.absent,
          total: data.total,
          sessions: data.sessions,
          percentage: data.total > 0 ? (data.present / data.total) * 100 : 0,
          label: new Date(date + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return stats.dateStats;
  };

  const chartData = getAggregatedChartData();

  const exportReport = async () => {
    try {
      // Create CSV data
      const csvData = [];
      
      // Overview data
      csvData.push(['Attendance Report', '', '', '']);
      csvData.push(['Period', selectedPeriod, '', '']);
      csvData.push(['Department', selectedDepartment === 'all' ? 'All Departments' : getDepartmentName(selectedDepartment), '', '']);
      csvData.push(['Generated', new Date().toLocaleString(), '', '']);
      csvData.push(['', '', '', '']);
      
      // Summary stats
      if (stats) {
        csvData.push(['Summary Statistics', '', '', '']);
        csvData.push(['Total Members', stats.overview.totalMembers.toString(), '', '']);
        csvData.push(['Present Count', stats.overview.presentCount.toString(), '', '']);
        csvData.push(['Absent Count', stats.overview.absentCount.toString(), '', '']);
        csvData.push(['Attendance Rate', `${stats.overview.attendanceRate.toFixed(1)}%`, '', '']);
        csvData.push(['Total Sessions', stats.overview.totalSessions.toString(), '', '']);
        csvData.push(['', '', '', '']);
        
        // Date-wise attendance
        csvData.push(['Date-wise Attendance', '', '', '']);
        csvData.push(['Date', 'Present', 'Absent', 'Percentage']);
        stats.dateStats.forEach(stat => {
          csvData.push([
            stat.date,
            stat.present.toString(),
            stat.absent.toString(),
            `${stat.percentage.toFixed(1)}%`
          ]);
        });
        csvData.push(['', '', '', '']);
        
        // Top attendees
        csvData.push(['Top Attendees', '', '', '']);
        csvData.push(['Member', 'Member Number', 'Sessions Attended', 'Attendance Rate']);
        stats.topAttendees.forEach(member => {
          csvData.push([
            `${member.first_name} ${member.last_name}`,
            member.member_number,
            `${member.present_count}/${member.total_sessions}`,
            `${member.attendance_rate.toFixed(1)}%`
          ]);
        });
      }

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Attendance Reports</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Analytics and insights for church attendance</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-3 sm:space-y-4">
            {/* Mobile: Stack filters vertically */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">This Week</option>
                  <option value="monthly">This Month</option>
                  <option value="quarterly">This Quarter</option>
                  <option value="yearly">This Year</option>
                </select>
              </div>

              {!isDepartmentLeader && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Services</option>
                  <option value="sunday_service">Sunday Service</option>
                  <option value="midweek_fellowship">Midweek Fellowship</option>
                  <option value="special_event">Special Event</option>
                  <option value="department_meeting">Department Meeting</option>
                  <option value="zone_meeting">Zone Meeting</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:justify-end">
              <button
                onClick={loadAttendanceStats}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportReport}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {stats ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Members</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.overview.totalMembers}</p>
                  </div>
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Present</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.overview.presentCount}</p>
                  </div>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Absent</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mt-0.5 sm:mt-1">{stats.overview.absentCount}</p>
                  </div>
                  <div className="bg-red-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                    <UserX className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Attendance Rate</p>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${getAttendanceColor(stats.overview.attendanceRate)} mt-0.5 sm:mt-1`}>
                      {stats.overview.attendanceRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-4 sm:space-y-6">
              {/* Mobile: Stack charts vertically */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Attendance Trend Chart - Modern Wave Design */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Trend</h3>
                    <select 
                      className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  {/* Area Chart with SVG */}
                  <div className="relative h-64">
                    {/* Floating value label */}
                    {stats.dateStats.length > 0 && (
                      <div className="absolute top-4 right-16 sm:right-24 z-10">
                        <p className="text-sm text-gray-500 mb-1">
                          {stats.dateStats.length > 0 ? new Date(stats.dateStats[stats.dateStats.length - 1]?.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ''}
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                          {stats.overview.attendanceRate.toFixed(1)}%
                          <span className={`text-sm sm:text-base font-semibold ml-2 ${stats.overview.attendanceRate >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                            {stats.overview.attendanceRate >= 70 ? '↑' : '↓'}
                          </span>
                        </p>
                      </div>
                    )}

                    <svg className="w-full h-full" viewBox="0 0 700 250" preserveAspectRatio="none">
                      <defs>
                        {/* Gradient fill for area */}
                        <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.25 }} />
                          <stop offset="50%" style={{ stopColor: '#93c5fd', stopOpacity: 0.15 }} />
                          <stop offset="100%" style={{ stopColor: '#dbeafe', stopOpacity: 0.05 }} />
                        </linearGradient>
                      </defs>
                      
                      {/* Area fill - smooth wave */}
                      <path
                        d={(() => {
                          if (!stats.dateStats || stats.dateStats.length === 0) {
                            return "M 0 200 L 700 200 L 700 250 L 0 250 Z";
                          }
                          const data = stats.dateStats;
                          const width = 700;
                          const height = 200;
                          const padding = 50;
                          const maxVal = Math.max(...data.map(d => d.percentage), 100);
                          const points = data.map((d, i) => {
                            const x = (i / (data.length - 1 || 1)) * (width - padding) + padding / 2;
                            const y = height - (d.percentage / maxVal) * (height - 50);
                            return { x, y };
                          });
                          
                          if (points.length === 1) {
                            return `M 0 ${points[0].y} L 700 ${points[0].y} L 700 250 L 0 250 Z`;
                          }
                          
                          let path = `M ${points[0].x} ${points[0].y}`;
                          for (let i = 1; i < points.length; i++) {
                            const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
                            const cp1y = points[i - 1].y;
                            const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
                            const cp2y = points[i].y;
                            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
                          }
                          path += ` L 700 250 L 0 250 Z`;
                          return path;
                        })()}
                        fill="url(#attendanceGradient)"
                      />
                      
                      {/* Line - smooth wave */}
                      <path
                        d={(() => {
                          if (!stats.dateStats || stats.dateStats.length === 0) {
                            return "M 0 200 L 700 200";
                          }
                          const data = stats.dateStats;
                          const width = 700;
                          const height = 200;
                          const padding = 50;
                          const maxVal = Math.max(...data.map(d => d.percentage), 100);
                          const points = data.map((d, i) => {
                            const x = (i / (data.length - 1 || 1)) * (width - padding) + padding / 2;
                            const y = height - (d.percentage / maxVal) * (height - 50);
                            return { x, y };
                          });
                          
                          if (points.length === 1) {
                            return `M 0 ${points[0].y} L 700 ${points[0].y}`;
                          }
                          
                          let path = `M ${points[0].x} ${points[0].y}`;
                          for (let i = 1; i < points.length; i++) {
                            const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
                            const cp1y = points[i - 1].y;
                            const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
                            const cp2y = points[i].y;
                            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
                          }
                          return path;
                        })()}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Dots at data points */}
                      {stats.dateStats && stats.dateStats.length > 0 && (() => {
                        const data = stats.dateStats;
                        const width = 700;
                        const height = 200;
                        const padding = 50;
                        const maxVal = Math.max(...data.map(d => d.percentage), 100);
                        const lastIndex = data.length - 1;
                        const x = (lastIndex / (data.length - 1 || 1)) * (width - padding) + padding / 2;
                        const y = height - (data[lastIndex].percentage / maxVal) * (height - 50);
                        return (
                          <>
                            <circle cx={x} cy={y} r="8" fill="#2563eb" stroke="white" strokeWidth="3"/>
                            <line 
                              x1={x} 
                              y1={y} 
                              x2={x} 
                              y2={250} 
                              stroke="#cbd5e1" 
                              strokeWidth="1.5" 
                              strokeDasharray="5 5" 
                              opacity="0.5"
                            />
                          </>
                        );
                      })()}
                    </svg>
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                      {stats.dateStats && stats.dateStats.length > 0 ? (
                        stats.dateStats.slice(0, 7).map((item, idx) => (
                          <span 
                            key={`${item.date}-${idx}`} 
                            className={`text-xs sm:text-sm ${idx === stats.dateStats.slice(0, 7).length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
                          >
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No data available</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Type Distribution - Donut Chart */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Service Types</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <Pie
                        dataKey="total"
                        data={stats.typeStats.map((stat, index) => ({
                          ...stat,
                          name: formatAttendanceType(stat.type),
                          percentage: stat.percentage
                        }))}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ cx: cxVal, cy: cyVal, midAngle: angle, outerRadius: oRadius, percentage: pct }: any) => {
                          const RADIAN = Math.PI / 180;
                          const radius = (oRadius as number) + 25;
                          const x = (cxVal as number) + radius * Math.cos(-angle * RADIAN);
                          const y = (cyVal as number) + radius * Math.sin(-angle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#374151"
                              textAnchor={x > (cxVal as number) ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={14}
                              fontWeight={600}
                            >
                              {`${(pct as number).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        labelLine={false}
                      >
                        {stats.typeStats.map((entry, index) => {
                          const donutColors = ['#8b5cf6', '#f97316', '#ec4899', '#22d3ee', '#10b981'];
                          return <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]?.payload;
                            return (
                              <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg">
                                <p className="text-sm font-medium">{data?.name}</p>
                                <p className="text-lg font-bold">{data?.percentage?.toFixed(1)}%</p>
                                <p className="text-xs text-gray-300">{data?.total} attendance records</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  {/* Custom Legend */}
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2">
                    {stats.typeStats.map((stat, index) => {
                      const donutColors = ['#8b5cf6', '#f97316', '#ec4899', '#22d3ee', '#10b981'];
                      return (
                        <div key={stat.type} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: donutColors[index % donutColors.length] }}
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            {formatAttendanceType(stat.type)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Daily Attendance Breakdown - Curved Line Chart */}
              <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Attendance Breakdown</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                        <span className="text-sm text-gray-600">Present</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span className="text-sm text-gray-600">Absent</span>
                      </div>
                    </div>
                  </div>
                  <select 
                    value={chartPeriod}
                    onChange={(e) => setChartPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Weekly View</option>
                    <option value="weekly">By Week</option>
                    <option value="monthly">By Month</option>
                  </select>
                </div>
                
                {chartData.length > 0 && (
                  <>
                    <div className="mb-4 text-sm text-gray-500">
                      {chartPeriod === 'daily' && `${stats?.dateStats?.length || 0} session(s) across the week`}
                      {chartPeriod === 'weekly' && `Showing ${chartData.length} week(s) with ${stats?.dateStats?.length || 0} total sessions`}
                      {chartPeriod === 'monthly' && `Showing ${chartData.length} month(s) with ${stats?.dateStats?.length || 0} total sessions`}
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05}/>
                          </linearGradient>
                          <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          dy={10}
                          interval={0}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          width={40}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]?.payload;
                              if (data?.total === 0) {
                                return (
                                  <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
                                    <p className="text-sm font-medium">{label}</p>
                                    <p className="text-xs text-gray-400">No sessions recorded</p>
                                  </div>
                                );
                              }
                              return (
                                <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
                                  <p className="text-sm font-medium mb-2">{label}</p>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="text-cyan-400">Present:</span> {data?.present}
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-blue-400">Absent:</span> {data?.absent}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                      Total: {data?.total} | Rate: {data?.percentage?.toFixed(1)}%
                                    </p>
                                    {data?.sessions && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        {data.sessions} session(s)
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="present"
                          stroke="#22d3ee"
                          strokeWidth={3}
                          fill="url(#presentGradient)"
                          name="Present"
                          dot={{ fill: '#22d3ee', strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 7, fill: '#fff', stroke: '#22d3ee', strokeWidth: 3 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="absent"
                          stroke="#2563eb"
                          strokeWidth={3}
                          fill="url(#absentGradient)"
                          name="Absent"
                          dot={{ fill: '#2563eb', strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 7, fill: '#fff', stroke: '#2563eb', strokeWidth: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>

            {/* Top Attendees */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Attendees</h3>
              </div>
              
              {stats.topAttendees.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-3 sm:px-6">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No attendance data</h3>
                  <p className="text-sm sm:text-base text-gray-500">Start recording attendance to see top attendees.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {stats.topAttendees.map((member, index) => (
                    <div key={member.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between space-x-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white ${
                              index < 3 ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">#{member.member_number}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {member.present_count} / {member.total_sessions}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-600">Sessions</p>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-xs sm:text-sm font-medium ${getAttendanceColor(member.attendance_rate)}`}>
                              {member.attendance_rate.toFixed(1)}%
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-600">Rate</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4">There's no attendance data for the selected filters.</p>
            <button
              onClick={() => router.push('/attendance/record')}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Record Attendance
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
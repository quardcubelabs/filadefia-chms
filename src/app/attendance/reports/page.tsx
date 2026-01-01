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
  Pie
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
                {/* Attendance Trend Chart */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats.dateStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value, name) => [
                          name === 'percentage' ? `${value}%` : value,
                          name === 'percentage' ? 'Attendance Rate' : name === 'present' ? 'Present' : 'Absent'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke={COLORS.primary} 
                        strokeWidth={2}
                        dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Service Type Distribution */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Service Types</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        dataKey="total"
                        data={stats.typeStats.map((stat, index) => ({
                          ...stat,
                          name: formatAttendanceType(stat.type)
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={false}
                      >
                        {stats.typeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Attendance Bars - Full Width */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Daily Attendance Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.dateStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="present" stackId="attendance" fill={COLORS.secondary} name="Present" />
                    <Bar dataKey="absent" stackId="attendance" fill={COLORS.danger} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
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
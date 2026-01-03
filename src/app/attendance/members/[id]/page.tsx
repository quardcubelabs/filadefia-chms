'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Award,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string;
  phone: string;
  email?: string;
  address: string;
  photo_url?: string;
  status: string;
  date_of_birth: string;
  membership_date: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  attendance_type: string;
  present: boolean;
  notes?: string;
  event_id?: string;
  recorded_by: string;
  created_at: string;
  recorder?: {
    first_name: string;
    last_name: string;
  };
}

interface AttendanceStats {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
  streak: {
    current: number;
    longest: number;
    type: 'present' | 'absent';
  };
  monthly_stats: Array<{
    month: string;
    total: number;
    present: number;
    rate: number;
  }>;
}

export default function MemberAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const memberId = params.id as string;
  
  const [member, setMember] = useState<Member | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('year');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (memberId) {
      loadMemberData();
    }
  }, [user, authLoading, router, memberId]);

  useEffect(() => {
    if (memberId) {
      loadAttendanceData();
    }
  }, [memberId, period, typeFilter]);

  const loadMemberData = async () => {
    try {
      const response = await fetch(`/api/members/${memberId}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setMember(data.data);
      } else {
        console.error('Failed to load member:', data.error);
        router.push('/members');
      }
    } catch (error) {
      console.error('Error loading member:', error);
      router.push('/members');
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        member_id: memberId
      });

      if (typeFilter !== 'all') {
        params.set('type', typeFilter);
      }

      // Load attendance records
      const recordsResponse = await fetch(`/api/attendance?${params}`);
      const recordsData = await recordsResponse.json();

      if (recordsData.data) {
        setAttendanceRecords(recordsData.data);
        calculateStats(recordsData.data);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    if (records.length === 0) {
      setStats({
        total_sessions: 0,
        present_count: 0,
        absent_count: 0,
        attendance_rate: 0,
        streak: { current: 0, longest: 0, type: 'present' },
        monthly_stats: []
      });
      return;
    }

    const totalSessions = records.length;
    const presentCount = records.filter(r => r.present).length;
    const absentCount = totalSessions - presentCount;
    const attendanceRate = (presentCount / totalSessions) * 100;

    // Calculate streaks
    const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakType: 'present' | 'absent' = 'present';
    let tempStreak = 0;
    let tempType = sortedRecords[0]?.present ? 'present' : 'absent';

    for (const record of sortedRecords) {
      const isPresent = record.present;
      if ((tempType === 'present' && isPresent) || (tempType === 'absent' && !isPresent)) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        tempType = isPresent ? 'present' : 'absent';
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak (from most recent)
    currentStreakType = sortedRecords[0]?.present ? 'present' : 'absent';
    for (const record of sortedRecords) {
      if ((currentStreakType === 'present' && record.present) || 
          (currentStreakType === 'absent' && !record.present)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Monthly stats
    const monthlyData = records.reduce((acc: Record<string, any>, record) => {
      const month = new Date(record.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, present: 0 };
      }
      acc[month].total++;
      if (record.present) acc[month].present++;
      return acc;
    }, {});

    const monthlyStats = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      total: data.total,
      present: data.present,
      rate: (data.present / data.total) * 100
    })).sort((a, b) => a.month.localeCompare(b.month));

    setStats({
      total_sessions: totalSessions,
      present_count: presentCount,
      absent_count: absentCount,
      attendance_rate: attendanceRate,
      streak: {
        current: currentStreak,
        longest: longestStreak,
        type: currentStreakType
      },
      monthly_stats: monthlyStats
    });
  };

  const formatAttendanceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const getStreakColor = (type: 'present' | 'absent') => {
    return type === 'present' ? 'text-green-600' : 'text-red-600';
  };

  const exportAttendance = () => {
    if (!member || !attendanceRecords.length) return;

    const csvData = [];
    csvData.push(['Member Attendance Report', '', '', '', '']);
    csvData.push(['Member', `${member.first_name} ${member.last_name}`, '', '', '']);
    csvData.push(['Member Number', member.member_number, '', '', '']);
    csvData.push(['Generated', new Date().toLocaleString(), '', '', '']);
    csvData.push(['', '', '', '', '']);
    csvData.push(['Date', 'Service Type', 'Present', 'Notes', 'Recorded By']);
    
    attendanceRecords.forEach(record => {
      csvData.push([
        record.date,
        formatAttendanceType(record.attendance_type),
        record.present ? 'Yes' : 'No',
        record.notes || '',
        record.recorder ? `${record.recorder.first_name} ${record.recorder.last_name}` : ''
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${member.first_name}-${member.last_name}-attendance.csv`;
    link.click();
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

  if (!member) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Member not found</h3>
          <p className="text-gray-500 mb-4">The requested member could not be found.</p>
          <button
            onClick={() => router.push('/members')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Members
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-6">
            {/* Top row with back button and member info */}
            <div className="flex items-start space-x-3 sm:space-x-4">
              <button
                onClick={() => router.back()}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 flex-1 min-w-0">
                {/* Member photo and basic info */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                      {member.first_name} {member.last_name}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">#{member.member_number}</p>
                  </div>
                </div>

                {/* Contact info - stack on mobile */}
                <div className="flex flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{member.phone}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={loadAttendanceData}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportAttendance}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
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
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Sessions</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.total_sessions}</p>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Present</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.present_count}</p>
                </div>
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Rate</p>
                  <p className={`text-lg sm:text-xl md:text-2xl font-bold ${getAttendanceColor(stats.attendance_rate)} mt-0.5 sm:mt-1`}>
                    {stats.attendance_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Streak</p>
                  <p className={`text-lg sm:text-xl md:text-2xl font-bold ${getStreakColor(stats.streak.type)} mt-0.5 sm:mt-1`}>
                    {stats.streak.current}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 capitalize mt-0.5">{stats.streak.type}</p>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {stats && stats.monthly_stats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Monthly Attendance Trend - Area Chart with Gradient */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Monthly Attendance Rate</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <span className="text-xs text-gray-500">Rate %</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.monthly_stats}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(month) => new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                    itemStyle={{ color: '#fff' }}
                    labelFormatter={(month) => new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#attendanceGradient)"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#2563eb' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Sessions - Radial Progress Chart */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Monthly Sessions</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-500">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <span className="text-xs text-gray-500">Absent</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <defs>
                    <linearGradient id="presentGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="absentGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      { 
                        name: 'Present', 
                        value: stats.monthly_stats.reduce((acc, m) => acc + m.present, 0),
                        fill: 'url(#presentGradient)'
                      },
                      { 
                        name: 'Absent', 
                        value: stats.monthly_stats.reduce((acc, m) => acc + (m.total - m.present), 0),
                        fill: 'url(#absentGradient)'
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number, name: string) => [`${value} sessions`, name]}
                  />
                  {/* Center text */}
                  <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-2xl font-bold">
                    {stats.monthly_stats.reduce((acc, m) => acc + m.present, 0)}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-xs">
                    Present
                  </text>
                </PieChart>
              </ResponsiveContainer>
              {/* Summary Stats Below Chart */}
              <div className="flex justify-center gap-8 mt-2 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">{stats.monthly_stats.reduce((acc, m) => acc + m.present, 0)}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-500">{stats.monthly_stats.reduce((acc, m) => acc + (m.total - m.present), 0)}</p>
                  <p className="text-xs text-gray-500">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-700">{stats.monthly_stats.reduce((acc, m) => acc + m.total, 0)}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Attendance History</h3>
          </div>
          
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-3 sm:px-6">
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-sm sm:text-base text-gray-500">No attendance records found for the selected filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-80 sm:max-h-96 overflow-y-auto">
              {attendanceRecords.map(record => (
                <div key={record.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${record.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {record.present ? (
                          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                          {formatAttendanceType(record.attendance_type)}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{record.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:text-right space-y-1 flex-shrink-0">
                      <span className={`self-start sm:self-end px-2 py-1 rounded-full text-xs font-medium ${record.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {record.present ? 'Present' : 'Absent'}
                      </span>
                      {record.recorder && (
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          by {record.recorder.first_name} {record.recorder.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
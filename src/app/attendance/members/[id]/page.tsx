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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
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

    const monthlyStats = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
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
    if (rate >= 60) return 'text-yellow-600';
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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {member.first_name} {member.last_name}
                </h1>
                <p className="text-gray-600 mb-2">#{member.member_number}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadAttendanceData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={exportAttendance}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_sessions}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present_count}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className={`text-2xl font-bold ${getAttendanceColor(stats.attendance_rate)}`}>
                    {stats.attendance_rate.toFixed(1)}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className={`text-2xl font-bold ${getStreakColor(stats.streak.type)}`}>
                    {stats.streak.current}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">{stats.streak.type}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {stats && stats.monthly_stats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Attendance Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthly_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(month) => new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    labelFormatter={(month) => new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    formatter={(value, name) => [`${value}%`, 'Attendance Rate']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Sessions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sessions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthly_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(month) => new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(month) => new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="total" fill="#e5e7eb" name="Total Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
          </div>
          
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-500">No attendance records found for the selected filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {attendanceRecords.map(record => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        record.present 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {record.present ? (
                          <UserCheck className="w-5 h-5" />
                        ) : (
                          <UserX className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {formatAttendanceType(record.attendance_type)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.present 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {record.present ? 'Present' : 'Absent'}
                      </span>
                      {record.recorder && (
                        <p className="text-xs text-gray-500 mt-1">
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
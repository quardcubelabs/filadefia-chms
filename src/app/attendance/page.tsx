'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  BarChart3,
  QrCode,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Edit,
  Plus,
  ArrowRight
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';

interface AttendanceStats {
  totalMembers: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyTrend: number;
  totalSessions: number;
  // Check-in breakdown
  totalCheckIns?: number;
  qrCheckIns?: number;
  manualCheckIns?: number;
  qrCheckInPercentage?: number;
  manualCheckInPercentage?: number;
  recentSessions: Array<{
    id: string;
    date: string;
    attendance_type: string;
    present_count: number;
    total_count: number;
    percentage: number;
    isQRSession?: boolean;
    qrSessionId?: string | null;
  }>;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  gradient: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { departmentId, isDepartmentLeader } = useDepartmentAccess();
  
  const [stats, setStats] = useState<AttendanceStats>({
    totalMembers: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    weeklyTrend: 0,
    totalSessions: 0,
    totalCheckIns: 0,
    qrCheckIns: 0,
    manualCheckIns: 0,
    qrCheckInPercentage: 0,
    manualCheckInPercentage: 0,
    recentSessions: []
  });
  const [loading, setLoading] = useState(true);

  // Quick action buttons
  const quickActions: QuickAction[] = [
    {
      title: 'Record Attendance',
      description: 'Mark attendance for church services and meetings',
      icon: Edit,
      href: '/attendance/record',
      color: 'text-blue-600',
      gradient: 'from-blue-50 to-blue-100'
    },
    {
      title: 'Generate QR Code',
      description: 'Create QR codes for quick digital check-ins',
      icon: QrCode,
      href: '/attendance/qr',
      color: 'text-green-600',
      gradient: 'from-green-50 to-green-100'
    },
    {
      title: 'View Reports',
      description: 'Analyze attendance trends and statistics',
      icon: BarChart3,
      href: '/attendance/reports',
      color: 'text-purple-600',
      gradient: 'from-purple-50 to-purple-100'
    },
    {
      title: 'Member History',
      description: 'View individual attendance records',
      icon: Users,
      href: '/attendance/members',
      color: 'text-orange-600',
      gradient: 'from-orange-50 to-orange-100'
    }
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadAttendanceStats();
  }, [user, authLoading, router, departmentId]);

  const loadAttendanceStats = async () => {
    try {
      setLoading(true);
      
      // Load attendance sessions directly (which now include QR data)
      await loadQRSessions();
      
      // Also load overview stats
      const params = new URLSearchParams({
        period: 'weekly'
      });
      
      if (departmentId) {
        params.append('department_id', departmentId);
      }

      const response = await fetch(`/api/attendance/stats?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats API Response:', data);
        
        if (data.data && data.data.overview) {
          const { overview } = data.data;
          setStats(prevStats => ({
            ...prevStats,
            totalMembers: overview.totalMembers || 0,
            presentToday: overview.presentCount || 0,
            absentToday: overview.absentCount || 0,
            attendanceRate: overview.attendanceRate || 0,
            weeklyTrend: overview.weeklyTrend || 0,
            totalSessions: overview.totalSessions || 0,
            totalCheckIns: overview.totalCheckIns || 0,
            qrCheckIns: overview.qrCheckIns || 0,
            manualCheckIns: overview.manualCheckIns || 0,
            qrCheckInPercentage: overview.qrCheckInPercentage || 0,
            manualCheckInPercentage: overview.manualCheckInPercentage || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading attendance stats:', error);
      alert('Failed to load attendance statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadQRSessions = async () => {
    try {
      // Get attendance sessions (which now include QR data)
      const response = await fetch('/api/attendance/sessions');
      if (response.ok) {
        const sessionsData = await response.json();
        const sessions = sessionsData.data || [];
        
        // Replace recent sessions with the full session data that includes QR info
        setStats(prevStats => ({
          ...prevStats,
          recentSessions: sessions.slice(-5).reverse().map((session: any) => ({
            id: session.id || session.qr_session_id || `${session.date}_${session.attendance_type}`,
            date: session.date,
            attendance_type: session.attendance_type,
            present_count: session.present_count,
            total_count: session.total_members || session.total_count || 0,
            percentage: session.attendance_rate || session.percentage || 0,
            hasQRCode: !!session.qr_code_data_url,
            isQRSession: !!session.qr_code_data_url,
            qr_session_id: session.qr_session_id,
            qr_code_data_url: session.qr_code_data_url,
            qr_check_in_url: session.qr_check_in_url,
            qr_expires_at: session.qr_expires_at,
            qr_is_active: session.qr_is_active
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading QR sessions:', error);
    }
  };

  // Remove this function as weekly trend is now calculated in the API
  // const calculateWeeklyTrend = (dateStats: any[]) => {
  //   if (dateStats.length < 2) return 0;
  //   const recent = dateStats.slice(0, 2);
  //   if (recent.length === 2) {
  //     return recent[0].percentage - recent[1].percentage;
  //   }
  //   return 0;
  // };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendanceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'sunday_service': 'Sunday Service',
      'midweek_fellowship': 'Midweek Fellowship',
      'department_meeting': 'Department Meeting',
      'zone_meeting': 'Zone Meeting',
      'special_event': 'Special Event'
    };
    return types[type] || type;
  };

  const handleSessionClick = (session: any) => {
    // All sessions should now have QR codes, so always navigate to QR page
    if (session.id) {
      // Use session ID for new sessions with stored QR data
      router.push(`/attendance/qr?session_id=${session.id}&date=${session.date}&type=${session.attendance_type}&existing=true`);
    } else if (session.qr_session_id) {
      // Use QR session ID for legacy format
      router.push(`/attendance/qr?session_id=${session.qr_session_id}&date=${session.date}&type=${session.attendance_type}&existing=true`);
    } else {
      // Fallback for very old sessions - still go to QR page but it might not have QR data
      router.push(`/attendance/qr?date=${session.date}&type=${session.attendance_type}&existing=true`);
    }
  };

  const migrateLegacySessions = async () => {
    if (!confirm('Migrate all legacy attendance sessions to include QR codes? This will create QR codes for all existing manual sessions.')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/attendance/sessions/migrate-legacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Migration successful! Created QR codes for ${result.data.migrated_sessions} sessions.`);
        // Reload the page to show updated sessions
        await loadAttendanceStats();
      } else {
        alert(`Migration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Migration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">
              Track and manage church attendance records
              {isDepartmentLeader && (
                <span className="text-sm text-blue-600 ml-2">
                  • Department: {departmentId}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={migrateLegacySessions}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              title="Add QR codes to existing manual sessions"
            >
              <QrCode className="w-4 h-4" />
              Migrate Sessions
            </button>
            <button
              onClick={() => router.push('/attendance/record')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Record Attendance
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Members */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMembers}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Present Today */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present This Week</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.presentToday}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.attendanceRate.toFixed(1)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {stats.weeklyTrend >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${stats.weeklyTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(stats.weeklyTrend).toFixed(1)}% vs last week
                    </span>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Check-ins Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-orange-50 p-2 rounded-lg mr-3">
                    <QrCode className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-ins This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCheckIns}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">QR Check-ins</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.qrCheckIns} ({stats.qrCheckInPercentage?.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Manual Check-ins</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.manualCheckIns} ({stats.manualCheckInPercentage?.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.title}
              onClick={() => router.push(action.href)}
              className={`bg-gradient-to-br ${action.gradient} rounded-lg p-6 border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 group`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Attendance Sessions</h2>
              <button
                onClick={() => router.push('/attendance/reports')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All Reports
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : stats.recentSessions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-200 ${
                      session.hasQRCode
                        ? session.qr_is_active && session.qr_expires_at && new Date(session.qr_expires_at) > new Date()
                          ? 'hover:bg-green-50 cursor-pointer border-l-4 border-l-green-500 hover:shadow-md' 
                          : 'hover:bg-orange-50 cursor-pointer border-l-4 border-l-orange-400 hover:shadow-md'
                        : session.isQRSession 
                        ? 'hover:bg-green-50 cursor-pointer border-l-4 border-l-green-500 hover:shadow-md' 
                        : 'hover:bg-gray-100 cursor-pointer hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        session.hasQRCode
                          ? session.qr_is_active && session.qr_expires_at && new Date(session.qr_expires_at) > new Date()
                            ? 'bg-green-100' 
                            : 'bg-orange-100'
                          : session.isQRSession 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}>
                        {session.hasQRCode || session.isQRSession ? (
                          <QrCode className={`w-5 h-5 ${
                            session.hasQRCode
                              ? session.qr_is_active && session.qr_expires_at && new Date(session.qr_expires_at) > new Date()
                                ? 'text-green-600' 
                                : 'text-orange-600'
                              : 'text-green-600'
                          }`} />
                        ) : (
                          <Calendar className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {getAttendanceTypeLabel(session.attendance_type)}
                          </h4>
                          {(session.hasQRCode || session.isQRSession) && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              session.hasQRCode
                                ? session.qr_is_active && session.qr_expires_at && new Date(session.qr_expires_at) > new Date()
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {session.hasQRCode 
                                ? session.qr_is_active && session.qr_expires_at && new Date(session.qr_expires_at) > new Date()
                                  ? 'QR Active'
                                  : 'QR Inactive'
                                : 'QR Session'
                              }
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.date)} • {session.present_count} of {session.total_count} present
                          <span className={`ml-1 ${
                            session.hasQRCode
                              ? session.qr_is_active && session.qr_expires_at && new Date(session.qr_expires_at) > new Date()
                                ? 'text-green-600'
                                : 'text-orange-600'
                              : 'text-blue-600'
                          }`}>
                            • Click to view session details & QR code
                            {session.hasQRCode && session.qr_expires_at && new Date(session.qr_expires_at) <= new Date() && (
                              <span className="text-orange-600"> (QR Expired)</span>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.percentage >= 80
                          ? 'bg-green-100 text-green-800'
                          : session.percentage >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {session.percentage.toFixed(1)}%
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Sessions</h3>
                <p className="text-gray-600 mb-4">Start recording attendance to see activity here</p>
                <button
                  onClick={() => router.push('/attendance/record')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Record First Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
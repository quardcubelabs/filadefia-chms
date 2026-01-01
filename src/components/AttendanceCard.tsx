'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowUpRight,
  Activity,
  Clock
} from 'lucide-react';
import Link from 'next/link';

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
}

interface AttendanceCardProps {
  departmentId?: string;
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  className?: string;
  noWrapper?: boolean;
}

export default function AttendanceCard({ 
  departmentId, 
  period = 'monthly',
  className = '',
  noWrapper = false
}: AttendanceCardProps) {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendanceStats();
  }, [departmentId, period]);

  const loadAttendanceStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period
      });

      if (departmentId) {
        params.set('department_id', departmentId);
      }

      const response = await fetch(`/api/attendance/stats?${params}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to load attendance stats');
      }
    } catch (error) {
      console.error('Error loading attendance stats:', error);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const getAttendanceBackground = (rate: number) => {
    if (rate >= 80) return 'bg-green-50 border-green-200';
    if (rate >= 60) return 'bg-blue-50 border-blue-200';
    return 'bg-red-50 border-red-200';
  };

  const calculateTrend = () => {
    if (!stats || stats.dateStats.length < 2) return { trend: 0, isPositive: true };
    
    const recent = stats.dateStats.slice(-7); // Last 7 sessions
    const earlier = stats.dateStats.slice(-14, -7); // Previous 7 sessions
    
    const recentAvg = recent.reduce((sum, stat) => sum + stat.percentage, 0) / recent.length;
    const earlierAvg = earlier.length > 0 
      ? earlier.reduce((sum, stat) => sum + stat.percentage, 0) / earlier.length
      : recentAvg;
    
    const trend = recentAvg - earlierAvg;
    return { trend: Math.abs(trend), isPositive: trend >= 0 };
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  if (loading) {
    return (
      <div className={`${noWrapper ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="flex space-x-4">
              <div className="h-12 bg-gray-200 rounded flex-1"></div>
              <div className="h-12 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${noWrapper ? '' : 'bg-white rounded-lg shadow-sm border border-red-200 p-6'} ${className}`}>
        <div className="flex items-center space-x-3">
          <UserX className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Attendance Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={loadAttendanceStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`${noWrapper ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'} ${className}`}>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
          <p className="text-gray-500 mb-4">Start recording attendance to see statistics.</p>
          <div className="flex gap-2">
            <Link
              href="/attendance/record"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Record Attendance
            </Link>

            <Link
              href="/attendance"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2" />
              View Attendance
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { trend, isPositive } = calculateTrend();
  const attendanceRate = stats.overview.attendanceRate ?? 0;

  return (
    <div className={`${noWrapper ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200'} ${className}`}>
      {/* Header */}
      <div className={`${noWrapper ? 'p-0' : 'p-3 sm:p-6'} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${getAttendanceBackground(attendanceRate)}`}>
              <UserCheck className={`w-4 h-4 sm:w-6 sm:h-6 ${getAttendanceColor(attendanceRate)}`} />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Attendance</h3>
              <p className="text-[10px] sm:text-sm text-gray-600">{formatPeriod(period)} Overview</p>
            </div>
          </div>
          <Link
            href="/attendance"
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className={`${noWrapper ? 'p-0' : 'p-3 sm:p-6'}`}>
        <div className="mb-4 sm:mb-6">
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl sm:text-3xl font-bold ${getAttendanceColor(attendanceRate)}`}>
              {attendanceRate.toFixed(1)}%
            </span>
            {trend > 0 && (
              <div className={`flex items-center space-x-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span className="text-[10px] sm:text-sm font-medium">
                  {trend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Overall attendance rate</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              <span className="text-sm sm:text-lg font-bold text-green-600">
                {stats.overview.presentCount}
              </span>
            </div>
            <p className="text-[9px] sm:text-xs text-green-700">Present</p>
          </div>

          <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
              <UserX className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              <span className="text-sm sm:text-lg font-bold text-red-600">
                {stats.overview.absentCount}
              </span>
            </div>
            <p className="text-[9px] sm:text-xs text-red-700">Absent</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              <span className="text-[10px] sm:text-sm text-gray-700">Total Members</span>
            </div>
            <span className="text-[10px] sm:text-sm font-semibold text-gray-900">
              {stats.overview.totalMembers}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              <span className="text-[10px] sm:text-sm text-gray-700">Sessions</span>
            </div>
            <span className="text-[10px] sm:text-sm font-semibold text-gray-900">
              {stats.overview.totalSessions}
            </span>
          </div>

          {stats.dateStats.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                <span className="text-[10px] sm:text-sm text-gray-700">Latest Session</span>
              </div>
              <span className="text-[10px] sm:text-sm font-semibold text-gray-900">
                {new Date(stats.dateStats[stats.dateStats.length - 1].date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2">
            <span>Attendance Progress</span>
            <span>{attendanceRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div 
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                attendanceRate >= 80 
                  ? 'bg-green-500' 
                  : attendanceRate >= 60 
                    ? 'bg-blue-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(attendanceRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Link
            href="/attendance/record"
            className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] sm:text-sm font-medium text-center"
          >
            Record Attendance
          </Link>
          <Link
            href="/attendance/reports"
            className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-[10px] sm:text-sm font-medium text-center"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
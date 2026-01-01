'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  User,
  Search,
  Filter,
  ArrowLeft,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Download,
  RefreshCw
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string;
  phone: string;
  email?: string;
  photo_url?: string;
  status: string;
}

interface MemberAttendanceStats {
  member_id: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
  last_attendance_date?: string;
  streak: {
    current: number;
    type: 'present' | 'absent';
  };
}

interface MemberWithStats extends Member {
  stats?: MemberAttendanceStats;
}

export default function AttendanceMembersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { departmentId, isDepartmentLeader } = useDepartmentAccess();
  
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadMembersWithStats();
  }, [user, authLoading, router, departmentId]);

  useEffect(() => {
    if (members.length > 0) {
      filterMembers();
    }
  }, [members, searchTerm, statusFilter, attendanceFilter, sortBy]);

  const loadMembersWithStats = async () => {
    try {
      setLoading(true);
      
      // Build API URL with department filter if needed
      const apiUrl = isDepartmentLeader && departmentId 
        ? `/api/members?department_id=${departmentId}&include_attendance_stats=true&status=all`
        : '/api/members?include_attendance_stats=true&status=all';
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (response.ok) {
        setMembers(data.data || []);
      } else {
        console.error('Failed to load members:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error || 'Unknown error',
          details: data.details || 'No details provided',
          suggestion: data.suggestion || 'No suggestions available'
        });
        
        // Show user-friendly error message
        if (data.suggestion) {
          alert(`Error loading members: ${data.error}\n\nSuggestion: ${data.suggestion}`);
        } else {
          alert(`Failed to load members: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
      alert('Network error loading members. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(search) ||
        member.member_number.toLowerCase().includes(search) ||
        member.phone.includes(search) ||
        (member.email && member.email.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(member => {
        if (!member.stats) {
          return attendanceFilter === 'no-attendance';
        }
        
        switch (attendanceFilter) {
          case 'excellent':
            return member.stats.attendance_rate >= 90;
          case 'good':
            return member.stats.attendance_rate >= 70 && member.stats.attendance_rate < 90;
          case 'poor':
            return member.stats.attendance_rate < 70;
          case 'no-attendance':
            return member.stats.total_sessions === 0;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'attendance':
          return (b.stats?.attendance_rate || 0) - (a.stats?.attendance_rate || 0);
        case 'sessions':
          return (b.stats?.total_sessions || 0) - (a.stats?.total_sessions || 0);
        case 'recent':
          if (!a.stats?.last_attendance_date && !b.stats?.last_attendance_date) return 0;
          if (!a.stats?.last_attendance_date) return 1;
          if (!b.stats?.last_attendance_date) return -1;
          return new Date(b.stats.last_attendance_date).getTime() - new Date(a.stats.last_attendance_date).getTime();
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  };

  const exportMembersData = async () => {
    try {
      const csvContent = [
        ['Name', 'Member Number', 'Phone', 'Email', 'Status', 'Total Sessions', 'Present', 'Absent', 'Attendance Rate (%)', 'Last Attendance'],
        ...filteredMembers.map(member => [
          `${member.first_name} ${member.last_name}`,
          member.member_number,
          member.phone,
          member.email || '',
          member.status,
          member.stats?.total_sessions || 0,
          member.stats?.present_count || 0,
          member.stats?.absent_count || 0,
          member.stats?.attendance_rate?.toFixed(1) || '0.0',
          member.stats?.last_attendance_date || 'Never'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members_attendance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    return 'text-red-600';
  };

  const getAttendanceBadgeColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 70) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const getStreakColor = (type: string) => {
    return type === 'present' ? 'text-green-600' : 'text-red-600';
  };

  const formatAttendanceType = (type: string) => {
    const types: { [key: string]: string } = {
      'sunday_service': 'Sunday Service',
      'midweek_fellowship': 'Midweek Fellowship',
      'special_event': 'Special Event',
      'department_meeting': 'Department Meeting'
    };
    return types[type] || type;
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 md:p-6">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Members Attendance</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
                View and manage member attendance records
                {isDepartmentLeader && (
                  <span className="text-xs sm:text-sm text-blue-600 ml-2 block sm:inline mt-1 sm:mt-0">
                    • Department: {departmentId}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={loadMembersWithStats}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportMembersData}
              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, member number, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendance</label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Rates</option>
                  <option value="excellent">Excellent (≥90%)</option>
                  <option value="good">Good (70-89%)</option>
                  <option value="poor">Poor (&lt;70%)</option>
                  <option value="no-attendance">No Attendance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name A-Z</option>
                  <option value="attendance">Attendance Rate</option>
                  <option value="sessions">Total Sessions</option>
                  <option value="recent">Recent Activity</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{filteredMembers.length} members</p>
                  <p>of {members.length} total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Members</h2>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-3 sm:px-6">
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-sm sm:text-base text-gray-500">
                {searchTerm || statusFilter !== 'all' || attendanceFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No members available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => router.push(`/attendance/members/${member.id}`)}
                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Member Photo/Avatar */}
                    <div className="flex-shrink-0">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.status === 'active' ? 'bg-green-100 text-green-800' :
                              member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">#{member.member_number}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{member.phone}</p>
                        </div>

                        {/* Attendance Stats */}
                        <div className="flex items-center space-x-3 sm:space-x-4 mt-2 sm:mt-0">
                          {member.stats ? (
                            <>
                              {/* Attendance Rate */}
                              <div className="text-center">
                                <p className={`text-sm sm:text-base font-bold ${getAttendanceColor(member.stats.attendance_rate)}`}>
                                  {member.stats.attendance_rate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500">Rate</p>
                              </div>

                              {/* Sessions */}
                              <div className="text-center">
                                <p className="text-sm sm:text-base font-bold text-gray-900">
                                  {member.stats.total_sessions}
                                </p>
                                <p className="text-xs text-gray-500">Sessions</p>
                              </div>

                              {/* Streak */}
                              <div className="text-center">
                                <p className={`text-sm sm:text-base font-bold ${getStreakColor(member.stats.streak.type)}`}>
                                  {member.stats.streak.current}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{member.stats.streak.type}</p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm text-gray-400">No data</p>
                            </div>
                          )}

                          {/* Arrow */}
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredMembers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Members</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                    {filteredMembers.length}
                  </p>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Members</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                    {filteredMembers.filter(m => m.status === 'active').length}
                  </p>
                </div>
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Attendance</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mt-0.5 sm:mt-1">
                    {filteredMembers.filter(m => m.stats).length > 0
                      ? (filteredMembers.filter(m => m.stats).reduce((sum, m) => sum + (m.stats?.attendance_rate || 0), 0) / 
                         filteredMembers.filter(m => m.stats).length).toFixed(1)
                      : '0.0'}%
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
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Excellent (≥90%)</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                    {filteredMembers.filter(m => m.stats && m.stats.attendance_rate >= 90).length}
                  </p>
                </div>
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ml-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
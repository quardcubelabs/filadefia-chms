'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Users,
  Search,
  CheckCircle,
  XCircle,
  ArrowLeft,
  User
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string;
  photo_url?: string;
}

interface AttendanceRecord {
  member_id: string;
  present: boolean;
  notes?: string;
}

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
}

export default function RecordAttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { departmentId, isDepartmentLeader } = useDepartmentAccess();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(departmentId || '');
  const [attendanceType, setAttendanceType] = useState('sunday_service');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventId, setEventId] = useState('');
  const [showPresent, setShowPresent] = useState(true);
  const [showAbsent, setShowAbsent] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadInitialData();
    
    // Handle URL parameters for event integration
    const urlParams = new URLSearchParams(window.location.search);
    const eventIdParam = urlParams.get('event_id');
    const dateParam = urlParams.get('date');
    const typeParam = urlParams.get('type');
    
    if (eventIdParam) setEventId(eventIdParam);
    if (dateParam) setSelectedDate(dateParam);
    if (typeParam) setAttendanceType(typeParam);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedDepartment) {
      loadMembers();
    }
  }, [selectedDepartment]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deptResponse = await fetch('/api/departments');
      if (!deptResponse.ok) {
        throw new Error(`Failed to fetch departments: ${deptResponse.status}`);
      }
      const deptData = await deptResponse.json();
      if (deptData.data) {
        setDepartments(deptData.data);
      }
      
      // If no department selected but user is department leader, select their department
      if (!selectedDepartment && departmentId) {
        setSelectedDepartment(departmentId);
      } else if (!selectedDepartment && deptData.data?.length > 0) {
        // For admins/other roles, select first department or load all
        setSelectedDepartment('all');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      alert('Failed to load departments. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      let membersUrl = '/api/members?status=active';
      if (selectedDepartment !== 'all') {
        membersUrl += `&department_id=${selectedDepartment}`;
      }
      
      const response = await fetch(membersUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.data) {
        setMembers(data.data);
        // Initialize attendance records with all members as absent
        const initialRecords: Record<string, AttendanceRecord> = {};
        data.data.forEach((member: Member) => {
          initialRecords[member.id] = {
            member_id: member.id,
            present: false
          };
        });
        setAttendanceRecords(initialRecords);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      alert('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (memberId: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        present: !prev[memberId]?.present
      }
    }));
  };

  const updateNotes = (memberId: string, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        notes
      }
    }));
  };

  const handleBulkAction = (action: 'present' | 'absent') => {
    const newRecords = { ...attendanceRecords };
    filteredMembers.forEach(member => {
      newRecords[member.id] = {
        ...newRecords[member.id],
        present: action === 'present'
      };
    });
    setAttendanceRecords(newRecords);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      
      // Only include records with member_id
      const attendanceData = Object.entries(attendanceRecords).map(([memberId, record]) => ({
        member_id: memberId,
        present: record.present,
        notes: record.notes || null
      }));

      console.log('Sending attendance data:', {
        count: attendanceData.length,
        sample: attendanceData.slice(0, 2)
      });
      
      const payload = {
        attendanceRecords: attendanceData,
        sessionInfo: {
          date: selectedDate,
          attendance_type: attendanceType,
          event_id: eventId || null,
          recorded_by: user?.id
        }
      };

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      alert('Attendance saved successfully!');
      router.push('/attendance');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.member_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const record = attendanceRecords[member.id];
    const matchesFilter = 
      (showPresent && record?.present) ||
      (showAbsent && !record?.present);
    
    return matchesSearch && matchesFilter;
  });

  const presentCount = Object.values(attendanceRecords).filter(record => record.present).length;
  const totalCount = members.length;

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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Record Attendance</h1>
              <p className="text-gray-600 mt-1">Mark attendance for church service or event</p>
            </div>
          </div>

          {/* Session Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sunday_service">Sunday Service</option>
                <option value="midweek_fellowship">Midweek Fellowship</option>
                <option value="special_event">Special Event</option>
                <option value="department_meeting">Department Meeting</option>
              </select>
            </div>

            {!isDepartmentLeader && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Event ID (Optional)</label>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Link to event"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{totalCount - presentCount}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-gray-600">Attendance</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('present')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleBulkAction('absent')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Mark All Absent
              </button>
              <button
                onClick={saveAttendance}
                disabled={saving || totalCount === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showPresent}
                  onChange={(e) => setShowPresent(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Present</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAbsent}
                  onChange={(e) => setShowAbsent(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Absent</span>
              </label>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Members ({filteredMembers.length} of {totalCount})
            </h2>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMembers.map(member => {
                const record = attendanceRecords[member.id];
                return (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">#{member.member_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleAttendance(member.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              record?.present
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {record?.present ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </button>
                          <span className={`text-sm font-medium ${
                            record?.present ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {record?.present ? 'Present' : 'Absent'}
                          </span>
                        </div>

                        <input
                          type="text"
                          placeholder="Notes..."
                          value={record?.notes || ''}
                          onChange={(e) => updateNotes(member.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
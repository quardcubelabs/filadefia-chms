'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Calendar,
  Clock,
  Users,
  Download,
  Share2,
  Copy,
  RefreshCw,
  StopCircle,
  PlayCircle,
  Settings,
  ArrowLeft,
  UserCheck,
  Eye,
  Printer
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';

interface QRSession {
  session_id: string;
  qr_code: string;
  check_in_url: string;
  session_info: {
    date: string;
    attendance_type: string;
    session_name: string;
    department_id?: string;
    event_id?: string;
    expires_at: string;
  };
}

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
}

export default function QRAttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { departmentId, isDepartmentLeader } = useDepartmentAccess();
  
  const [currentSession, setCurrentSession] = useState<QRSession | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Session creation form
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceType, setAttendanceType] = useState('sunday_service');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(departmentId || '');
  const [sessionName, setSessionName] = useState('');
  const [expirationHours, setExpirationHours] = useState(4);
  const [eventId, setEventId] = useState('');

  // Stats
  const [sessionStats, setSessionStats] = useState({
    total_checkins: 0,
    qr_checkins: 0,
    recent_checkins: []
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (currentSession) {
      loadSessionStats();
      const interval = setInterval(loadSessionStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deptResponse = await fetch('/api/departments');
      const deptData = await deptResponse.json();
      if (deptData.data) {
        setDepartments(deptData.data);
      }
      
      // Set default department
      if (!selectedDepartment && departmentId) {
        setSelectedDepartment(departmentId);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(`/api/attendance/qr-checkin?session_id=${currentSession.session_id}`);
      const data = await response.json();
      
      if (data.data) {
        setSessionStats(data.data);
      }
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const createQRSession = async () => {
    if (!user?.profile?.id) {
      alert('User profile not loaded. Please refresh the page and try again.');
      return;
    }

    try {
      setCreating(true);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
      
      const payload = {
        date: selectedDate,
        attendance_type: attendanceType,
        event_id: eventId || null,
        department_id: selectedDepartment === 'all' ? null : selectedDepartment,
        session_name: sessionName || `${attendanceType.replace('_', ' ')} - ${selectedDate}`,
        expires_at: expiresAt.toISOString(),
        recorded_by: user?.profile?.id
      };

      const response = await fetch('/api/attendance/qr-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentSession(result.data);
      } else {
        throw new Error(result.error || 'Failed to create QR session');
      }
    } catch (error) {
      console.error('Error creating QR session:', error);
      alert('Failed to create QR session. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const closeSession = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch('/api/attendance/qr-session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          action: 'close'
        }),
      });

      if (response.ok) {
        setCurrentSession(null);
        alert('QR session closed successfully');
      }
    } catch (error) {
      console.error('Error closing session:', error);
      alert('Failed to close session');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const downloadQR = () => {
    if (!currentSession?.qr_code) return;
    
    const link = document.createElement('a');
    link.download = `attendance-qr-${currentSession.session_id}.png`;
    link.href = currentSession.qr_code;
    link.click();
  };

  const formatAttendanceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isSessionExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
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
              <h1 className="text-2xl font-bold text-gray-900">QR Code Attendance</h1>
              <p className="text-gray-600 mt-1">Generate QR codes for quick check-in</p>
            </div>
          </div>
        </div>

        {!currentSession ? (
          /* Create New Session */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Create QR Check-in Session</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Sunday Morning Service"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration (Hours)</label>
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={2}>2 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event ID (Optional)</label>
                <input
                  type="text"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Link to specific event"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={createQRSession}
                disabled={creating || !user?.profile?.id}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>
                  {creating 
                    ? 'Creating...' 
                    : !user?.profile?.id 
                      ? 'Loading Profile...' 
                      : 'Generate QR Code'
                  }
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Session */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QR Code Display */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Active QR Session</h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isSessionExpired(currentSession.session_info.expires_at)
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {isSessionExpired(currentSession.session_info.expires_at) ? 'Expired' : 'Active'}
                  </span>
                  <button
                    onClick={closeSession}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Close Session"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Session Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{currentSession.session_info.session_name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Date:</strong> {new Date(currentSession.session_info.date).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Type:</strong> {formatAttendanceType(currentSession.session_info.attendance_type)}
                  </div>
                  <div>
                    <strong>Expires:</strong> {new Date(currentSession.session_info.expires_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Session ID:</strong> {currentSession.session_id.slice(-8)}
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={currentSession.qr_code} 
                    alt="QR Code for attendance" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Scan this QR code to check in
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => copyToClipboard(currentSession.check_in_url)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={downloadQR}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Statistics */}
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Statistics</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">Total Check-ins</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {sessionStats.total_checkins}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <QrCode className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-700">QR Check-ins</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {sessionStats.qr_checkins}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">Manual Check-ins</span>
                    </div>
                    <span className="text-lg font-bold text-gray-600">
                      {sessionStats.total_checkins - sessionStats.qr_checkins}
                    </span>
                  </div>
                </div>

                <button
                  onClick={loadSessionStats}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Recent Check-ins */}
              {sessionStats.recent_checkins && sessionStats.recent_checkins.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</h3>
                  <div className="space-y-3">
                    {sessionStats.recent_checkins.slice(0, 5).map((checkin: any, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {checkin.members.first_name} {checkin.members.last_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(checkin.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/attendance')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View All Attendance</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/attendance/record')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Manual Recording</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
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
    
    // Check for existing session in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const existing = urlParams.get('existing');
    const date = urlParams.get('date');
    const type = urlParams.get('type');
    
    if (existing && (sessionId || (date && type))) {
      loadExistingSession(sessionId, date, type);
    }
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

  const loadExistingSession = async (sessionId: string | null, date: string | null, type: string | null) => {
    try {
      setLoading(true);
      
      // If we have date and type, try to find session by date and type first
      if (date && type) {
        console.log('Loading session by date and type:', { date, type });
        
        // Try to find session in attendance_sessions table by date and type
        const response = await fetch(`/api/attendance/sessions/by-date?date=${encodeURIComponent(date)}&type=${encodeURIComponent(type)}`);
        
        if (response.ok) {
          const sessionData = await response.json();
          const matchingSession = sessionData.data;
          
          if (matchingSession && matchingSession.qr_code_data_url) {
            console.log('Found session with QR code:', matchingSession);
            
            // Convert attendance session data to QRSession format
            const qrSession: QRSession = {
              session_id: matchingSession.qr_session_id || matchingSession.id,
              qr_code: matchingSession.qr_code_data_url,
              check_in_url: matchingSession.qr_check_in_url || '',
              session_info: {
                date: matchingSession.date,
                attendance_type: matchingSession.attendance_type,
                session_name: matchingSession.session_name || `${matchingSession.attendance_type.replace('_', ' ')} - ${matchingSession.date}`,
                department_id: matchingSession.department_id,
                event_id: matchingSession.event_id,
                expires_at: matchingSession.qr_expires_at || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
              }
            };
            
            setCurrentSession(qrSession);
            return;
          } else if (matchingSession) {
            console.log('Session found but no QR code, generating one automatically');
            
            // Session exists but no QR code - generate one automatically
            await generateQRForExistingSession(matchingSession);
            return;
          }
        } else {
          console.log('Session not found in attendance_sessions table');
        }
        
        // Fallback: try legacy QR sessions table
        try {
          const legacyResponse = await fetch(`/api/attendance/qr-session?date=${date}&type=${type}`);
          if (legacyResponse.ok) {
            const data = await legacyResponse.json();
            if (data.data) {
              setCurrentSession(data.data);
              return;
            }
          }
        } catch (legacyError) {
          console.log('Legacy QR session not found');
        }
        
        // If no session found, try to create one from legacy attendance data
        console.log('No session found, trying to create from legacy data for:', { date, type });
        
        try {
          const legacyResponse = await fetch('/api/attendance/sessions/create-from-legacy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date,
              attendance_type: type,
              qr_duration_hours: 4
            }),
          });

          if (legacyResponse.ok) {
            const result = await legacyResponse.json();
            const createdSession = result.data;
            
            console.log('Created session from legacy data:', createdSession);
            
            // Convert to QRSession format and display
            const qrSession: QRSession = {
              session_id: createdSession.qr_session_id,
              qr_code: createdSession.qr_code_data_url,
              check_in_url: createdSession.qr_check_in_url,
              session_info: {
                date: createdSession.date,
                attendance_type: createdSession.attendance_type,
                session_name: createdSession.session_name,
                department_id: createdSession.department_id,
                event_id: createdSession.event_id,
                expires_at: createdSession.qr_expires_at
              }
            };
            
            setCurrentSession(qrSession);
            return;
          } else {
            console.log('Could not create session from legacy data, using form');
          }
        } catch (legacyError) {
          console.log('Error creating session from legacy data:', legacyError);
        }
        
        // Fallback: pre-fill form for new session
        setSelectedDate(date);
        
        // Map common URL type values to form values
        const typeMapping: Record<string, string> = {
          'sunday_service': 'sunday_service',
          'midweek_fellowship': 'midweek_fellowship', 
          'special_event': 'special_event',
          'department_meeting': 'department_meeting'
        };
        
        setAttendanceType(typeMapping[type] || 'sunday_service');
      }
      
      // If sessionId is provided and looks like a UUID, try to load by ID
      if (sessionId && sessionId.includes('-') && sessionId.length > 20) {
        const response = await fetch(`/api/attendance/sessions/${sessionId}`);
        
        if (response.ok) {
          const sessionData = await response.json();
          const existingSession = sessionData.data;
          
          if (existingSession && existingSession.qr_code_data_url) {
            // Convert attendance session data to QRSession format
            const qrSession: QRSession = {
              session_id: existingSession.qr_session_id || sessionId,
              qr_code: existingSession.qr_code_data_url,
              check_in_url: existingSession.qr_check_in_url || '',
              session_info: {
                date: existingSession.date,
                attendance_type: existingSession.attendance_type,
                session_name: existingSession.session_name || `${existingSession.attendance_type.replace('_', ' ')} - ${existingSession.date}`,
                department_id: existingSession.department_id,
                event_id: existingSession.event_id,
                expires_at: existingSession.qr_expires_at || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
              }
            };
            
            setCurrentSession(qrSession);
          } else if (existingSession) {
            // Session exists but no QR code
            setSelectedDate(existingSession.date);
            setAttendanceType(existingSession.attendance_type);
            setSessionName(existingSession.session_name || '');
            setSelectedDepartment(existingSession.department_id || '');
            
            alert('This session does not have a QR code yet. You can generate one using the form below.');
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing session:', error);
      alert('Failed to load session. Please try again.');
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

  const generateQRForExistingSession = async (session: any) => {
    try {
      setLoading(true);
      
      // Generate QR code for existing session by updating it
      const updatePayload = {
        session_id: session.id,
        qr_duration_hours: 4, // Default 4 hours
        generate_qr: true
      };

      const response = await fetch(`/api/attendance/sessions/${session.id}/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedSession = result.data;
        
        // Convert to QRSession format and display
        const qrSession: QRSession = {
          session_id: updatedSession.qr_session_id || updatedSession.id,
          qr_code: updatedSession.qr_code_data_url,
          check_in_url: updatedSession.qr_check_in_url,
          session_info: {
            date: updatedSession.date,
            attendance_type: updatedSession.attendance_type,
            session_name: updatedSession.session_name || `${updatedSession.attendance_type.replace('_', ' ')} - ${updatedSession.date}`,
            department_id: updatedSession.department_id,
            event_id: updatedSession.event_id,
            expires_at: updatedSession.qr_expires_at
          }
        };
        
        setCurrentSession(qrSession);
      } else {
        console.error('Failed to generate QR code for existing session');
        // Fallback to form
        setSelectedDate(session.date);
        setAttendanceType(session.attendance_type);
        setSessionName(session.session_name || '');
        setSelectedDepartment(session.department_id || '');
      }
    } catch (error) {
      console.error('Error generating QR for existing session:', error);
      // Fallback to form
      setSelectedDate(session.date);
      setAttendanceType(session.attendance_type);
      setSessionName(session.session_name || '');
      setSelectedDepartment(session.department_id || '');
    } finally {
      setLoading(false);
    }
  };

  const createQRSession = async () => {
    if (!user?.id) {
      alert('User not logged in. Please refresh the page and try again.');
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
        recorded_by: user?.id,
        auto_create_members: false,
        qr_duration_hours: expirationHours
      };

      const response = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        // Convert the session response to QRSession format
        const sessionData = result.data.session;
        const qrSession: QRSession = {
          session_id: sessionData.qr_session_id || sessionData.id,
          qr_code: result.data.qr_code_data_url || sessionData.qr_code_data_url,
          check_in_url: result.data.qr_check_in_url || sessionData.qr_check_in_url,
          session_info: {
            date: sessionData.date,
            attendance_type: sessionData.attendance_type,
            session_name: sessionData.session_name,
            department_id: sessionData.department_id,
            event_id: sessionData.event_id,
            expires_at: result.data.qr_expires_at || sessionData.qr_expires_at
          }
        };
        
        setCurrentSession(qrSession);
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">QR Code Attendance</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Generate QR codes for quick check-in</p>
            </div>
          </div>
        </div>

        {!currentSession ? (
          /* Create New Session */
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Create QR Check-in Session</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Sunday Morning Service"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <select
                  value={attendanceType}
                  onChange={(e) => setAttendanceType(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration (Hours)</label>
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <button
                onClick={createQRSession}
                disabled={creating || !user?.id}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>
                  {creating 
                    ? 'Creating...' 
                    : !user?.id 
                      ? 'Please Login...' 
                      : 'Generate QR Code'
                  }
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Session */
          <div className="space-y-4 sm:space-y-6">
            {/* Mobile: Stack vertically, Desktop: 2/3 and 1/3 grid */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* QR Code Display */}
              <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Active QR Session</h2>
                  <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      isSessionExpired(currentSession.session_info.expires_at)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {isSessionExpired(currentSession.session_info.expires_at) ? 'Inactive' : 'Active'}
                    </span>
                    <button
                      onClick={closeSession}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Close Session"
                    >
                      <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Session Info */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base truncate">{currentSession.session_info.session_name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div>
                      <strong>Date:</strong> {new Date(currentSession.session_info.date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Type:</strong> {formatAttendanceType(currentSession.session_info.attendance_type)}
                    </div>
                    <div className="sm:col-span-2">
                      <strong>Expires:</strong> {new Date(currentSession.session_info.expires_at).toLocaleString()}
                    </div>
                    <div className="sm:col-span-2">
                      <strong>Session ID:</strong> {currentSession.session_id.slice(-8)}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  {isSessionExpired(currentSession.session_info.expires_at) && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-xs sm:text-sm font-medium">
                        ⚠️ QR Code is inactive - Members cannot check in using this QR code
                      </p>
                    </div>
                  )}
                  <div className={`inline-block p-3 sm:p-4 md:p-6 bg-white border-2 rounded-lg relative ${
                    isSessionExpired(currentSession.session_info.expires_at)
                      ? 'border-red-200 opacity-60'
                      : 'border-gray-200'
                  }`}>
                    <img 
                      src={currentSession.qr_code} 
                      alt="QR Code for attendance" 
                      className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto"
                    />
                    {isSessionExpired(currentSession.session_info.expires_at) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20 rounded-lg">
                        <span className="text-red-700 font-bold text-sm sm:text-base md:text-lg">INACTIVE</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Scan this QR code to check in
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => copyToClipboard(currentSession.check_in_url)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={downloadQR}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                      >
                        <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>
            </div>

              {/* Session Statistics */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Live Statistics</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-green-700 truncate">Total Check-ins</span>
                    </div>
                    <span className="text-sm sm:text-lg font-bold text-green-600">
                      {sessionStats.total_checkins}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-blue-700 truncate">QR Check-ins</span>
                    </div>
                    <span className="text-sm sm:text-lg font-bold text-blue-600">
                      {sessionStats.qr_checkins}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">Manual Check-ins</span>
                    </div>
                    <span className="text-sm sm:text-lg font-bold text-gray-600">
                      {sessionStats.total_checkins - sessionStats.qr_checkins}
                    </span>
                  </div>
                </div>

                <button
                  onClick={loadSessionStats}
                  className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
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
                    onClick={() => router.push(`/attendance/record?date=${currentSession.session_info.date}&type=${currentSession.session_info.attendance_type}&session_id=${currentSession.session_id}`)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Manual Recording</span>
                  </button>
                  
                  {!isSessionExpired(currentSession.session_info.expires_at) && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-green-600 mb-2">✓ QR check-ins are active</p>
                      <p className="text-xs text-gray-500">
                        Members can scan QR code or use manual recording above
                      </p>
                    </div>
                  )}
                  
                  {isSessionExpired(currentSession.session_info.expires_at) && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-orange-600 mb-2">⚠️ QR check-ins are disabled</p>
                      <p className="text-xs text-gray-500">
                        Use manual recording above or extend QR session
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  UserCheck,
  Phone,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  QrCode,
  Calendar,
  Building2
} from 'lucide-react';

interface SessionInfo {
  session_id: string;
  date: string;
  attendance_type: string;
  session_name: string;
  department_id?: string;
  event_id?: string;
  expires_at: string;
  is_active: boolean;
}

export default function QRCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'phone' | 'member'>('phone');

  useEffect(() => {
    if (sessionId) {
      loadSessionInfo();
    }
  }, [sessionId]);

  const loadSessionInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/attendance/qr-session?session_id=${sessionId}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setSessionInfo(data.data);
        
        // Check if session is expired
        if (!data.data.is_active || new Date() > new Date(data.data.expires_at)) {
          setError('This check-in session has expired.');
        }
      } else {
        setError(data.error || 'Session not found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load session information');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!sessionInfo) return;
    
    const identifier = activeTab === 'phone' ? phoneNumber.trim() : memberNumber.trim();
    if (!identifier) {
      setError(`Please enter your ${activeTab === 'phone' ? 'phone number' : 'member number'}`);
      return;
    }

    try {
      setChecking(true);
      setError(null);
      setSuccess(null);

      const payload = {
        session_id: sessionId,
        ...(activeTab === 'phone' 
          ? { phone_number: identifier } 
          : { member_number: identifier }
        )
      };

      const response = await fetch('/api/attendance/qr-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        setPhoneNumber('');
        setMemberNumber('');
      } else {
        setError(result.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      setError('Check-in failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const formatAttendanceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number as user types (Tanzanian format)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('255')) {
      return cleaned.replace(/(\d{3})(\d{2})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
    } else if (cleaned.startsWith('0')) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return cleaned;
  };

  const isSessionExpired = Boolean(sessionInfo && (
    !sessionInfo.is_active || new Date() > new Date(sessionInfo.expires_at)
  ));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading check-in session...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Session Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/attendance')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Attendance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 text-center">
          <QrCode className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">Church Check-In</h1>
          <p className="text-blue-100 text-sm">Filadefia Christian Center</p>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">{sessionInfo.session_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">
                  {new Date(sessionInfo.date).toLocaleDateString()} - {formatAttendanceType(sessionInfo.attendance_type)}
                </span>
              </div>
              {isSessionExpired && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Session Expired</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isSessionExpired ? (
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Expired</h2>
              <p className="text-gray-600 mb-4">
                This check-in session has expired. Please contact church leadership for assistance.
              </p>
            </div>
          ) : success ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check-in Successful!</h2>
              <p className="text-green-600 mb-4">{success}</p>
              <button
                onClick={() => {
                  setSuccess(null);
                  setError(null);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Check In Another Person
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Check In to Service
              </h2>

              {/* Tab Selection */}
              <div className="flex mb-4">
                <button
                  onClick={() => setActiveTab('phone')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border ${
                    activeTab === 'phone'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </button>
                <button
                  onClick={() => setActiveTab('member')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border ${
                    activeTab === 'member'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Member Number
                </button>
              </div>

              {/* Input Form */}
              <div className="space-y-4">
                {activeTab === 'phone' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0742 123 456 or +255 742 123 456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={checking}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Enter your registered phone number
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Number
                    </label>
                    <input
                      type="text"
                      value={memberNumber}
                      onChange={(e) => setMemberNumber(e.target.value.toUpperCase())}
                      placeholder="FCC001 or MEM123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={checking}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Enter your church member number
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckIn}
                  disabled={checking || isSessionExpired}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{checking ? 'Checking In...' : 'Check In'}</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-600">
                  Need help? Contact church administration
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
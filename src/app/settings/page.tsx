'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui';
import { User, Mail, Phone, Shield, Calendar, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [darkMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const profile = user?.profile;
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Sidebar darkMode={darkMode} onSignOut={signOut} />
      
      <div className="ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-3xl font-bold ${textPrimary} mb-8`}>Profile Settings</h1>
          
          {/* Profile Card */}
          <Card className={`${cardBg} p-8 mb-6`}>
            <div className="flex items-start space-x-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={
                    profile?.avatar_url || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`
                  }
                  alt={`${profile?.first_name || 'User'} ${profile?.last_name || ''}`.trim()}
                  className="h-32 w-32 rounded-full object-cover border-4 border-blue-100"
                />
                {profile?.avatar_url && (
                  <div className="absolute bottom-0 right-0 bg-green-500 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
                  {profile?.first_name || 'User'} {profile?.last_name || ''}
                </h2>
                <p className={`${textSecondary} mb-4`}>{user?.email}</p>
                
                {profile?.avatar_url ? (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span>Google Profile Connected</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    <span className="h-2 w-2 bg-gray-500 rounded-full"></span>
                    <span>Default Avatar</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Profile Details */}
          <Card className={`${cardBg} p-8 mb-6`}>
            <h3 className={`text-xl font-semibold ${textPrimary} mb-6`}>Profile Details</h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <User className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textSecondary}`}>Full Name</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>
                    {profile?.first_name || 'Not set'} {profile?.last_name || ''}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textSecondary}`}>Email Address</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{user?.email || 'Not set'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <Phone className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textSecondary}`}>Phone Number</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>
                    {profile?.phone || 'Not set'}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <Shield className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textSecondary}`}>Role</p>
                  <p className={`text-lg font-medium ${textPrimary} capitalize`}>
                    {profile?.role || 'member'}
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <Calendar className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textSecondary}`}>Member Since</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Avatar URL Info */}
          {profile?.avatar_url && (
            <Card className={`${cardBg} p-6`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>Profile Image Source</h3>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} overflow-auto`}>
                <code className={`text-sm ${textSecondary}`}>{profile.avatar_url}</code>
              </div>
              <p className={`text-sm ${textSecondary} mt-3`}>
                Your profile image is automatically synced from your Google account.
              </p>
            </Card>
          )}

          {/* Instructions */}
          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border-2 ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              <strong>Note:</strong> Your profile information is automatically populated from your Google account when you sign in.
              To update your profile picture or name, please update your Google account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

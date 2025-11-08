'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfileCheckPage() {
  const { user, loading, supabase } = useAuth();
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkData = async () => {
      if (!supabase) return;

      try {
        // Get current auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Get all profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*');
        
        setProfiles(profilesData || []);
        setChecking(false);
      } catch (error) {
        console.error('Error checking data:', error);
        setChecking(false);
      }
    };

    if (!loading) {
      checkData();
    }
  }, [loading, supabase]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fcc-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking profile status...</p>
        </div>
      </div>
    );
  }

  const currentUserProfile = profiles.find(p => p.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Status Check</h1>

          {/* Current User Status */}
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Account</h2>
            
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <p className="text-gray-700">
                    <span className="font-medium">Logged in as:</span> {user.email}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${currentUserProfile ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-gray-700">
                    <span className="font-medium">Profile status:</span>{' '}
                    {currentUserProfile ? (
                      <span className="text-green-600 font-semibold">✓ Profile exists</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗ Profile missing</span>
                    )}
                  </p>
                </div>
                
                {currentUserProfile && (
                  <div className="mt-4 space-y-4">
                    {/* Profile Image Preview */}
                    {currentUserProfile.avatar_url && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Profile Image:</h3>
                        <div className="flex items-center space-x-4">
                          <img
                            src={currentUserProfile.avatar_url}
                            alt="Profile"
                            className="h-20 w-20 rounded-full object-cover border-2 border-blue-200"
                          />
                          <div>
                            <p className="text-sm text-gray-600">✓ Google profile image loaded</p>
                            <p className="text-xs text-gray-500 mt-1 break-all max-w-md">
                              {currentUserProfile.avatar_url}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Profile Details */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Profile Details:</h3>
                      <pre className="text-sm text-gray-600 overflow-auto">
                        {JSON.stringify(currentUserProfile, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {!currentUserProfile && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-900 mb-2">⚠️ Action Required</h3>
                    <p className="text-red-700 mb-3">
                      Your account doesn't have a profile. This will cause errors in the application.
                    </p>
                    <Link
                      href="/QUICK_FIX_PROFILE_ERROR.md"
                      className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      View Fix Instructions
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <p className="text-gray-700">Not logged in</p>
              </div>
            )}
          </div>

          {/* All Profiles Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Profiles</p>
                <p className="text-3xl font-bold text-gray-900">{profiles.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Your Profile Status</p>
                <p className="text-3xl font-bold text-gray-900">
                  {currentUserProfile ? '✓' : '✗'}
                </p>
              </div>
            </div>
          </div>

          {/* All Profiles Table */}
          {profiles.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All Profiles</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border">Name</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border">Role</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className={profile.user_id === user?.id ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-2 text-sm text-gray-900 border">{profile.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 border">
                          {profile.first_name} {profile.last_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 border">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {profile.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 border">
                          {profile.is_active ? (
                            <span className="text-green-600">● Active</span>
                          ) : (
                            <span className="text-gray-400">● Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-medium">If you see "Profile missing":</span> Follow the instructions in{' '}
                <code className="px-2 py-1 bg-gray-200 rounded">QUICK_FIX_PROFILE_ERROR.md</code>
              </p>
              <p>
                <span className="font-medium">If profiles exist:</span> The trigger is working correctly and future signups will automatically create profiles.
              </p>
              <p>
                <span className="font-medium">To run the migration:</span> Go to Supabase Dashboard → SQL Editor → Run the migration from{' '}
                <code className="px-2 py-1 bg-gray-200 rounded">database/migrations/add_user_profile_trigger.sql</code>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              ← Back to Home
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-fcc-blue-600 text-white rounded-xl hover:bg-fcc-blue-700 transition-colors"
              >
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

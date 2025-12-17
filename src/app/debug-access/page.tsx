'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DebugDepartmentAccess() {
  const { user, supabase } = useAuth();
  const departmentAccess = useDepartmentAccess();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const runDebugQueries = async () => {
      if (!user || !supabase) return;

      try {
        // Check profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);

        // Check members by name
        const { data: membersByName } = await supabase
          .from('members')
          .select('*')
          .eq('first_name', user.profile?.first_name)
          .eq('last_name', user.profile?.last_name);

        // Check members by email
        const { data: membersByEmail } = await supabase
          .from('members')
          .select('*')
          .eq('email', user.email);

        // Check all departments
        const { data: departments } = await supabase
          .from('departments')
          .select(`
            *,
            leader:members!departments_leader_id_fkey(*)
          `)
          .eq('is_active', true);

        setDebugInfo({
          user,
          profiles,
          membersByName,
          membersByEmail,
          departments,
          departmentAccess
        });
      } catch (error) {
        console.error('Debug query error:', error);
      }
    };

    runDebugQueries();
  }, [user, supabase]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-20">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Department Access Debug - Enhanced</h1>
            
            <div className="space-y-6">
              {/* Current User */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">Current User</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify({
                    id: user?.id,
                    email: user?.email,
                    profile: user?.profile
                  }, null, 2)}
                </pre>
              </div>

              {/* Department Access Hook Result */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-600">Department Access Hook Result</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(departmentAccess, null, 2)}
                </pre>
              </div>

              {/* Member Records */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-purple-600">Member Records</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">By Name:</h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(debugInfo.membersByName, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">By Email:</h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(debugInfo.membersByEmail, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* All Departments */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">All Departments</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.departments, null, 2)}
                </pre>
              </div>

              {/* Expected Redirect URL */}
              {departmentAccess.isDepartmentLeader && departmentAccess.departmentId && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-2 text-green-800">Expected Redirect</h2>
                  <p className="text-green-700">
                    <strong>URL:</strong> <code>/departments/{departmentAccess.departmentId}</code>
                  </p>
                  <button 
                    onClick={() => window.location.href = `/departments/${departmentAccess.departmentId}`}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Test Redirect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
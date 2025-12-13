'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DebugDepartmentPage() {
  const { user, supabase } = useAuth();
  const { departmentId, departmentName, isDepartmentLeader, loading } = useDepartmentAccess();
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);

  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!supabase) return;

      // Load all departments
      const { data: depts } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          leader_id,
          is_active,
          leader:members!departments_leader_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('name');

      // Load all members
      const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .order('first_name');

      setAllDepartments(depts || []);
      setAllMembers(members || []);
    };

    loadDebugInfo();
  }, [supabase]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Department Access Debug</h1>
            
            {/* Current User Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Current User Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                  <p><strong>Role:</strong> {user?.profile?.role || 'N/A'}</p>
                  <p><strong>Name:</strong> {user?.profile?.first_name} {user?.profile?.last_name}</p>
                </div>
                <div>
                  <p><strong>Is Department Leader:</strong> {isDepartmentLeader ? 'Yes' : 'No'}</p>
                  <p><strong>Department ID:</strong> {departmentId || 'N/A'}</p>
                  <p><strong>Department Name:</strong> {departmentName || 'N/A'}</p>
                  <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Expected Dashboard URL */}
            {isDepartmentLeader && departmentId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-green-800 mb-2">Expected Dashboard URL</h2>
                <p className="text-green-700">
                  <strong>URL:</strong> <code>/departments/{departmentId}</code>
                </p>
                <p className="text-green-700 mt-2">
                  <strong>Full URL:</strong> <code>http://localhost:3000/departments/{departmentId}</code>
                </p>
              </div>
            )}

            {/* All Departments */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">All Departments</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Leader ID</th>
                      <th className="px-4 py-2 text-left">Leader Name</th>
                      <th className="px-4 py-2 text-left">Active</th>
                      <th className="px-4 py-2 text-left">Dashboard URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDepartments.map((dept, index) => (
                      <tr key={dept.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-2 font-mono text-xs">{dept.id}</td>
                        <td className="px-4 py-2">{dept.name}</td>
                        <td className="px-4 py-2 font-mono text-xs">{dept.leader_id || 'N/A'}</td>
                        <td className="px-4 py-2">
                          {dept.leader 
                            ? `${dept.leader.first_name} ${dept.leader.last_name}`
                            : 'No leader assigned'
                          }
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {dept.is_active ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            /departments/{dept.id}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">All Members (Potential Leaders)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.slice(0, 10).map((member, index) => (
                      <tr key={member.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-2 font-mono text-xs">{member.id}</td>
                        <td className="px-4 py-2">{member.first_name} {member.last_name}</td>
                        <td className="px-4 py-2">{member.email || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allMembers.length > 10 && (
                  <p className="text-gray-500 text-sm mt-2">
                    Showing first 10 members. Total: {allMembers.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
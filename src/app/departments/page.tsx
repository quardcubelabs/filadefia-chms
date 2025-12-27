'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { 
  Users, Building2, UserCheck, TrendingUp, ArrowRight, 
  Music, Heart, Briefcase, BookOpen, Globe, Phone, Plus, Edit
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  leader_id?: string;
  is_active: boolean;
  created_at: string;
}

interface DepartmentStats {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  member_count: number;
  leader_name?: string;
  icon: any;
  color: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Auth state:', { user: !!user, authLoading, supabase: !!supabase });
    
    if (!authLoading && !user) {
      console.log('No user, redirecting to login...');
      router.push('/login');
      return;
    }

    if (!authLoading && user && supabase) {
      fetchDepartments();
    }
  }, [authLoading, user, supabase]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching departments...');

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch departments
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      console.log('Departments fetched:', depts, 'Error:', deptsError);

      if (deptsError) throw deptsError;

      // Fetch member counts for each department
      const departmentsWithStats: DepartmentStats[] = await Promise.all(
        (depts || []).map(async (dept: Department) => {
          const { count } = await supabase
            .from('department_members')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)
            .eq('is_active', true);

          return {
            ...dept,
            member_count: count || 0,
            icon: getDepartmentIcon(dept.name),
            color: getDepartmentColor(dept.name),
          };
        })
      );

      setDepartments(departmentsWithStats);
      console.log('Departments with stats:', departmentsWithStats);

    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentIcon = (name: string) => {
    const iconMap: Record<string, any> = {
      'Youth Department': Users,
      'Women\'s Department': Heart,
      'Men\'s Department': Briefcase,
      'Children\'s Department': Users,
      'Evangelism Department': Globe,
      'Choir & Praise Team': Music,
      'Prayer & Intercession Department': Heart,
      'Ushering Department': UserCheck,
      'Media & Technical Department': Building2,
      'Discipleship & Teaching Department': BookOpen,
      'Mission & Outreach Department': Globe,
      'Welfare & Counseling Department': Phone,
    };
    return iconMap[name] || Users;
  };

  const getDepartmentColor = (name: string) => {
    const colorMap: Record<string, string> = {
      'Youth Department': 'from-blue-500 to-blue-700',
      'Women\'s Department': 'from-pink-500 to-pink-700',
      'Men\'s Department': 'from-gray-700 to-gray-900',
      'Children\'s Department': 'from-yellow-400 to-yellow-600',
      'Evangelism Department': 'from-red-500 to-red-700',
      'Choir & Praise Team': 'from-purple-500 to-purple-700',
      'Prayer & Intercession Department': 'from-indigo-500 to-indigo-700',
      'Ushering Department': 'from-green-500 to-green-700',
      'Media & Technical Department': 'from-gray-600 to-gray-800',
      'Discipleship & Teaching Department': 'from-blue-600 to-blue-800',
      'Mission & Outreach Department': 'from-teal-500 to-teal-700',
      'Welfare & Counseling Department': 'from-orange-500 to-orange-700',
    };
    return colorMap[name] || 'from-red-500 to-red-700';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-blue-600" />
              Department Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and view all Tanzania Assemblies of God departments
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => router.push('/departments/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
            <p className="text-gray-600 mb-4">No active departments are currently configured in the system</p>
            <button
              onClick={() => router.push('/departments/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Department
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Departments */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Departments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Total Members */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {departments.reduce((sum, d) => sum + d.member_count, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Average Members */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Members/Dept</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {departments.length > 0 ? Math.round(departments.reduce((sum, d) => sum + d.member_count, 0) / departments.length) : 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">Active</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Departments Grid */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Departments</h3>
                <p className="text-sm text-gray-600 mt-1">Click on any department to view details</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((dept) => {
                    const Icon = dept.icon;
                    return (
                      <div 
                        key={dept.id} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        onClick={() => router.push(`/departments/${dept.id}`)}
                      >
                        {/* Icon and Badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`h-12 w-12 bg-gradient-to-br ${dept.color} rounded-lg flex items-center justify-center`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dept.member_count} {dept.member_count === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>

                        {/* Department Name */}
                        <h4 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {dept.name}
                        </h4>

                        {/* Swahili Name */}
                        {dept.swahili_name && (
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            {dept.swahili_name}
                          </p>
                        )}

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {dept.description || 'No description available'}
                        </p>

                        {/* View Button */}
                        <div className="flex justify-end">
                          <button
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/departments/${dept.id}`);
                            }}
                          >
                            View Details
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

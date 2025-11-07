'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Button, Card, CardBody, Badge, EmptyState, Loading, Alert, Avatar } from '@/components/ui';
import { 
  Users, Building2, UserCheck, TrendingUp, ArrowRight, 
  Music, Heart, Briefcase, BookOpen, Globe, Phone
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
    if (!authLoading && user) {
      fetchDepartments();
    }
  }, [authLoading, user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch departments
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

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

    } catch (err: any) {
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
      'Youth Department': 'from-tag-blue-500 to-tag-blue-700',
      'Women\'s Department': 'from-pink-500 to-pink-700',
      'Men\'s Department': 'from-tag-gray-700 to-tag-gray-900',
      'Children\'s Department': 'from-tag-yellow-400 to-tag-yellow-600',
      'Evangelism Department': 'from-tag-red-500 to-tag-red-700',
      'Choir & Praise Team': 'from-purple-500 to-purple-700',
      'Prayer & Intercession Department': 'from-indigo-500 to-indigo-700',
      'Ushering Department': 'from-green-500 to-green-700',
      'Media & Technical Department': 'from-tag-gray-600 to-tag-gray-800',
      'Discipleship & Teaching Department': 'from-blue-600 to-blue-800',
      'Mission & Outreach Department': 'from-teal-500 to-teal-700',
      'Welfare & Counseling Department': 'from-orange-500 to-orange-700',
    };
    return colorMap[name] || 'from-tag-red-500 to-tag-red-700';
  };

  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-tag-gray-50 via-white to-tag-blue-50/30">
      <Sidebar />
      
      <main className="flex-1 ml-20 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tag-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-tag-red-600" />
            Departments
          </h1>
          <p className="text-tag-gray-600 mt-2">
            Manage and view all Tanzania Assemblies of God (TAG) departments
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Card variant="default">
            <CardBody className="p-12">
              <Loading text="Loading departments..." />
            </CardBody>
          </Card>
        ) : departments.length === 0 ? (
          <Card variant="default">
            <CardBody className="p-12">
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="No departments found"
                description="No active departments are currently configured in the system"
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card variant="gradient">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-tag-gray-600 mb-1">Total Departments</p>
                      <p className="text-3xl font-bold text-tag-gray-900">{departments.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-tag-red-500 to-tag-red-700 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card variant="gradient">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-tag-gray-600 mb-1">Total Members</p>
                      <p className="text-3xl font-bold text-tag-gray-900">
                        {departments.reduce((sum, d) => sum + d.member_count, 0)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-tag-blue-500 to-tag-blue-700 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card variant="gradient">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-tag-gray-600 mb-1">Avg Members/Dept</p>
                      <p className="text-3xl font-bold text-tag-gray-900">
                        {Math.round(departments.reduce((sum, d) => sum + d.member_count, 0) / departments.length)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-tag-yellow-500 to-tag-yellow-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card variant="gradient">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-tag-gray-600 mb-1">Active Status</p>
                      <p className="text-3xl font-bold text-tag-green-600">Active</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-tag-green-500 to-tag-green-700 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const Icon = dept.icon;
                return (
                  <Card 
                    key={dept.id} 
                    variant="default"
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => router.push(`/departments/${dept.id}`)}
                  >
                    <CardBody className="p-6">
                      {/* Icon and Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-14 w-14 bg-gradient-to-br ${dept.color} rounded-lg flex items-center justify-center shadow-md`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <Badge variant="info" dot>
                          {dept.member_count} {dept.member_count === 1 ? 'Member' : 'Members'}
                        </Badge>
                      </div>

                      {/* Department Name */}
                      <h3 className="text-lg font-bold text-tag-gray-900 mb-2 group-hover:text-tag-red-600 transition-colors">
                        {dept.name}
                      </h3>

                      {/* Swahili Name */}
                      {dept.swahili_name && (
                        <p className="text-sm font-semibold text-tag-gray-600 mb-3">
                          {dept.swahili_name}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-sm text-tag-gray-600 mb-4 line-clamp-2">
                        {dept.description}
                      </p>

                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-tag-red-500 group-hover:text-white group-hover:border-tag-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/departments/${dept.id}`);
                        }}
                      >
                        View Dashboard
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

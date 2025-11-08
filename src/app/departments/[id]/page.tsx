'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Button, Card, CardBody, Badge, Avatar, EmptyState, Loading, Alert, Table } from '@/components/ui';
import { 
  ArrowLeft, Users, UserCheck, Crown, Briefcase, Phone, Mail,
  Calendar, TrendingUp, Building2, Edit, Plus
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  leader_id?: string;
  is_active: boolean;
}

interface DepartmentMember {
  id: string;
  member_id: string;
  position: string;
  joined_date: string;
  member: {
    id: string;
    member_number: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    photo_url?: string;
    status: string;
  };
}

export default function DepartmentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDepartmentData();
    }
  }, [authLoading, user, params.id]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (deptError) throw deptError;
      setDepartment(deptData);

      // Fetch department members with member details
      const { data: membersData, error: membersError } = await supabase
        .from('department_members')
        .select(`
          *,
          member:members(*)
        `)
        .eq('department_id', params.id)
        .eq('is_active', true)
        .order('position');

      if (membersError) throw membersError;
      setMembers(membersData || []);

    } catch (err: any) {
      setError(err.message || 'Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      chairperson: 'success',
      secretary: 'info',
      treasurer: 'warning',
      coordinator: 'info',
      member: 'default',
    };
    
    const icons: Record<string, any> = {
      chairperson: Crown,
      secretary: Edit,
      treasurer: Briefcase,
      coordinator: UserCheck,
      member: Users,
    };

    const Icon = icons[position] || Users;
    
    return (
      <Badge variant={variants[position] || 'default'}>
        <Icon className="h-3 w-3 mr-1 inline" />
        {position.charAt(0).toUpperCase() + position.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      active: 'success',
      visitor: 'info',
      transferred: 'warning',
      inactive: 'default',
    };
    return <Badge variant={variants[status]} dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  // Group members by position
  const leadershipMembers = members.filter(m => ['chairperson', 'secretary', 'treasurer', 'coordinator'].includes(m.position));
  const regularMembers = members.filter(m => m.position === 'member');

  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-20 p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/departments')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </Button>

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
              <Loading text="Loading department..." />
            </CardBody>
          </Card>
        ) : !department ? (
          <Card variant="default">
            <CardBody className="p-12">
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="Department not found"
                description="The department you're looking for doesn't exist"
                action={{
                  label: 'Go to Departments',
                  onClick: () => router.push('/departments')
                }}
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Department Header */}
            <Card variant="gradient" className="mb-6">
              <div className="h-24 bg-gradient-to-r from-tag-red-500 via-tag-red-600 to-tag-yellow-500"></div>
              <CardBody className="p-6 -mt-12 relative">
                <div className="flex items-end gap-4">
                  <div className="h-20 w-20 bg-white rounded-lg shadow-xl flex items-center justify-center border-4 border-white">
                    <Building2 className="h-10 w-10 text-tag-red-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-tag-gray-900 mb-1">
                      {department.name}
                    </h1>
                    {department.swahili_name && (
                      <p className="text-tag-gray-600 font-semibold mb-2">
                        {department.swahili_name}
                      </p>
                    )}
                    {department.description && (
                      <p className="text-tag-gray-600 text-sm">
                        {department.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card variant="default">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-8 w-8 text-tag-blue-600" />
                    <span className="text-3xl font-bold text-tag-gray-900">{members.length}</span>
                  </div>
                  <p className="text-sm font-semibold text-tag-gray-600">Total Members</p>
                </CardBody>
              </Card>

              <Card variant="default">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Crown className="h-8 w-8 text-tag-yellow-600" />
                    <span className="text-3xl font-bold text-tag-gray-900">{leadershipMembers.length}</span>
                  </div>
                  <p className="text-sm font-semibold text-tag-gray-600">Leadership</p>
                </CardBody>
              </Card>

              <Card variant="default">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck className="h-8 w-8 text-tag-green-600" />
                    <span className="text-3xl font-bold text-tag-gray-900">
                      {members.filter(m => m.member.status === 'active').length}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-tag-gray-600">Active Members</p>
                </CardBody>
              </Card>

              <Card variant="default">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-8 w-8 text-tag-red-600" />
                    <span className="text-3xl font-bold text-tag-gray-900">100%</span>
                  </div>
                  <p className="text-sm font-semibold text-tag-gray-600">Engagement</p>
                </CardBody>
              </Card>
            </div>

            {/* Leadership Team */}
            {leadershipMembers.length > 0 && (
              <Card variant="default" className="mb-6">
                <CardBody className="p-6">
                  <h2 className="text-xl font-bold text-tag-gray-900 mb-6 flex items-center">
                    <Crown className="h-6 w-6 mr-2 text-tag-yellow-600" />
                    Leadership Team
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {leadershipMembers.map((dm) => (
                      <div
                        key={dm.id}
                        className="bg-gradient-to-br from-tag-gray-50 to-white border border-tag-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/members/${dm.member.id}`)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <Avatar
                            src={dm.member.photo_url}
                            alt={`${dm.member.first_name} ${dm.member.last_name}`}
                            size="lg"
                            className="mb-3"
                          />
                          <h3 className="font-bold text-tag-gray-900 mb-1">
                            {dm.member.first_name} {dm.member.last_name}
                          </h3>
                          <p className="text-xs text-tag-gray-600 mb-2">
                            {dm.member.member_number}
                          </p>
                          {getPositionBadge(dm.position)}
                          <div className="mt-3 pt-3 border-t border-tag-gray-200 w-full">
                            <div className="flex items-center justify-center text-xs text-tag-gray-600 mb-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {dm.member.phone}
                            </div>
                            {dm.member.email && (
                              <div className="flex items-center justify-center text-xs text-tag-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {dm.member.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* All Members Table */}
            <Card variant="default">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-tag-gray-900 flex items-center">
                    <Users className="h-6 w-6 mr-2 text-tag-blue-600" />
                    All Members ({members.length})
                  </h2>
                </div>

                {members.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="No members assigned"
                    description="This department doesn't have any members yet"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-tag-gray-50 border-b border-tag-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-tag-gray-700">Member</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-tag-gray-700">Position</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-tag-gray-700">Contact</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-tag-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-tag-gray-700">Joined</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-tag-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-tag-gray-200">
                        {members.map((dm) => (
                          <tr key={dm.id} className="hover:bg-tag-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <Avatar
                                  src={dm.member.photo_url}
                                  alt={`${dm.member.first_name} ${dm.member.last_name}`}
                                  size="sm"
                                  className="mr-3"
                                />
                                <div>
                                  <p className="font-semibold text-tag-gray-900">
                                    {dm.member.first_name} {dm.member.last_name}
                                  </p>
                                  <p className="text-xs text-tag-gray-600">{dm.member.member_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getPositionBadge(dm.position)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm">
                                <p className="text-tag-gray-900">{dm.member.phone}</p>
                                {dm.member.email && (
                                  <p className="text-tag-gray-600 text-xs">{dm.member.email}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(dm.member.status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-tag-gray-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(dm.joined_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/members/${dm.member.id}`)}
                                >
                                  View Profile
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

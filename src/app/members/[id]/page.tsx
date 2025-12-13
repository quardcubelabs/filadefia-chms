'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import DepartmentAssignment from '@/components/DepartmentAssignment';
import PhotoUpload from '@/components/PhotoUpload';
import MembershipCard from '@/components/MembershipCard';
import { Button, Card, CardBody, Badge, Avatar, EmptyState, Loading, Alert } from '@/components/ui';
import { 
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, 
  Briefcase, Users, Heart, FileText, History, DollarSign,
  User, Home, Building2, AlertCircle, CreditCard
} from 'lucide-react';

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  occupation?: string;
  employer?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  membership_date: string;
  status: 'active' | 'visitor' | 'transferred' | 'inactive';
  baptized?: boolean;
  baptism_date?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  service_type: string;
  present: boolean;
}

interface Contribution {
  id: string;
  date: string;
  amount: number;
  transaction_type: 'tithe' | 'offering' | 'donation' | 'project' | 'pledge' | 'mission' | 'welfare';
  description?: string;
  payment_method: string;
  currency: string;
  reference_number?: string;
  verified: boolean;
  verified_at?: string;
  created_at: string;
  department?: {
    name: string;
  };
  recorder?: {
    first_name: string;
    last_name: string;
  };
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  
  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'contributions' | 'activity'>('overview');
  
  // Stats state
  const [totalAttendance, setTotalAttendance] = useState<number>(0);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [departmentCount, setDepartmentCount] = useState<number>(0);
  const [contributionStats, setContributionStats] = useState({
    totalRecords: 0,
    averageAmount: 0,
    monthlyTotal: 0,
    yearlyTotal: 0,
    lastContributionDate: null as string | null,
    unverifiedCount: 0
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchMemberDetails();
    }
  }, [authLoading, user, params.id]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', params.id)
        .single();

      if (memberError) throw memberError;
      setMember(memberData);

      // Fetch attendance count
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('member_id', params.id)
        .eq('present', true);
      
      if (!attendanceError) {
        setTotalAttendance(attendanceData?.length || 0);
      }

      // Fetch detailed contributions data (similar to finance page)
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('financial_transactions')
        .select(`
          id, 
          amount, 
          transaction_type, 
          description, 
          date, 
          payment_method, 
          currency, 
          reference_number,
          verified,
          verified_at,
          created_at,
          department:departments(name),
          recorder:profiles!recorded_by(first_name, last_name)
        `)
        .eq('member_id', params.id)
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission', 'welfare'])
        .order('date', { ascending: false });
      
      if (!contributionsError && contributionsData) {
        const total = contributionsData.reduce((sum: number, transaction: any) => sum + Number(transaction.amount), 0);
        setTotalContributions(total);
        setContributions(contributionsData);
        calculateContributionStats(contributionsData);
      }

      // Fetch department count
      const { data: departmentData, error: departmentError } = await supabase
        .from('department_members')
        .select('id', { count: 'exact' })
        .eq('member_id', params.id)
        .eq('is_active', true);
      
      if (!departmentError) {
        setDepartmentCount(departmentData?.length || 0);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/members?edit=${params.id}`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this member?`)) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      router.push('/members');
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
    }
  };

  const getStatusBadge = (status: Member['status']) => {
    const variants: Record<Member['status'], 'success' | 'info' | 'warning' | 'default'> = {
      active: 'success',
      visitor: 'info',
      transferred: 'warning',
      inactive: 'default',
    };
    return <Badge variant={variants[status]} dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatContribution = (amount: number) => {
    if (amount === 0) return '0';
    if (amount >= 1000000) {
      return `TZS ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `TZS ${(amount / 1000).toFixed(1)}K`;
    }
    return `TZS ${amount.toLocaleString()}`;
  };

  const calculateContributionStats = (contributionsData: Contribution[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const totalRecords = contributionsData.length;
    const totalAmount = contributionsData.reduce((sum, t) => sum + Number(t.amount), 0);
    const averageAmount = totalRecords > 0 ? totalAmount / totalRecords : 0;
    
    // Monthly total (current month)
    const monthlyTotal = contributionsData
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Yearly total (current year)
    const yearlyTotal = contributionsData
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Last contribution date
    const lastContributionDate = contributionsData.length > 0 ? contributionsData[0].date : null;
    
    // Unverified count
    const unverifiedCount = contributionsData.filter(t => !t.verified).length;

    setContributionStats({
      totalRecords,
      averageAmount,
      monthlyTotal,
      yearlyTotal,
      lastContributionDate,
      unverifiedCount
    });
  };

  if (!user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/members')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-tag-gray-900 flex items-center">
              <User className="h-8 w-8 mr-3 text-tag-red-600" />
              Member Profile
            </h1>
            
            {member && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
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
              <Loading />
            </CardBody>
          </Card>
        ) : !member ? (
          <Card variant="default">
            <CardBody className="p-12">
              <EmptyState
                icon={<User className="h-12 w-12" />}
                title="Member not found"
                description="The member you're looking for doesn't exist or has been deleted"
                action={{
                  label: 'Go to Members',
                  onClick: () => router.push('/members')
                }}
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Profile Header Card */}
            <Card variant="gradient" className="mb-6 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-tag-red-500 via-tag-red-600 to-tag-yellow-500"></div>
              <CardBody className="p-6 -mt-16 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                  <Avatar
                    src={member.photo_url}
                    alt={`${member.first_name} ${member.last_name}`}
                    size="xl"
                    className="border-4 border-white shadow-xl"
                  />
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-tag-gray-900">
                        {member.first_name} {member.middle_name} {member.last_name}
                      </h2>
                      {getStatusBadge(member.status)}
                      {member.baptized && (
                        <Badge variant="info" dot>Baptized</Badge>
                      )}
                    </div>
                    
                    <p className="text-tag-gray-600 font-semibold mb-4">
                      Member #{member.member_number}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {member.phone && (
                        <div className="flex items-center text-tag-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-tag-red-600" />
                          <span className="text-sm">{member.phone}</span>
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center text-tag-gray-700">
                          <Mail className="h-4 w-4 mr-2 text-tag-red-600" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                      )}
                      <div className="flex items-center text-tag-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-tag-red-600" />
                        <span className="text-sm">Joined {new Date(member.membership_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Tabs - Same design as image */}
            <div className="mb-6">
              <nav className="flex space-x-0">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'attendance', label: 'Attendance', icon: History },
                  { id: 'contributions', label: 'Contributions', icon: DollarSign },
                  { id: 'activity', label: 'Activity', icon: AlertCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-red-100 text-red-600 rounded-tl-lg'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card variant="default" className="lg:col-span-2">
                  <CardBody className="p-6">
                    <h3 className="text-lg font-bold text-tag-gray-900 mb-6 flex items-center">
                      <User className="h-5 w-5 mr-2 text-tag-red-600" />
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {member.date_of_birth && (
                        <div>
                          <p className="text-sm font-semibold text-tag-gray-600 mb-1">Date of Birth</p>
                          <p className="text-tag-gray-900">
                            {new Date(member.date_of_birth).toLocaleDateString()} 
                            {calculateAge(member.date_of_birth) && ` (${calculateAge(member.date_of_birth)} years old)`}
                          </p>
                        </div>
                      )}
                      
                      {member.gender && (
                        <div>
                          <p className="text-sm font-semibold text-tag-gray-600 mb-1">Gender</p>
                          <p className="text-tag-gray-900 capitalize">{member.gender}</p>
                        </div>
                      )}
                      
                      {member.marital_status && (
                        <div>
                          <p className="text-sm font-semibold text-tag-gray-600 mb-1">Marital Status</p>
                          <p className="text-tag-gray-900 capitalize">{member.marital_status}</p>
                        </div>
                      )}
                      
                      {member.baptism_date && (
                        <div>
                          <p className="text-sm font-semibold text-tag-gray-600 mb-1">Baptism Date</p>
                          <p className="text-tag-gray-900">{new Date(member.baptism_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <Card variant="default">
                    <CardBody className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <History className="h-8 w-8 text-tag-blue-600" />
                        <span className="text-3xl font-bold text-tag-gray-900">{totalAttendance}</span>
                      </div>
                      <p className="text-sm font-semibold text-tag-gray-600">Total Attendance</p>
                    </CardBody>
                  </Card>

                  <Card variant="default">
                    <CardBody className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="h-8 w-8 text-tag-yellow-600" />
                        <span className="text-3xl font-bold text-tag-gray-900">
                          {formatContribution(totalContributions)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-tag-gray-600">Total Contributions</p>
                    </CardBody>
                  </Card>

                  <Card variant="default">
                    <CardBody className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="h-8 w-8 text-tag-red-600" />
                        <span className="text-3xl font-bold text-tag-gray-900">{departmentCount}</span>
                      </div>
                      <p className="text-sm font-semibold text-tag-gray-600">Departments</p>
                    </CardBody>
                  </Card>

                  {/* Photo Management */}
                  <Card variant="default">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-bold text-tag-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-tag-red-600" />
                        Member Photo
                      </h3>
                      <PhotoUpload
                        currentPhotoUrl={member.photo_url}
                        memberName={`${member.first_name} ${member.last_name}`}
                        memberId={member.id}
                        supabase={supabase}
                        onPhotoUploaded={(url) => {
                          setMember(prev => prev ? { ...prev, photo_url: url } : null);
                        }}
                        onPhotoRemoved={() => {
                          setMember(prev => prev ? { ...prev, photo_url: undefined } : null);
                        }}
                      />
                    </CardBody>
                  </Card>
                </div>

                {/* Contact Information */}
                <Card variant="default">
                  <CardBody className="p-6">
                    <h3 className="text-lg font-bold text-tag-gray-900 mb-6 flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-tag-red-600" />
                      Contact Information
                    </h3>
                    
                    <div className="space-y-4">
                      {member.phone && (
                        <div className="flex items-start">
                          <Phone className="h-5 w-5 mr-3 text-tag-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600">Phone</p>
                            <p className="text-tag-gray-900">{member.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {member.email && (
                        <div className="flex items-start">
                          <Mail className="h-5 w-5 mr-3 text-tag-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600">Email</p>
                            <p className="text-tag-gray-900">{member.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {(member.address || member.city || member.state || member.country) && (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-3 text-tag-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600">Address</p>
                            <p className="text-tag-gray-900">
                              {member.address && <>{member.address}<br /></>}
                              {member.city && `${member.city}, `}
                              {member.state} {member.postal_code}
                              {member.country && <><br />{member.country}</>}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Employment Information */}
                {(member.occupation || member.employer) && (
                  <Card variant="default">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-bold text-tag-gray-900 mb-6 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2 text-tag-red-600" />
                        Employment
                      </h3>
                      
                      <div className="space-y-4">
                        {member.occupation && (
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600 mb-1">Occupation</p>
                            <p className="text-tag-gray-900">{member.occupation}</p>
                          </div>
                        )}
                        
                        {member.employer && (
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600 mb-1">Employer</p>
                            <p className="text-tag-gray-900">{member.employer}</p>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Emergency Contact */}
                {(member.emergency_contact_name || member.emergency_contact_phone) && (
                  <Card variant="default">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-bold text-tag-gray-900 mb-6 flex items-center">
                        <Heart className="h-5 w-5 mr-2 text-tag-red-600" />
                        Emergency Contact
                      </h3>
                      
                      <div className="space-y-4">
                        {member.emergency_contact_name && (
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600 mb-1">Name</p>
                            <p className="text-tag-gray-900">{member.emergency_contact_name}</p>
                          </div>
                        )}
                        
                        {member.emergency_contact_phone && (
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600 mb-1">Phone</p>
                            <p className="text-tag-gray-900">{member.emergency_contact_phone}</p>
                          </div>
                        )}
                        
                        {member.emergency_contact_relationship && (
                          <div>
                            <p className="text-sm font-semibold text-tag-gray-600 mb-1">Relationship</p>
                            <p className="text-tag-gray-900 capitalize">{member.emergency_contact_relationship}</p>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Department Assignments */}
                <Card variant="default" className="lg:col-span-3">
                  <CardBody className="p-6">
                    <DepartmentAssignment
                      memberId={member.id}
                      supabase={supabase}
                      onUpdate={() => fetchMemberDetails()}
                    />
                  </CardBody>
                </Card>

                {/* Membership Card Generator */}
                <Card variant="default" className="lg:col-span-3">
                  <CardBody className="p-6">
                    <MembershipCard member={member} />
                  </CardBody>
                </Card>

                {/* Notes */}
                {member.notes && (
                  <Card variant="default" className="lg:col-span-3">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-bold text-tag-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-tag-red-600" />
                        Notes
                      </h3>
                      <p className="text-tag-gray-700 whitespace-pre-wrap">{member.notes}</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <Card variant="default">
                <CardBody className="p-12">
                  <EmptyState
                    icon={<History className="h-12 w-12" />}
                    title="No attendance records"
                    description="Attendance tracking feature is coming soon"
                  />
                </CardBody>
              </Card>
            )}

            {activeTab === 'contributions' && (
              <div className="space-y-6">
                {/* Contributions Summary - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="default">
                    <CardBody className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatContribution(totalContributions)}
                      </div>
                      <p className="text-sm font-semibold text-gray-600">Total All Time</p>
                    </CardBody>
                  </Card>
                  
                  <Card variant="default">
                    <CardBody className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {contributionStats.totalRecords}
                      </div>
                      <p className="text-sm font-semibold text-gray-600">Total Records</p>
                    </CardBody>
                  </Card>
                  
                  <Card variant="default">
                    <CardBody className="p-6 text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {formatContribution(contributionStats.averageAmount)}
                      </div>
                      <p className="text-sm font-semibold text-gray-600">Average Amount</p>
                    </CardBody>
                  </Card>

                  <Card variant="default">
                    <CardBody className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {formatContribution(contributionStats.yearlyTotal)}
                      </div>
                      <p className="text-sm font-semibold text-gray-600">This Year</p>
                    </CardBody>
                  </Card>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="default">
                    <CardBody className="p-4 text-center">
                      <div className="text-xl font-bold text-indigo-600 mb-1">
                        {formatContribution(contributionStats.monthlyTotal)}
                      </div>
                      <p className="text-xs font-semibold text-gray-600">This Month</p>
                    </CardBody>
                  </Card>

                  <Card variant="default">
                    <CardBody className="p-4 text-center">
                      <div className="text-xl font-bold text-orange-600 mb-1">
                        {contributionStats.lastContributionDate ? 
                          new Date(contributionStats.lastContributionDate).toLocaleDateString() : 'Never'}
                      </div>
                      <p className="text-xs font-semibold text-gray-600">Last Contribution</p>
                    </CardBody>
                  </Card>

                  <Card variant="default">
                    <CardBody className="p-4 text-center">
                      <div className="text-xl font-bold text-red-600 mb-1">
                        {contributionStats.unverifiedCount}
                      </div>
                      <p className="text-xs font-semibold text-gray-600">Unverified</p>
                    </CardBody>
                  </Card>
                </div>

                {/* Enhanced Contributions List */}
                <Card variant="default">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        Contribution History
                      </h3>
                      {contributions.length > 0 && (
                        <Badge variant="info" dot>
                          {contributions.length} total records
                        </Badge>
                      )}
                    </div>
                    
                    {contributions.length === 0 ? (
                      <EmptyState
                        icon={<DollarSign className="h-12 w-12" />}
                        title="No contribution records"
                        description="No contributions have been recorded for this member yet"
                      />
                    ) : (
                      <div className="space-y-3">
                        {contributions.slice(0, 15).map((contribution) => (
                          <div
                            key={contribution.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 capitalize">
                                    {contribution.transaction_type.replace('_', ' ')}
                                  </p>
                                  {!contribution.verified && (
                                    <Badge variant="warning" size="sm">Unverified</Badge>
                                  )}
                                  {contribution.verified && (
                                    <Badge variant="success" size="sm">Verified</Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(contribution.date).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1 capitalize">
                                    <CreditCard className="h-3 w-3" />
                                    {contribution.payment_method.replace('_', ' ')}
                                  </span>
                                  {contribution.department?.name && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {contribution.department.name}
                                    </span>
                                  )}
                                </div>
                                
                                {contribution.description && (
                                  <p className="text-sm text-gray-600 mt-1 italic">
                                    "{contribution.description}"
                                  </p>
                                )}
                                
                                {contribution.reference_number && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Ref: {contribution.reference_number}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">
                                {contribution.currency} {Number(contribution.amount).toLocaleString()}
                              </p>
                              {contribution.recorder && (
                                <p className="text-xs text-gray-500">
                                  By: {contribution.recorder.first_name} {contribution.recorder.last_name}
                                </p>
                              )}
                              {contribution.verified_at && (
                                <p className="text-xs text-green-600">
                                  ✓ {new Date(contribution.verified_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {contributions.length > 15 && (
                          <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              Showing latest 15 of {contributions.length} contributions
                            </p>
                            <Button variant="ghost" size="sm" className="mt-2">
                              Load More Contributions
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'activity' && (
              <Card variant="default">
                <CardBody className="p-12">
                  <EmptyState
                    icon={<AlertCircle className="h-12 w-12" />}
                    title="No activity records"
                    description="Activity timeline feature is coming soon"
                  />
                </CardBody>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

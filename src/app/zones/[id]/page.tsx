'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import { Button, Card, CardBody, Badge, Avatar, EmptyState, Loading, Alert } from '@/components/ui';
import { 
  ArrowLeft, Users, UserCheck, Crown, MapPin, Phone, Mail,
  Calendar, TrendingUp, Edit, DollarSign, UserPlus, UserMinus, X, Search, Plus
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  leader_id?: string;
  is_active: boolean;
}

interface ZoneMember {
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
    date_of_birth?: string;
  };
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  photo_url?: string;
}

export default function ZoneDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  
  const [zone, setZone] = useState<Zone | null>(null);
  const [members, setMembers] = useState<ZoneMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Financial data
  const [financialData, setFinancialData] = useState({
    totalZoneIncome: 0,
    monthlyZoneIncome: 0,
    weeklyOfferings: [] as Array<{ week: string, amount: number, label: string }>
  });
  
  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ZoneMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('member');
  const [saving, setSaving] = useState(false);

  const positions = [
    { value: 'leader', label: 'Leader' },
    { value: 'assistant_leader', label: 'Assistant Leader' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'member', label: 'Member' },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && supabase && id) {
      fetchZoneData();
      fetchFinancialData();
    }
  }, [authLoading, user, supabase, id]);

  const fetchZoneData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) return;
      
      // Fetch zone details
      const { data: zoneData, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .eq('id', id)
        .single();

      if (zoneError) throw zoneError;
      setZone(zoneData);

      // Fetch zone members with member details
      const { data: membersData, error: membersError } = await supabase
        .from('zone_members')
        .select(`
          *,
          member:members(*)
        `)
        .eq('zone_id', id)
        .eq('is_active', true)
        .order('position');

      if (membersError) throw membersError;

      // Handle broken relationships
      let processedMembers = membersData || [];
      
      if (processedMembers.some((zm: ZoneMember) => !zm.member)) {
        const memberIds = processedMembers.map((zm: ZoneMember) => zm.member_id).filter(Boolean);
        
        if (memberIds.length > 0) {
          const { data: memberDetails, error: memberError } = await supabase
            .from('members')
            .select('*')
            .in('id', memberIds);

          if (!memberError && memberDetails) {
            processedMembers = processedMembers.map((zm: ZoneMember) => ({
              ...zm,
              member: memberDetails.find((m: any) => m.id === zm.member_id) || null
            }));
          }
        }
      }
      
      setMembers(processedMembers);

    } catch (err: any) {
      setError(err.message || 'Failed to load zone data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      if (!supabase || !id) return;

      // Fetch total zone income - based on zone members
      const { data: zoneMembers } = await supabase
        .from('zone_members')
        .select('member_id')
        .eq('zone_id', id)
        .eq('is_active', true);

      const zoneMemberIds = zoneMembers?.map(zm => zm.member_id) || [];

      if (zoneMemberIds.length === 0) {
        setFinancialData({
          totalZoneIncome: 0,
          monthlyZoneIncome: 0,
          weeklyOfferings: []
        });
        return;
      }

      // Fetch total income from zone members
      const { data: incomeData, error: incomeError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .in('member_id', zoneMemberIds)
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true);
      
      if (incomeError) {
        console.error('Error fetching zone income:', incomeError);
        return;
      }
      
      const totalZoneIncome = incomeData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      // Fetch current month zone income
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('financial_transactions')
        .select('amount')
        .in('member_id', zoneMemberIds)
        .in('transaction_type', ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'])
        .eq('verified', true)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
      
      if (monthlyError) {
        console.error('Error fetching monthly data:', monthlyError);
        return;
      }
      
      const monthlyZoneIncome = monthlyData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      // Fetch weekly offerings for the last 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const { data: weekData, error: weekError } = await supabase
          .from('financial_transactions')
          .select('amount')
          .in('member_id', zoneMemberIds)
          .eq('transaction_type', 'offering')
          .eq('verified', true)
          .gte('date', weekStart.toISOString().split('T')[0])
          .lte('date', weekEnd.toISOString().split('T')[0]);
        
        if (!weekError && weekData) {
          const weekAmount = weekData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
          weeks.push({
            week: `W${8-i}`,
            amount: weekAmount,
            label: String(8-i).padStart(2, '0')
          });
        }
      }
      
      setFinancialData({
        totalZoneIncome,
        monthlyZoneIncome,
        weeklyOfferings: weeks
      });
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      if (!supabase) return;

      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, email, photo_url')
        .eq('status', 'active')
        .order('first_name');

      if (membersError) throw membersError;

      const zoneMemberIds = members.map(m => m.member_id);
      const available = (allMembers || []).filter(m => !zoneMemberIds.includes(m.id));
      
      setAvailableMembers(available);
    } catch (err: any) {
      console.error('Error fetching available members:', err);
    }
  };

  const handleAddMember = async (memberId: string) => {
    try {
      setSaving(true);
      setError(null);

      const { error: insertError } = await supabase!
        .from('zone_members')
        .insert({
          zone_id: id,
          member_id: memberId,
          position: selectedPosition,
          is_active: true
        });

      if (insertError) throw insertError;

      setShowAddMemberModal(false);
      setSelectedPosition('member');
      setSearchQuery('');
      fetchZoneData();
      fetchFinancialData();
    } catch (err: any) {
      console.error('Error adding member:', err);
      setError(err.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMemberPosition = async (zoneMemberId: string, newPosition: string) => {
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('zone_members')
        .update({ position: newPosition })
        .eq('id', zoneMemberId);

      if (error) throw error;

      await fetchZoneData();
      setShowEditMember(false);
      setSelectedMember(null);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update member position');
    }
  };

  const handleRemoveMember = async (zoneMemberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the zone?')) {
      return;
    }
    
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('zone_members')
        .update({ is_active: false })
        .eq('id', zoneMemberId);

      if (error) throw error;

      await fetchZoneData();
      await fetchFinancialData();
      
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const getPositionBadge = (position: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      leader: 'success',
      assistant_leader: 'info',
      secretary: 'info',
      treasurer: 'warning',
      member: 'default',
    };
    
    const icons: Record<string, any> = {
      leader: Crown,
      assistant_leader: UserCheck,
      secretary: Edit,
      treasurer: DollarSign,
      member: Users,
    };

    const Icon = icons[position] || Users;
    const displayName = position.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return (
      <Badge variant={variants[position] || 'default'}>
        <Icon className="h-3 w-3 mr-1 inline" />
        {displayName}
      </Badge>
    );
  };

  // Group members by position
  const leadershipMembers = members.filter(m => m.member && ['leader', 'assistant_leader', 'secretary', 'treasurer'].includes(m.position));
  const regularMembers = members.filter(m => m.member && m.position === 'member');
  
  // Calculate member age distribution
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const membersByAge = members.reduce((acc, m) => {
    if (m.member?.date_of_birth) {
      const age = calculateAge(m.member.date_of_birth);
      if (age >= 15 && age <= 35) acc.youth++;
      else if (age >= 36 && age <= 60) acc.adults++;
      else if (age > 60) acc.seniors++;
    } else {
      // Estimate if no DOB
      acc.adults++;
    }
    return acc;
  }, { youth: 0, adults: 0, seniors: 0 });

  // If no members have DOB, use estimation
  if (members.length > 0 && membersByAge.youth === 0 && membersByAge.adults === 0 && membersByAge.seniors === 0) {
    membersByAge.youth = Math.floor(members.length * 0.35);
    membersByAge.adults = Math.floor(members.length * 0.50);
    membersByAge.seniors = Math.ceil(members.length * 0.15);
  }

  const filteredAvailableMembers = availableMembers.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           member.phone.includes(searchQuery);
  });

  if (!user && !authLoading) {
    return null;
  }

  // Styling variables
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <TopNavbar 
        title={zone?.name || 'Zone Dashboard'}
        subtitle={`${zone?.swahili_name ? zone.swahili_name + ' - ' : ''}Zone Management`}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="lg:ml-20 p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 sm:mb-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Card variant="default">
            <CardBody className="p-8 sm:p-12">
              <Loading text="Loading zone dashboard..." />
            </CardBody>
          </Card>
        ) : !zone ? (
          <Card variant="default">
            <CardBody className="p-8 sm:p-12">
              <EmptyState
                icon={<MapPin className="h-12 w-12" />}
                title="Zone not found"
                description="The zone you're looking for doesn't exist"
                action={{
                  label: 'Go to Zones',
                  onClick: () => router.push('/zones')
                }}
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {!mounted ? (
              <Card variant="default">
                <CardBody className="p-8 sm:p-12">
                  <Loading text="Loading zone dashboard..." />
                </CardBody>
              </Card>
            ) : (
              <>
            {/* MOBILE VIEW - Separate optimized layout for mobile */}
            <div className="block lg:hidden space-y-3">
              {/* Mobile Header with Back Button and Add Button */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => router.push('/zones')}
                  className={`flex items-center gap-2 ${textSecondary} hover:${textPrimary} transition-colors`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Zones</span>
                </button>
                <button
                  onClick={() => {
                    fetchAvailableMembers();
                    setShowAddMemberModal(true);
                  }}
                  className="flex items-center justify-center bg-blue-800 hover:bg-blue-900 text-white p-2 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Stats Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-2">
                {/* Total Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <Users className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-1`}>Total Members</p>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {members.length}
                  </h3>
                </div>

                {/* Leadership Team Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <Crown className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-1`}>Leadership</p>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {leadershipMembers.length}
                  </h3>
                </div>

                {/* Active Members Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <UserCheck className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-1`}>Active Members</p>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {members.filter(m => m.member && m.member.status === 'active').length}
                  </h3>
                </div>

                {/* Zone Income Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-xl p-3 shadow-sm`}>
                  <div className={`inline-flex p-2 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-lg mb-2`}>
                    <DollarSign className={`h-4 w-4 ${darkMode ? 'text-white' : 'text-cyan-600'}`} />
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-1`}>Total Income</p>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {financialData.totalZoneIncome >= 1000000 
                      ? `TZS ${(financialData.totalZoneIncome / 1000000).toFixed(1)}M`
                      : `TZS ${(financialData.totalZoneIncome / 1000).toFixed(0)}K`}
                  </h3>
                </div>
              </div>

              {/* Mobile Members by Age Distribution - Simplified */}
              <Card variant="default">
                <CardBody className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-bold ${textPrimary}`}>Members by Age</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-cyan-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span className="text-xs text-gray-700">Youth (0-25)</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {membersByAge.youth} ({members.length > 0 ? Math.round((membersByAge.youth / members.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-700">Adults (26-59)</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {membersByAge.adults} ({members.length > 0 ? Math.round((membersByAge.adults / members.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs text-gray-700">Seniors (60+)</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {membersByAge.seniors} ({members.length > 0 ? Math.round((membersByAge.seniors / members.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Mobile Zone Members List */}
              <Card variant="default">
                <CardBody className="p-3">
                  <h2 className={`text-sm font-bold ${textPrimary} mb-3`}>Zone Members</h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.slice(0, 5).map((zm) => (
                      <div 
                        key={zm.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => zm.member && router.push(`/members/${zm.member.id}`)}
                      >
                        <Avatar
                          src={zm.member?.photo_url}
                          alt={`${zm.member?.first_name} ${zm.member?.last_name}`}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${textPrimary} truncate`}>
                            {zm.member?.first_name} {zm.member?.last_name}
                          </p>
                          <p className={`text-[10px] ${textSecondary} truncate`}>
                            {zm.member?.phone}
                          </p>
                        </div>
                        <Badge variant={zm.member?.status === 'active' ? 'success' : 'default'} dot>
                          {zm.member?.status}
                        </Badge>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="text-center py-6">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No members yet</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* DESKTOP VIEW - Original layout for desktop */}
            <div className="hidden lg:block">
              {/* Desktop Header with Back Button and Add Button */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => router.push('/zones')}
                  className={`flex items-center gap-2 ${textSecondary} hover:${textPrimary} transition-colors`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Zones</span>
                </button>
                <button
                  onClick={() => {
                    fetchAvailableMembers();
                    setShowAddMemberModal(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <span>Add Member</span>
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Left Column - Stats and Charts */}
              <div className="col-span-1 lg:col-span-7 space-y-4 sm:space-y-6">
                {/* Stats Cards Grid - 2x2 on mobile */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6">
                  {/* Total Members Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm`}>
                    <div className={`inline-flex p-2 sm:p-4 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-lg sm:rounded-2xl mb-2 sm:mb-4`}>
                      <Users className={`h-4 w-4 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <p className={`text-[10px] sm:text-sm ${darkMode ? 'text-blue-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Total Members</p>
                    <h3 className={`text-xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {members.length}
                    </h3>
                  </div>

                  {/* Leadership Team Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm`}>
                    <div className={`inline-flex p-2 sm:p-4 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-lg sm:rounded-2xl mb-2 sm:mb-4`}>
                      <Crown className={`h-4 w-4 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                    </div>
                    <p className={`text-[10px] sm:text-sm ${darkMode ? 'text-purple-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Leadership</p>
                    <h3 className={`text-xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {leadershipMembers.length}
                    </h3>
                  </div>

                  {/* Active Members Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm`}>
                    <div className={`inline-flex p-2 sm:p-4 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-lg sm:rounded-2xl mb-2 sm:mb-4`}>
                      <UserCheck className={`h-4 w-4 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <p className={`text-[10px] sm:text-sm ${darkMode ? 'text-green-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Active Members</p>
                    <h3 className={`text-xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {members.filter(m => m.member && m.member.status === 'active').length}
                    </h3>
                  </div>

                  {/* Zone Income Card */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm`}>
                    <div className={`inline-flex p-2 sm:p-4 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-lg sm:rounded-2xl mb-2 sm:mb-4`}>
                      <DollarSign className={`h-4 w-4 sm:h-7 sm:w-7 ${darkMode ? 'text-white' : 'text-cyan-600'}`} />
                    </div>
                    <p className={`text-[10px] sm:text-sm ${darkMode ? 'text-cyan-100' : 'text-gray-600'} mb-1 sm:mb-2`}>Total Income</p>
                    <h3 className={`text-lg sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {financialData.totalZoneIncome >= 1000000 
                        ? `TZS ${(financialData.totalZoneIncome / 1000000).toFixed(1)}M`
                        : `TZS ${(financialData.totalZoneIncome / 1000).toFixed(0)}K`}
                    </h3>
                  </div>
                </div>

                {/* Members by Age Distribution Chart */}
                <div className={`${cardBg} rounded-xl sm:rounded-3xl p-3 sm:p-6 md:p-8 border ${borderColor} shadow-sm`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-8">
                    <h3 className={`text-base sm:text-xl md:text-2xl font-bold ${textPrimary}`}>Members by Age</h3>
                    <select className={`px-3 sm:px-6 py-1.5 sm:py-2.5 ${inputBg} ${textSecondary} border ${borderColor} rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto`}>
                      <option>All Time</option>
                      <option>This Year</option>
                    </select>
                  </div>

                  <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 lg:gap-8">
                    {/* Left side - Total Members */}
                    <div className="flex-shrink-0 text-center lg:text-left w-full lg:w-auto">
                      <p className={`text-xs sm:text-sm ${textSecondary} mb-2 sm:mb-3`}>Total Members</p>
                      <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${textPrimary}`}>
                        {`${members.length.toLocaleString()} People`}
                      </p>
                    </div>

                    {/* Right side - Donut Chart and Legend */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 lg:gap-12 w-full lg:w-auto">
                      {/* Donut Chart */}
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const totalMembers = members.length;
                          if (totalMembers === 0) {
                            return (
                              <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] flex items-center justify-center">
                                <p className={textSecondary}>No data</p>
                              </div>
                            );
                          }

                          const youthRatio = membersByAge.youth / totalMembers;
                          const adultsRatio = membersByAge.adults / totalMembers;
                          const seniorsRatio = membersByAge.seniors / totalMembers;

                          return (
                            <svg className="transform -rotate-90 w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px]" viewBox="0 0 200 200">
                              <defs>
                                <linearGradient id="zoneMemberGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                                </linearGradient>
                                <linearGradient id="zoneMemberGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                                </linearGradient>
                                <linearGradient id="zoneMemberGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                                </linearGradient>
                              </defs>
                              
                              {/* Background circle */}
                              <circle
                                cx="100"
                                cy="100"
                                r="75"
                                fill="none"
                                stroke={darkMode ? '#1f2937' : '#f5f5f5'}
                                strokeWidth="28"
                              />
                              
                              {/* Youth segment (Cyan) */}
                              {youthRatio > 0 && (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="80"
                                  fill="none"
                                  stroke="url(#zoneMemberGradient1)"
                                  strokeWidth="32"
                                  strokeDasharray={`${2 * Math.PI * 80 * youthRatio} ${2 * Math.PI * 80 * (1 - youthRatio)}`}
                                  strokeLinecap="butt"
                                />
                              )}
                              
                              {/* Adults segment (Blue) */}
                              {adultsRatio > 0 && (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="72"
                                  fill="none"
                                  stroke="url(#zoneMemberGradient2)"
                                  strokeWidth="20"
                                  strokeDasharray={`${2 * Math.PI * 72 * adultsRatio} ${2 * Math.PI * 72 * (1 - adultsRatio)}`}
                                  strokeDashoffset={`${-2 * Math.PI * 72 * youthRatio}`}
                                  strokeLinecap="butt"
                                />
                              )}
                              
                              {/* Seniors segment (Red) */}
                              {seniorsRatio > 0 && (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="76"
                                  fill="none"
                                  stroke="url(#zoneMemberGradient3)"
                                  strokeWidth="28"
                                  strokeDasharray={`${2 * Math.PI * 76 * seniorsRatio} ${2 * Math.PI * 76 * (1 - seniorsRatio)}`}
                                  strokeDashoffset={`${-2 * Math.PI * 76 * (youthRatio + adultsRatio)}`}
                                  strokeLinecap="butt"
                                />
                              )}
                            </svg>
                          );
                        })()}
                        
                        {/* Center text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                          <p className={`text-[10px] sm:text-xs ${textSecondary} mb-0.5 sm:mb-1`}>Active</p>
                          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">100%</p>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-col space-y-3 sm:space-y-4 w-full sm:w-auto">
                        <div className="flex items-center justify-between space-x-4 sm:space-x-6">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-cyan-400 flex-shrink-0"></div>
                            <span className={`text-xs sm:text-sm ${textSecondary}`}>Youth (15-35)</span>
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                            {`${membersByAge.youth} (${members.length > 0 ? Math.round((membersByAge.youth / members.length) * 100) : 0}%)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between space-x-4 sm:space-x-6">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-blue-600 flex-shrink-0"></div>
                            <span className={`text-xs sm:text-sm ${textSecondary}`}>Adults (36-60)</span>
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                            {`${membersByAge.adults} (${members.length > 0 ? Math.round((membersByAge.adults / members.length) * 100) : 0}%)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between space-x-4 sm:space-x-6">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-red-500 flex-shrink-0"></div>
                            <span className={`text-xs sm:text-sm ${textSecondary}`}>Seniors (61+)</span>
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                            {`${membersByAge.seniors} (${members.length > 0 ? Math.round((membersByAge.seniors / members.length) * 100) : 0}%)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Offerings Chart */}
                <div className={`${cardBg} rounded-3xl p-3 sm:p-6 border ${borderColor} shadow-sm`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className={`text-sm sm:text-xl font-bold ${textPrimary}`}>Weekly Offerings</h3>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-gray-300"></div>
                        <span className={`text-[10px] sm:text-xs ${textSecondary}`}>Target</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-blue-600"></div>
                        <span className={`text-[10px] sm:text-xs ${textSecondary}`}>Actual</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-8">
                    <div>
                      <p className={`text-[10px] sm:text-xs ${textSecondary} mb-1`}>Total Income</p>
                      <p className={`text-base sm:text-2xl font-bold ${textPrimary}`}>
                        {`TZS ${(financialData.totalZoneIncome / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[10px] sm:text-xs ${textSecondary} mb-1`}>Monthly Income</p>
                      <p className={`text-base sm:text-2xl font-bold ${textPrimary}`}>
                        {`TZS ${(financialData.monthlyZoneIncome / 1000).toFixed(0)}k`}
                      </p>
                    </div>
                    <div className={`${darkMode ? 'bg-blue-600' : 'bg-blue-50'} px-4 sm:px-6 py-2 sm:py-3 rounded-xl`}>
                      <p className={`text-base sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                        {`${Math.max(...(financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)) || [0]))}K`}
                      </p>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="relative" style={{ height: '140px' }}>
                    {/* Floating label above highest bar */}
                    {financialData.weeklyOfferings.length > 0 && (
                      <div className="absolute top-0 left-[62%] transform -translate-x-1/2 bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-lg z-10">
                        <p className="text-white text-[10px] sm:text-sm font-bold">
                          {Math.max(...financialData.weeklyOfferings.map(w => Math.round(w.amount / 1000)), 0)}K
                        </p>
                      </div>
                    )}

                    {/* Bar Chart Container */}
                    <div className="h-full flex items-end justify-between gap-2 sm:gap-4 pt-8 sm:pt-10">
                      {(financialData.weeklyOfferings.length > 0 ? financialData.weeklyOfferings : [
                        { week: 'W1', amount: 0, label: '01' },
                        { week: 'W2', amount: 0, label: '02' },
                        { week: 'W3', amount: 0, label: '03' },
                        { week: 'W4', amount: 0, label: '04' },
                        { week: 'W5', amount: 0, label: '05' },
                        { week: 'W6', amount: 0, label: '06' },
                        { week: 'W7', amount: 0, label: '07' },
                        { week: 'W8', amount: 0, label: '08' }
                      ]).map((bar, idx) => {
                        const maxAmount = Math.max(...financialData.weeklyOfferings.map(w => w.amount), 1);
                        const height = Math.max((bar.amount / maxAmount) * 120, 10);
                        const forecastHeight = Math.max(height * 0.9, 8);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            {/* Bar Group */}
                            <div className="w-full flex items-end justify-center gap-1">
                              {/* Actual Bar (Dark Blue) */}
                              <div 
                                className="flex-1 bg-blue-600 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-blue-700"
                                style={{ height: `${height}px` }}
                                title={`Week ${idx + 1}: TZS ${bar.amount.toLocaleString()}`}
                              ></div>
                              {/* Target Bar (Light Gray) */}
                              <div 
                                className="flex-1 bg-gray-300 rounded-t-md transition-all duration-200 cursor-pointer hover:bg-gray-400"
                                style={{ height: `${forecastHeight}px` }}
                              ></div>
                            </div>
                            {/* Label */}
                            <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${textSecondary}`}>{bar.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Leadership and Members */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                {/* Leadership Team */}
                {leadershipMembers.length > 0 && (
                  <Card variant="default">
                    <CardBody className="p-3 sm:p-6">
                      <h2 className={`text-sm sm:text-xl font-bold ${textPrimary} mb-4 sm:mb-6 flex items-center`}>
                        <Crown className="h-4 w-4 sm:h-6 sm:w-6 mr-2 text-yellow-600" />
                        Zone Leadership
                      </h2>

                      <div className="grid grid-cols-1 gap-2 sm:gap-4">
                        {leadershipMembers.map((zm) => (
                          <div
                            key={zm.id}
                            className={`bg-gradient-to-br from-gray-50 to-white border ${borderColor} rounded-lg p-2 sm:p-4 hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar
                                src={zm.member?.photo_url}
                                alt={`${zm.member?.first_name} ${zm.member?.last_name}`}
                                size="md"
                              />
                              <div className="flex-1">
                                <h3 className={`font-bold ${textPrimary}`}>
                                  {zm.member?.first_name} {zm.member?.last_name}
                                </h3>
                                <p className={`text-xs ${textSecondary} mb-2`}>
                                  {zm.member?.member_number}
                                </p>
                                {getPositionBadge(zm.position)}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedMember(zm);
                                    setShowEditMember(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                                  title="Edit Position"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(zm.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                  title="Remove from Zone"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Members Statistics */}
                <Card variant="default">
                  <CardBody className="p-3 sm:p-6">
                    <h2 className={`text-sm sm:text-xl font-bold ${textPrimary} mb-3 sm:mb-4 flex items-center`}>
                      <Users className="h-4 w-4 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                      Members Overview
                    </h2>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-base text-gray-700 font-medium">Total Members</span>
                        <span className="text-base sm:text-2xl font-bold text-blue-600">{members.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                        <span className="text-xs sm:text-base text-gray-700 font-medium">Active Members</span>
                        <span className="text-base sm:text-2xl font-bold text-green-600">
                          {members.filter(m => m.member && m.member.status === 'active').length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg">
                        <span className="text-xs sm:text-base text-gray-700 font-medium">Leadership</span>
                        <span className="text-base sm:text-2xl font-bold text-purple-600">{leadershipMembers.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 rounded-lg">
                        <span className="text-xs sm:text-base text-gray-700 font-medium">Regular Members</span>
                        <span className="text-base sm:text-2xl font-bold text-orange-600">{regularMembers.length}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Recent Members */}
                <Card variant="default">
                  <CardBody className="p-3 sm:p-6">
                    <h2 className={`text-sm sm:text-xl font-bold ${textPrimary} mb-3 sm:mb-4`}>Zone Members</h2>
                    
                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {members.slice(0, 10).map((zm) => (
                        <div 
                          key={zm.id}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => zm.member && router.push(`/members/${zm.member.id}`)}
                        >
                          <Avatar
                            src={zm.member?.photo_url}
                            alt={`${zm.member?.first_name} ${zm.member?.last_name}`}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${textPrimary} truncate`}>
                              {zm.member?.first_name} {zm.member?.last_name}
                            </p>
                            <p className={`text-xs ${textSecondary} truncate`}>
                              {zm.member?.phone}
                            </p>
                          </div>
                          <Badge variant={zm.member?.status === 'active' ? 'success' : 'default'} dot>
                            {zm.member?.status}
                          </Badge>
                        </div>
                      ))}
                      
                      {members.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className={textSecondary}>No members yet</p>
                          <button
                            onClick={() => {
                              fetchAvailableMembers();
                              setShowAddMemberModal(true);
                            }}
                            className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            Add First Member
                          </button>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
            </div>
            </>
            )}
          </>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Add Member to Zone</h3>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {positions.map((pos) => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {filteredAvailableMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No members found matching your search' : 'No available members to add'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {member.photo_url ? (
                              <img src={member.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.first_name} {member.last_name}</p>
                            <p className="text-sm text-gray-500">{member.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(member.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditMember && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Edit Member Position
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Member: <strong>{selectedMember.member?.first_name} {selectedMember.member?.last_name}</strong>
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      id="edit-position-select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={selectedMember.position}
                    >
                      {positions.map((pos) => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowEditMember(false);
                      setSelectedMember(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const positionSelect = document.getElementById('edit-position-select') as HTMLSelectElement;
                      handleUpdateMemberPosition(selectedMember.id, positionSelect.value);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update Position
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

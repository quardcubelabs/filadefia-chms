'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import MainLayout from '@/components/MainLayout';
import MemberForm from '@/components/MemberForm';
import CSVImport from '@/components/CSVImport';
import BulkCardGenerator from '@/components/BulkCardGenerator';
import { Button, Card, CardBody, Input, Select, Badge, Table, Modal, ConfirmModal, Avatar, EmptyState, Loading, Alert } from '@/components/ui';
import { Users, Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, Phone, Mail, MapPin, Calendar, Briefcase, CreditCard } from 'lucide-react';

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: 'male' | 'female';
  date_of_birth: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  phone: string;
  email?: string;
  address: string;
  occupation?: string;
  employer?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  baptism_date?: string;
  status: 'active' | 'visitor' | 'transferred' | 'inactive';
  membership_date: string;
  photo_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default function MembersPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const { 
    departmentId, 
    departmentName, 
    isDepartmentLeader, 
    canAccessAllDepartments 
  } = useDepartmentAccess();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkCardModal, setShowBulkCardModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMemberDepartments, setSelectedMemberDepartments] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch members from Supabase
  useEffect(() => {
    if (supabase) {
      fetchMembers();
    }
  }, [supabase]);

  // Load member's department assignments
  const loadMemberDepartments = async (memberId: string) => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('department_members')
        .select('department_id')
        .eq('member_id', memberId)
        .eq('is_active', true);

      if (error) throw error;
      
      const departmentIds = data?.map((d: any) => d.department_id) || [];
      setSelectedMemberDepartments(departmentIds);
      return departmentIds;
    } catch (error) {
      console.error('Error loading member departments:', error);
      return [];
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching members from database...');
      
      if (!supabase) return;
      let query = supabase
        .from('members')
        .select('*, department_members(department_id, departments(name))')
        .order('member_number', { ascending: false });

      // Apply department filtering for department leaders
      if (isDepartmentLeader && departmentId) {
        query = query.eq('department_members.department_id', departmentId);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Members fetched successfully:', data?.length || 0, 'members');
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  // Generate next member number
  const generateMemberNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    if (!supabase) return `FCC-${year}-001`;
    const { data, error } = await supabase
      .from('members')
      .select('member_number')
      .like('member_number', `FCC-${year}-%`)
      .order('member_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating member number:', error);
      return `FCC-${year}-001`;
    }

    if (!data || data.length === 0) {
      return `FCC-${year}-001`;
    }

    const lastNumber = parseInt(data[0].member_number.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `FCC-${year}-${nextNumber}`;
  };

  // Add new member
  const handleAddMember = async (formData: any) => {
    try {
      setSubmitting(true);
      setError(null);

      console.log('Starting member creation...', formData);

      // Check if supabase is available
      if (!supabase) {
        throw new Error('Database connection not available. Please refresh the page.');
      }

      // Validate required fields according to database schema
      const requiredFields = {
        first_name: 'First name',
        last_name: 'Last name',
        gender: 'Gender',
        date_of_birth: 'Date of birth',
        marital_status: 'Marital status',
        phone: 'Phone number',
        address: 'Address',
        emergency_contact_name: 'Emergency contact name',
        emergency_contact_phone: 'Emergency contact phone',
      };

      // Check each required field
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          throw new Error(`${label} is required`);
        }
      }

      // Validate gender value
      if (!['male', 'female'].includes(formData.gender)) {
        throw new Error('Please select a valid gender');
      }

      // Validate marital status value
      if (!['single', 'married', 'divorced', 'widowed'].includes(formData.marital_status)) {
        throw new Error('Please select a valid marital status');
      }

      console.log('Generating member number...');
      const memberNumber = await generateMemberNumber();
      console.log('Generated member number:', memberNumber);
      
      // Prepare member data according to database schema
      const memberData = {
        member_number: memberNumber,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        middle_name: formData.middle_name?.trim() || null,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        marital_status: formData.marital_status,
        phone: formData.phone.trim(),
        email: formData.email?.trim() || null,
        address: formData.address.trim(),
        occupation: formData.occupation?.trim() || null,
        employer: formData.employer?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        baptism_date: formData.baptism_date || null,
        membership_date: formData.membership_date || new Date().toISOString().split('T')[0],
        status: formData.status || 'active',
        photo_url: formData.photo_url?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      console.log('Inserting member into database...', memberData);

      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to add member to database');
      }

      console.log('Member added successfully:', data);
      
      // Step 2: Add department assignments if any
      if (formData.department_ids && formData.department_ids.length > 0) {
        console.log('Adding department assignments...', formData.department_ids);
        
        const departmentAssignments = formData.department_ids.map((deptId: string) => ({
          member_id: data.id,
          department_id: deptId,
          position: 'member', // default position
          joined_date: new Date().toISOString().split('T')[0],
          is_active: true,
        }));

        const { error: deptError } = await supabase
          .from('department_members')
          .insert(departmentAssignments);

        if (deptError) {
          console.error('Error adding department assignments:', deptError);
          // Don't throw error, just log it - member was created successfully
          alert(`Member added but some department assignments failed: ${deptError.message}`);
        } else {
          console.log('Department assignments added successfully');
        }
      }
      
      // Refresh the members list to get the latest data
      await fetchMembers();
      
      setShowAddModal(false);
      setSelectedMember(null);
      
      // Show success message
      alert('Member added successfully!');
    } catch (err: any) {
      console.error('Error adding member:', err);
      setError(err.message || 'Failed to add member');
      alert(`Error: ${err.message || 'Failed to add member'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Update member
  const handleUpdateMember = async (formData: any) => {
    if (!selectedMember) return;

    try {
      setSubmitting(true);
      setError(null);

      // Clean up form data - convert empty strings to null for optional fields
      const cleanedData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        middle_name: formData.middle_name?.trim() || null,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        marital_status: formData.marital_status,
        phone: formData.phone.trim(),
        email: formData.email?.trim() || null,
        address: formData.address.trim(),
        occupation: formData.occupation?.trim() || null,
        employer: formData.employer?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        baptism_date: formData.baptism_date || null,
        membership_date: formData.membership_date,
        status: formData.status,
        photo_url: formData.photo_url || null,
        notes: formData.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (!supabase) return;
      const { data, error } = await supabase
        .from('members')
        .update(cleanedData)
        .eq('id', selectedMember.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to update member');
      }

      console.log('Member updated successfully:', data);
      
      // Step 2: Update department assignments
      if (formData.department_ids !== undefined) {
        console.log('Updating department assignments...');
        
        // First, remove all existing department assignments
        if (!supabase) return;
        const { error: deleteError } = await supabase
          .from('department_members')
          .delete()
          .eq('member_id', selectedMember.id);

        if (deleteError) {
          console.error('Error removing old department assignments:', deleteError);
        }

        // Then, add new department assignments
        if (formData.department_ids.length > 0) {
          const departmentAssignments = formData.department_ids.map((deptId: string) => ({
            member_id: selectedMember.id,
            department_id: deptId,
            position: 'member',
            joined_date: new Date().toISOString().split('T')[0],
            is_active: true,
          }));

          if (!supabase) return;
          const { error: insertError } = await supabase
            .from('department_members')
            .insert(departmentAssignments);

          if (insertError) {
            console.error('Error adding new department assignments:', insertError);
          } else {
            console.log('Department assignments updated successfully');
          }
        }
      }
      
      // Refresh the members list
      await fetchMembers();
      
      setShowEditModal(false);
      setSelectedMember(null);
      
      alert('Member updated successfully!');
    } catch (err: any) {
      console.error('Error updating member:', err);
      setError(err.message || 'Failed to update member');
      alert(`Error: ${err.message || 'Failed to update member'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete member
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setSubmitting(true);
      setError(null);

      if (!supabase) return;
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      console.log('Member deleted successfully');
      
      // Refresh the members list
      await fetchMembers();
      
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      
      alert('Member deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting member:', err);
      setError(err.message || 'Failed to delete member');
      alert(`Error: ${err.message || 'Failed to delete member'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Member Number', 'First Name', 'Last Name', 'Phone', 'Email', 'Status', 'Membership Date'];
    const csvData = filteredMembers.map(m => [
      m.member_number,
      m.first_name,
      m.last_name,
      m.phone,
      m.email || '',
      m.status,
      m.membership_date,
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fcc-members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Import from CSV
  const handleCSVImport = async (parsedMembers: any[]) => {
    const results = [];

    for (let i = 0; i < parsedMembers.length; i++) {
      const memberData = parsedMembers[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and array is 0-indexed

      try {
        // Validate required fields
        if (!memberData.first_name || !memberData.last_name) {
          results.push({
            success: false,
            row: rowNumber,
            name: `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim(),
            error: 'Missing required fields: first_name and last_name'
          });
          continue;
        }

        // Generate member number
        const memberNumber = await generateMemberNumber();

        // Insert member
        if (!supabase) continue;
        const { data, error } = await supabase
          .from('members')
          .insert([{
            member_number: memberNumber,
            ...memberData,
            created_by: user!.id,
          }])
          .select()
          .single();

        if (error) throw error;

        results.push({
          success: true,
          row: rowNumber,
          memberNumber: memberNumber,
          name: `${memberData.first_name} ${memberData.last_name}`
        });

        // Add to local state
        setMembers(prev => [data, ...prev]);

      } catch (err: any) {
        results.push({
          success: false,
          row: rowNumber,
          name: `${memberData.first_name} ${memberData.last_name}`,
          error: err.message || 'Failed to import'
        });
      }
    }

    return results;
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.member_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    visitors: members.filter(m => m.status === 'visitor').length,
    newThisMonth: members.filter(m => {
      const memberDate = new Date(m.membership_date);
      const now = new Date();
      return memberDate.getMonth() === now.getMonth() && memberDate.getFullYear() === now.getFullYear();
    }).length,
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

  // Don't return early - render the layout with loading state instead
  if (!user && !authLoading) {
    return null;
  }

  const title = 'Members Management';
    
  const subtitle = isDepartmentLeader && departmentName
    ? `Manage members within ${departmentName} department`
    : 'Manage church members, visitors, and their information';

  return (
    <MainLayout 
      title={title}
      subtitle={subtitle}
    >


      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card variant="default" padding="sm" rounded="xl">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Members</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.total}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="sm" rounded="xl">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Members</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.active}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="sm" rounded="xl">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Visitors</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mt-0.5 sm:mt-1">{stats.visitors}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="sm" rounded="xl">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">New This Month</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mt-0.5 sm:mt-1">{stats.newThisMonth}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Actions & Filters */}
        <Card variant="default" className="mb-4 sm:mb-6" padding="sm" rounded="xl">
          <CardBody>
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search and Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="w-full sm:flex-1">
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
                    fullWidth
                  />
                </div>

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'visitor', label: 'Visitor' },
                    { value: 'transferred', label: 'Transferred' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </div>

              {/* Action Buttons - Scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={filteredMembers.length === 0}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkCardModal(true)}
                  disabled={filteredMembers.length === 0}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <CreditCard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print Cards</span>
                </Button>
                <Button onClick={() => setShowAddModal(true)} size="sm" className="flex-shrink-0 ml-auto sm:ml-0">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Member</span>
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Members Table */}
        <Card variant="default">
          <CardBody className="p-6">
            {loading ? (
              <Loading />
            ) : filteredMembers.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No members found"
                description={searchQuery || statusFilter !== 'all' ? "Try adjusting your search or filters" : "Get started by adding your first member"}
                action={{
                  label: 'Add Member',
                  onClick: () => setShowAddModal(true),
                  icon: <Plus className="h-4 w-4" />,
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Member #</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(member => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-gray-900">{member.member_number}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={member.photo_url}
                              alt={`${member.first_name} ${member.last_name}`}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
                              </p>
                              {member.email && (
                                <p className="text-sm text-gray-500">{member.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {member.phone}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(member.membership_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/members/${member.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                setSelectedMember(member);
                                const deptIds = await loadMemberDepartments(member.id);
                                setSelectedMemberDepartments(deptIds || []);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setMemberToDelete(member);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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

        {/* Add Member Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Member"
          size="lg"
        >
          <MemberForm
            onSubmit={handleAddMember}
            onCancel={() => setShowAddModal(false)}
            loading={submitting}
          />
        </Modal>

        {/* Edit Member Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
            setSelectedMemberDepartments([]);
          }}
          title="Edit Member"
          size="lg"
        >
          {selectedMember && (
            <MemberForm
              initialData={{
                ...selectedMember,
                department_ids: selectedMemberDepartments
              }}
              onSubmit={handleUpdateMember}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedMember(null);
                setSelectedMemberDepartments([]);
              }}
              isEditing
              loading={submitting}
            />
          )}
        </Modal>

        {/* View Member Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedMember(null);
          }}
          title="Member Details"
          size="md"
        >
          {selectedMember && (
            <div className="space-y-6">
              {/* Member Photo & Basic Info */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                <Avatar
                  src={selectedMember.photo_url}
                  alt={`${selectedMember.first_name} ${selectedMember.last_name}`}
                  size="xl"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedMember.first_name} {selectedMember.middle_name && `${selectedMember.middle_name} `}{selectedMember.last_name}
                  </h3>
                  <p className="text-gray-600 font-mono">{selectedMember.member_number}</p>
                  <div className="mt-2">
                    {getStatusBadge(selectedMember.status)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{selectedMember.phone}</span>
                  </div>
                  {selectedMember.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{selectedMember.email}</span>
                    </div>
                  )}
                  <div className="flex items-start text-gray-600">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                    <span>{selectedMember.address}</span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-gray-900">{new Date(selectedMember.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="text-gray-900 capitalize">{selectedMember.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Marital Status</p>
                    <p className="text-gray-900 capitalize">{selectedMember.marital_status}</p>
                  </div>
                  {selectedMember.occupation && (
                    <div>
                      <p className="text-sm text-gray-500">Occupation</p>
                      <p className="text-gray-900">{selectedMember.occupation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Membership Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">Membership Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Membership Date</p>
                    <p className="text-gray-900">{new Date(selectedMember.membership_date).toLocaleDateString()}</p>
                  </div>
                  {selectedMember.baptism_date && (
                    <div>
                      <p className="text-sm text-gray-500">Baptism Date</p>
                      <p className="text-gray-900">{new Date(selectedMember.baptism_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedMember.emergency_contact_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">Emergency Contact</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-gray-900">{selectedMember.emergency_contact_name}</p>
                    </div>
                    {selectedMember.emergency_contact_phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{selectedMember.emergency_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedMember.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">Notes</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedMember.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedMember(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setMemberToDelete(null);
          }}
          onConfirm={handleDeleteMember}
          title="Delete Member"
          message={`Are you sure you want to delete ${memberToDelete?.first_name} ${memberToDelete?.last_name}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={submitting}
        />

        {/* CSV Import Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Members from CSV"
          size="xl"
        >
          <CSVImport
            onImport={handleCSVImport}
            onClose={() => setShowImportModal(false)}
          />
        </Modal>

        {/* Bulk Card Generator Modal */}
        <Modal
          isOpen={showBulkCardModal}
          onClose={() => setShowBulkCardModal(false)}
          title="Generate Membership Cards"
          size="lg"
        >
          <BulkCardGenerator
            members={filteredMembers}
            onClose={() => setShowBulkCardModal(false)}
          />
        </Modal>
    </MainLayout>
  );
}

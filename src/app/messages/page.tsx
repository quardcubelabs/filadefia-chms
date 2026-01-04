'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import MainLayout from '@/components/MainLayout';
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select, 
  Badge, 
  Modal, 
  ConfirmModal, 
  EmptyState, 
  Loading, 
  Alert,
  TextArea
} from '@/components/ui';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Send,
  Users,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Megaphone,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  is_active: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  department_id?: string;
  zone_id?: string;
  priority: 'low' | 'medium' | 'high';
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
  department?: {
    name: string;
  };
}

interface Communication {
  id: string;
  recipient_ids: string[];
  message: string;
  type: 'sms' | 'email' | 'whatsapp';
  subject?: string;
  sent_by: string;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduled_at?: string;
  cost: number;
  sender?: {
    first_name: string;
    last_name: string;
  };
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  member_number: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase, signOut } = useAuth();
  const { isDepartmentLeader, departmentId, departmentName } = useDepartmentAccess();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'announcements' | 'communications'>('announcements');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  
  // Form data for announcements
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    department_id: '',
    zone_id: '',
    priority: 'medium' as Announcement['priority'],
    expires_at: ''
  });

  // Form data for communications
  const [communicationForm, setCommunicationForm] = useState({
    type: 'sms' as Communication['type'],
    subject: '',
    message: '',
    recipient_type: 'all', // all, department, individual
    department_id: '',
    selected_members: [] as string[],
    scheduled_at: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, activeTab]);

  const loadData = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      
      if (activeTab === 'announcements') {
        await loadAnnouncements();
      } else {
        await loadCommunications();
      }
      
      await loadDepartments();
      await loadZones();
      await loadMembers();
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    if (!supabase) return;
    
    let announcementsQuery = supabase
      .from('announcements')
      .select(`
        *,
        author:profiles(first_name, last_name),
        department:departments(name)
      `);

    // Filter by department for department leaders
    if (isDepartmentLeader && departmentId) {
      announcementsQuery = announcementsQuery.eq('department_id', departmentId);
    }

    const { data, error } = await announcementsQuery
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAnnouncements(data || []);
  };

  const loadCommunications = async () => {
    if (!supabase) return;
    
    let communicationsQuery = supabase
      .from('communications')
      .select(`
        *,
        sender:profiles(first_name, last_name)
      `);

    // For department leaders, show communications sent by them or to department members
    if (isDepartmentLeader && departmentId && user?.profile?.id) {
      communicationsQuery = communicationsQuery.eq('sent_by', user.profile.id);
    }

    const { data, error } = await communicationsQuery
      .order('sent_at', { ascending: false });

    if (error) throw error;
    setCommunications(data || []);
  };

  const loadDepartments = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err: any) {
      console.error('Error loading departments:', err);
    }
  };

  const loadZones = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setZones(data || []);
    } catch (err: any) {
      console.error('Error loading zones:', err);
    }
  };

  const loadMembers = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, email, member_number')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error loading members:', err);
    }
  };

  const testDatabaseConnection = async () => {
    console.log('Testing basic database connection...');
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      console.log('Database test result:', { data, error });
      return !error;
    } catch (err) {
      console.error('Database connection failed:', err);
      return false;
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!supabase || !user?.profile?.id) {
      setError('User not authenticated or profile missing');
      return;
    }

    // Validate required fields
    if (!announcementForm.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!announcementForm.content.trim()) {
      setError('Content is required');
      return;
    }

    // Test database connection first
    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      setError('Database connection failed. Please check your internet connection and try again.');
      return;
    }

    try {
      // First test if we can read from the announcements table
      console.log('Testing announcements table access...');
      const { data: testData, count, error: testError } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true });
      
      console.log('Announcements table test result:', { 
        count, 
        error: testError,
        hasData: !!testData,
        supabaseUrl: 'configured',
        supabaseKey: 'configured'
      });
      
      if (testError) {
        console.error('Cannot access announcements table:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        throw new Error(`Database access error: ${testError.message || testError.details || 'Unknown database error'}`);
      }

      const announcementData = {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        author_id: user.profile.id,
        department_id: isDepartmentLeader ? departmentId : (announcementForm.department_id || null),
        zone_id: announcementForm.zone_id || null,
        priority: announcementForm.priority,
        expires_at: announcementForm.expires_at ? new Date(announcementForm.expires_at).toISOString() : null
      };

      console.log('Inserting announcement data:', announcementData);

      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw new Error(error.message || error.details || 'Database operation failed');
      }

      console.log('Successfully created announcement:', data);

      setSuccess('Announcement created successfully!');
      setIsAnnouncementModalOpen(false);
      setAnnouncementForm({
        title: '',
        content: '',
        department_id: '',
        zone_id: '',
        priority: 'medium',
        expires_at: ''
      });
      loadAnnouncements();
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      console.log('Error type:', typeof err);
      console.log('Error keys:', Object.keys(err || {}));
      console.log('User profile:', user?.profile);
      console.log('Supabase instance:', !!supabase);
      console.log('Announcement data:', {
        title: announcementForm.title,
        content: announcementForm.content,
        author_id: user?.profile?.id,
        department_id: announcementForm.department_id || null,
        priority: announcementForm.priority,
        expires_at: announcementForm.expires_at || null
      });
      
      let errorMessage = 'An error occurred while creating the announcement';
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.details) {
        errorMessage = err.details;
      }
      
      setError(errorMessage);
    }
  };

  const handleSendCommunication = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      let recipientIds: string[] = [];

      if (communicationForm.recipient_type === 'all') {
        recipientIds = members.map(m => m.id);
      } else if (communicationForm.recipient_type === 'department' && communicationForm.department_id) {
        // Get department members
        const { data: deptMembers, error: deptError } = await supabase
          .from('department_members')
          .select('member_id')
          .eq('department_id', communicationForm.department_id)
          .eq('is_active', true);

        if (deptError) throw deptError;
        recipientIds = deptMembers?.map((dm: any) => dm.member_id) || [];
      } else {
        recipientIds = communicationForm.selected_members;
      }

      if (recipientIds.length === 0) {
        setError('Please select at least one recipient.');
        return;
      }

      const communicationData = {
        recipient_ids: recipientIds,
        message: communicationForm.message,
        type: communicationForm.type,
        subject: communicationForm.subject || null,
        sent_by: user.profile.id,
        scheduled_at: communicationForm.scheduled_at || null,
        cost: calculateCost(communicationForm.type, recipientIds.length)
      };

      const { error } = await supabase
        .from('communications')
        .insert(communicationData);

      if (error) throw error;

      setSuccess(`Communication scheduled to ${recipientIds.length} recipients!`);
      setIsCommunicationModalOpen(false);
      setCommunicationForm({
        type: 'sms',
        subject: '',
        message: '',
        recipient_type: 'all',
        department_id: '',
        selected_members: [],
        scheduled_at: ''
      });
      loadCommunications();
    } catch (err: any) {
      console.error('Error sending communication:', err);
      setError(err.message);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!supabase || !selectedItem) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      setSuccess('Announcement deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      loadAnnouncements();
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      setError(err.message);
    }
  };

  const calculateCost = (type: string, recipientCount: number): number => {
    const costs = {
      sms: 50, // TZS per SMS
      email: 0, // Free
      whatsapp: 30 // TZS per WhatsApp message
    };
    return (costs[type as keyof typeof costs] || 0) * recipientCount;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      low: <Info className="h-4 w-4" />,
      medium: <Clock className="h-4 w-4" />,
      high: <AlertTriangle className="h-4 w-4" />
    };
    return icons[priority as keyof typeof icons] || <Info className="h-4 w-4" />;
  };

  const getDeliveryStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-cyan-100 text-cyan-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCommunicationTypeIcon = (type: string) => {
    const icons = {
      sms: <Phone className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      whatsapp: <MessageCircle className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <MessageSquare className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    
    // Department leaders already have filtered announcements from loadAnnouncements
    const matchesDepartment = isDepartmentLeader ? true : (
      filterDepartment === 'all' || 
      (filterDepartment === 'church-wide' && !announcement.department_id) ||
      announcement.department_id === filterDepartment
    );
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && announcement.is_active) ||
                         (filterStatus === 'expired' && announcement.expires_at && new Date(announcement.expires_at) < new Date());
    
    return matchesSearch && matchesPriority && matchesDepartment && matchesStatus;
  });

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <MainLayout
      title="Messages Management"
      subtitle="Manage announcements and member communications"
    >
      <div className="max-w-7xl mx-auto">
        {/* Department Access Notification */}
          {isDepartmentLeader && departmentName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-900">Department Messages: {departmentName}</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      You can view and manage messages and announcements for your department only.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <Alert 
                variant="error" 
                onClose={() => setError(null)}
                className="mb-6"
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert 
                variant="success" 
                onClose={() => setSuccess(null)}
                className="mb-6"
              >
                {success}
              </Alert>
            )}

            {/* Tabs - Same design as image */}
            <div className="mb-4 md:mb-6">
              <nav className="flex space-x-0">
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`relative flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 ${
                    activeTab === 'announcements'
                      ? 'bg-red-100 text-red-600 rounded-tl-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Megaphone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Announcements</span>
                  {activeTab === 'announcements' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('communications')}
                  className={`relative flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 ${
                    activeTab === 'communications'
                      ? 'bg-red-100 text-red-600 rounded-tl-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Sent Messages</span>
                  {activeTab === 'communications' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
              </nav>
            </div>

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <>
                {/* Header with Create Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                    <p className="text-sm text-gray-500">Create and manage church announcements</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setIsAnnouncementModalOpen(true)}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Create Announcement
                  </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-4 md:mb-6">
                  <CardBody className="p-3 md:p-6">
                    <div className={`grid grid-cols-1 ${isDepartmentLeader ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3 md:gap-4`}>
                      <div className="md:col-span-1">
                        <Input
                          placeholder="Search announcements..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          icon={<Search className="h-4 w-4" />}
                        />
                      </div>
                      <Select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        placeholder="Priority"
                        options={[
                          { value: "all", label: "All Priorities" },
                          { value: "low", label: "Low" },
                          { value: "medium", label: "Medium" },
                          { value: "high", label: "High" }
                        ]}
                      />
                      {!isDepartmentLeader && (
                        <Select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          placeholder="Department"
                          options={[
                            // Only show "All Departments" option for non-department leaders
                            ...(!isDepartmentLeader ? [{ value: "all", label: "All Departments" }] : []),
                            { value: "church-wide", label: "Church-wide" },
                            ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                          ]}
                        />
                      )}
                      <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        placeholder="Status"
                        options={[
                          { value: "all", label: "All Status" },
                          { value: "active", label: "Active" },
                          { value: "expired", label: "Expired" }
                        ]}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Announcements List - Desktop */}
                {filteredAnnouncements.length === 0 ? (
                  <EmptyState
                    icon={<Megaphone className="h-16 w-16 text-gray-400" />}
                    title="No Announcements Found"
                    description="No announcements match your current filters."
                    action={{
                      label: "Create First Announcement",
                      onClick: () => setIsAnnouncementModalOpen(true)
                    }}
                  />
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden md:block space-y-4">
                      {filteredAnnouncements.map((announcement) => (
                        <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                          <CardBody>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {announcement.title}
                                  </h3>
                                  <Badge 
                                    variant={
                                      announcement.priority === 'high' ? 'danger' :
                                      announcement.priority === 'medium' ? 'warning' : 'info'
                                    }
                                  >
                                    <div className="flex items-center space-x-1">
                                      {getPriorityIcon(announcement.priority)}
                                      <span>{announcement.priority.toUpperCase()}</span>
                                    </div>
                                  </Badge>
                                  {announcement.department && (
                                    <Badge variant="default">
                                      {announcement.department.name}
                                    </Badge>
                                  )}
                                  {!announcement.department_id && (
                                    <Badge variant="success">
                                      Church-wide
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-gray-600 mb-4 line-clamp-3">
                                  {announcement.content}
                                </p>
                                
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center space-x-4">
                                    <span>
                                      By {announcement.author?.first_name} {announcement.author?.last_name}
                                    </span>
                                    <span>
                                      {formatDate(announcement.created_at)}
                                    </span>
                                    {announcement.expires_at && (
                                      <span className={`flex items-center space-x-1 ${
                                        new Date(announcement.expires_at) < new Date() ? 'text-red-600' : 'text-orange-600'
                                      }`}>
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          Expires: {formatDate(announcement.expires_at)}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItem(announcement);
                                        setAnnouncementForm({
                                          title: announcement.title,
                                          content: announcement.content,
                                          department_id: announcement.department_id || '',
                                          zone_id: announcement.zone_id || '',
                                          priority: announcement.priority,
                                          expires_at: announcement.expires_at ? 
                                            new Date(announcement.expires_at).toISOString().slice(0, 16) : ''
                                        });
                                        setIsEditModalOpen(true);
                                      }}
                                      icon={<Edit className="h-4 w-4" />}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItem(announcement);
                                        setIsDeleteModalOpen(true);
                                      }}
                                      icon={<Trash2 className="h-4 w-4" />}
                                      className="text-red-600 hover:text-red-700"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                      {filteredAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm text-gray-900 flex-1">
                              {announcement.title}
                            </h3>
                            <Badge 
                              variant={
                                announcement.priority === 'high' ? 'danger' :
                                announcement.priority === 'medium' ? 'warning' : 'info'
                              }
                            >
                              <div className="flex items-center space-x-1">
                                {getPriorityIcon(announcement.priority)}
                              </div>
                            </Badge>
                          </div>
                          
                          {(announcement.department || !announcement.department_id) && (
                            <div className="flex gap-2 mb-2">
                              {announcement.department && (
                                <Badge variant="default">
                                  <span className="text-xs">{announcement.department.name}</span>
                                </Badge>
                              )}
                              {!announcement.department_id && (
                                <Badge variant="success">
                                  <span className="text-xs">Church-wide</span>
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {announcement.content}
                          </p>
                          
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                            <span>
                              {announcement.author?.first_name} {announcement.author?.last_name}
                            </span>
                            <span>
                              {formatDate(announcement.created_at)}
                            </span>
                          </div>
                          
                          {announcement.expires_at && (
                            <div className={`text-[10px] mb-2 flex items-center space-x-1 ${
                              new Date(announcement.expires_at) < new Date() ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              <span>Expires: {formatDate(announcement.expires_at)}</span>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedItem(announcement);
                                setAnnouncementForm({
                                  title: announcement.title,
                                  content: announcement.content,
                                  department_id: announcement.department_id || '',
                                  zone_id: announcement.zone_id || '',
                                  priority: announcement.priority,
                                  expires_at: announcement.expires_at ? 
                                    new Date(announcement.expires_at).toISOString().slice(0, 16) : ''
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="text-gray-500 hover:text-blue-600 p-1"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(announcement);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-gray-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Communications Tab */}
            {activeTab === 'communications' && (
              <div className="space-y-4">
                {/* Header with Create Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Sent Messages</h2>
                    <p className="text-sm text-gray-500">View and send SMS, Email, or WhatsApp messages</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setIsCommunicationModalOpen(true)}
                    icon={<Send className="h-4 w-4" />}
                  >
                    Send Message
                  </Button>
                </div>

                {communications.length === 0 ? (
                  <EmptyState
                    icon={<Send className="h-16 w-16 text-gray-400" />}
                    title="No Messages Sent"
                    description="You haven't sent any messages yet."
                    action={{
                      label: "Send First Message",
                      onClick: () => setIsCommunicationModalOpen(true)
                    }}
                  />
                ) : (
                  communications.map((communication) => (
                    <Card key={communication.id} className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-2">
                                {getCommunicationTypeIcon(communication.type)}
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {communication.subject || 'No Subject'}
                                </h3>
                              </div>
                              <Badge 
                                variant={
                                  communication.delivery_status === 'delivered' ? 'success' :
                                  communication.delivery_status === 'failed' ? 'danger' :
                                  communication.delivery_status === 'sent' ? 'info' : 'warning'
                                }
                              >
                                {communication.delivery_status.toUpperCase()}
                              </Badge>
                              <Badge variant="default">
                                {communication.type.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {communication.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>
                                  To {communication.recipient_ids.length} recipients
                                </span>
                                <span>
                                  By {communication.sender?.first_name} {communication.sender?.last_name}
                                </span>
                                <span>
                                  {formatDate(communication.sent_at)}
                                </span>
                                {communication.cost > 0 && (
                                  <span>
                                    Cost: TZS {communication.cost.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            )}

        {/* Create Announcement Modal */}
        <Modal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="Create New Announcement"
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <Input
            label="Title"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
            placeholder="Enter announcement title"
            required
          />
          
          <TextArea
            label="Content"
            value={announcementForm.content}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
            placeholder="Enter announcement content"
            rows={4}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Priority"
              value={announcementForm.priority}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as Announcement['priority'] })}
              required
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" }
              ]}
            />

            {!isDepartmentLeader ? (
              <Select
                label="Target Audience"
                value={announcementForm.department_id}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, department_id: e.target.value })}
                options={[
                  { value: "", label: "Church-wide" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
              />
            ) : (
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Target Audience</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md sm:rounded-lg bg-gray-50 text-sm sm:text-base text-gray-700">
                  {departmentName} Department
                </div>
              </div>
            )}
          </div>

          <Select
            label="Zone (Optional)"
            value={announcementForm.zone_id}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, zone_id: e.target.value })}
            options={[
              { value: "", label: "All Zones" },
              ...zones.map(zone => ({ value: zone.id, label: zone.name }))
            ]}
          />

          <Input
            label="Expiry Date (Optional)"
            type="datetime-local"
            value={announcementForm.expires_at}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button variant="outline" onClick={() => setIsAnnouncementModalOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleCreateAnnouncement} className="w-full sm:w-auto">
            Create Announcement
          </Button>
        </div>
        </Modal>

        {/* Send Communication Modal */}
        <Modal
          isOpen={isCommunicationModalOpen}
          onClose={() => setIsCommunicationModalOpen(false)}
          title="Send Message"
          size="lg"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Message Type"
              value={communicationForm.type}
              onChange={(e) => setCommunicationForm({ ...communicationForm, type: e.target.value as Communication['type'] })}
              required
              options={[
                { value: "sms", label: "SMS" },
                { value: "email", label: "Email" },
                { value: "whatsapp", label: "WhatsApp" }
              ]}
            />

            <Select
              label="Recipients"
              value={communicationForm.recipient_type}
              onChange={(e) => setCommunicationForm({ ...communicationForm, recipient_type: e.target.value })}
              required
              options={[
                { value: "all", label: "All Members" },
                { value: "department", label: "Department" },
                { value: "individual", label: "Select Individual" }
              ]}
            />
          </div>

          {communicationForm.recipient_type === 'department' && (
            <Select
              label="Select Department"
              value={communicationForm.department_id}
              onChange={(e) => setCommunicationForm({ ...communicationForm, department_id: e.target.value })}
              required
              placeholder="Choose department..."
              options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
            />
          )}

          {(communicationForm.type === 'email' || communicationForm.type === 'whatsapp') && (
            <Input
              label="Subject"
              value={communicationForm.subject}
              onChange={(e) => setCommunicationForm({ ...communicationForm, subject: e.target.value })}
              placeholder="Enter message subject"
            />
          )}
          
          <TextArea
            label="Message"
            value={communicationForm.message}
            onChange={(e) => setCommunicationForm({ ...communicationForm, message: e.target.value })}
            placeholder="Enter your message"
            rows={5}
            required
          />

          <Input
            label="Schedule for Later (Optional)"
            type="datetime-local"
            value={communicationForm.scheduled_at}
            onChange={(e) => setCommunicationForm({ ...communicationForm, scheduled_at: e.target.value })}
          />

          {/* Cost estimate */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2">Cost Estimate</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              {communicationForm.recipient_type === 'all' ? members.length :
               communicationForm.recipient_type === 'department' && communicationForm.department_id ? 
               'Department members' : 'Selected members'} × TZS {
                communicationForm.type === 'sms' ? '50' :
                communicationForm.type === 'whatsapp' ? '30' : '0'
              } = Estimated cost
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button variant="outline" onClick={() => setIsCommunicationModalOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSendCommunication} className="w-full sm:w-auto">
            {communicationForm.scheduled_at ? 'Schedule Message' : 'Send Now'}
          </Button>
          </div>
        </Modal>

        {/* Edit Announcement Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Announcement"
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <Input
            label="Title"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
            placeholder="Enter announcement title"
            required
          />
          
          <TextArea
            label="Content"
            value={announcementForm.content}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
            placeholder="Enter announcement content"
            rows={4}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Priority"
              value={announcementForm.priority}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as Announcement['priority'] })}
              required
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" }
              ]}
            />

            <Select
              label="Target Audience"
              value={announcementForm.department_id}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, department_id: e.target.value })}
              options={[
                { value: "", label: "Church-wide" },
                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
              ]}
            />
          </div>

          <Select
            label="Zone (Optional)"
            value={announcementForm.zone_id}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, zone_id: e.target.value })}
            options={[
              { value: "", label: "All Zones" },
              ...zones.map(zone => ({ value: zone.id, label: zone.name }))
            ]}
          />

          <Input
            label="Expiry Date (Optional)"
            type="datetime-local"
            value={announcementForm.expires_at}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={async () => {
            if (!supabase || !selectedItem) return;
            
            try {
              const { error } = await supabase
                .from('announcements')
                .update({
                  title: announcementForm.title,
                  content: announcementForm.content,
                  department_id: announcementForm.department_id || null,
                  zone_id: announcementForm.zone_id || null,
                  priority: announcementForm.priority,
                  expires_at: announcementForm.expires_at || null
                })
                .eq('id', selectedItem.id);

              if (error) throw error;

              setSuccess('Announcement updated successfully!');
              setIsEditModalOpen(false);
              setSelectedItem(null);
              loadAnnouncements();
            } catch (err: any) {
              setError(err.message);
            }
          }} className="w-full sm:w-auto">
            Update Announcement
          </Button>
        </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAnnouncement}
          title="Delete Announcement"
          message={`Are you sure you want to delete "${selectedItem?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
        </div>
      </MainLayout>
    );
  }

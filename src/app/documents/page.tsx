'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import Sidebar from '@/components/Sidebar';
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
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  AlertCircle,
  File,
  Folder,
  FileImage,
  FileSpreadsheet
} from 'lucide-react';

interface MeetingMinutes {
  id: string;
  department_id: string;
  meeting_date: string;
  agenda: string;
  minutes: string;
  attendees: string[];
  next_meeting_date?: string;
  recorded_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  department?: {
    name: string;
  };
  recorder?: {
    first_name: string;
    last_name: string;
  };
  approver?: {
    first_name: string;
    last_name: string;
  };
  attendee_details?: Array<{
    first_name: string;
    last_name: string;
  }>;
}

interface Report {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual';
  department_id?: string;
  content: string;
  generated_by: string;
  file_url?: string;
  created_at: string;
  department?: {
    name: string;
  };
  generator?: {
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
  member_number: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase, signOut } = useAuth();
  const { isDepartmentLeader, departmentId, departmentName } = useDepartmentAccess();
  
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinutes[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'minutes' | 'reports'>('minutes');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Modal states
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MeetingMinutes | Report | null>(null);
  
  // Form data for meeting minutes
  const [minutesForm, setMinutesForm] = useState({
    department_id: '',
    meeting_date: '',
    agenda: '',
    minutes: '',
    attendees: [] as string[],
    next_meeting_date: ''
  });

  // Form data for reports
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'monthly' as Report['type'],
    department_id: '',
    content: ''
  });

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
      
      if (activeTab === 'minutes') {
        await loadMeetingMinutes();
      } else {
        await loadReports();
      }
      
      await loadDepartments();
      await loadMembers();
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMeetingMinutes = async () => {
    if (!supabase) return;
    
    let minutesQuery = supabase
      .from('meeting_minutes')
      .select(`
        *,
        department:departments(name),
        recorder:profiles!meeting_minutes_recorded_by_fkey(first_name, last_name),
        approver:profiles!meeting_minutes_approved_by_fkey(first_name, last_name)
      `);

    // Filter by department for department leaders
    if (isDepartmentLeader && departmentId) {
      minutesQuery = minutesQuery.eq('department_id', departmentId);
    }

    const { data, error } = await minutesQuery
      .order('meeting_date', { ascending: false });    if (error) throw error;

    // Load attendee details for each meeting
    const minutesWithAttendees = await Promise.all(
      (data || []).map(async (minute: any) => {
        if (minute.attendees && minute.attendees.length > 0) {
          const { data: attendeeData, error: attendeeError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .in('id', minute.attendees);

          if (!attendeeError) {
            return {
              ...minute,
              attendee_details: attendeeData
            };
          }
        }
        return {
          ...minute,
          attendee_details: []
        };
      })
    );

    setMeetingMinutes(minutesWithAttendees);
  };

  const loadReports = async () => {
    if (!supabase) return;
    
    let reportsQuery = supabase
      .from('reports')
      .select(`
        *,
        department:departments(name),
        generator:profiles(first_name, last_name)
      `);

    // Filter by department for department leaders
    if (isDepartmentLeader && departmentId) {
      reportsQuery = reportsQuery.eq('department_id', departmentId);
    }

    const { data, error } = await reportsQuery
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReports(data || []);
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

  const loadMembers = async () => {
    if (!supabase) return;
    
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setMembers(profilesData?.map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        member_number: p.email // Using email as identifier
      })) || []);
    } catch (err: any) {
      console.error('Error loading members:', err);
    }
  };

  const handleCreateMinutes = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      const minutesData = {
        department_id: isDepartmentLeader ? departmentId : minutesForm.department_id,
        meeting_date: minutesForm.meeting_date,
        agenda: minutesForm.agenda,
        minutes: minutesForm.minutes,
        attendees: minutesForm.attendees,
        next_meeting_date: minutesForm.next_meeting_date || null,
        recorded_by: user.profile.id
      };

      const { error } = await supabase
        .from('meeting_minutes')
        .insert(minutesData);

      if (error) throw error;

      setSuccess('Meeting minutes created successfully!');
      setIsMinutesModalOpen(false);
      setMinutesForm({
        department_id: '',
        meeting_date: '',
        agenda: '',
        minutes: '',
        attendees: [],
        next_meeting_date: ''
      });
      loadMeetingMinutes();
    } catch (err: any) {
      console.error('Error creating meeting minutes:', err);
      setError(err.message);
    }
  };

  const handleCreateReport = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      const reportData = {
        title: reportForm.title,
        type: reportForm.type,
        department_id: isDepartmentLeader ? departmentId : (reportForm.department_id || null),
        content: reportForm.content,
        generated_by: user.profile.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('reports')
        .insert(reportData);

      if (error) throw error;

      setSuccess('Report created successfully!');
      setIsReportModalOpen(false);
      setReportForm({
        title: '',
        type: 'monthly',
        department_id: '',
        content: ''
      });
      loadReports();
    } catch (err: any) {
      console.error('Error creating report:', err);
      setError(err.message);
    }
  };

  const handleDeleteItem = async () => {
    if (!supabase || !selectedItem) return;

    try {
      const table = activeTab === 'minutes' ? 'meeting_minutes' : 'reports';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      setSuccess(`${activeTab === 'minutes' ? 'Meeting minutes' : 'Report'} deleted successfully!`);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      
      if (activeTab === 'minutes') {
        loadMeetingMinutes();
      } else {
        loadReports();
      }
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError(err.message);
    }
  };

  const handleApproveMinutes = async (minutesId: string) => {
    if (!supabase || !user?.profile?.id) return;

    try {
      const { error } = await supabase
        .from('meeting_minutes')
        .update({
          approved_by: user.profile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', minutesId);

      if (error) throw error;

      setSuccess('Meeting minutes approved successfully!');
      loadMeetingMinutes();
    } catch (err: any) {
      console.error('Error approving minutes:', err);
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileImage className="h-5 w-5 text-blue-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredMinutes = meetingMinutes.filter(minute => {
    const matchesSearch = minute.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         minute.minutes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || minute.department_id === filterDepartment;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'approved' && minute.approved_by) ||
                         (filterStatus === 'pending' && !minute.approved_by);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || 
                             (filterDepartment === 'church-wide' && !report.department_id) ||
                             report.department_id === filterDepartment;
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesDepartment && matchesType;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Documents & Records</h1>
                <p className="text-gray-600 mt-1">Manage meeting minutes, reports, and church documents</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  icon={<Upload className="h-4 w-4" />}
                >
                  Upload File
                </Button>
                <Button 
                  onClick={() => {
                    if (activeTab === 'minutes') {
                      setIsMinutesModalOpen(true);
                    } else {
                      setIsReportModalOpen(true);
                    }
                  }}
                  icon={<Plus className="h-4 w-4" />}
                >
                  {activeTab === 'minutes' ? 'Add Minutes' : 'Create Report'}
                </Button>
              </div>
            </div>

            {/* Department Access Notification */}
            {isDepartmentLeader && departmentName && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-purple-900">Department Documents: {departmentName}</h3>
                    <p className="text-purple-700 text-sm mt-1">
                      You can view and manage meeting minutes and reports for your department only.
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
            <div className="mb-6">
              <nav className="flex space-x-0">
                <button
                  onClick={() => setActiveTab('minutes')}
                  className={`relative flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'minutes'
                      ? 'bg-red-100 text-red-600 rounded-tl-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Meeting Minutes</span>
                  {activeTab === 'minutes' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`relative flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-red-100 text-red-600 rounded-tl-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Folder className="h-4 w-4" />
                  <span>Reports</span>
                  {activeTab === 'reports' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
              </nav>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <Input
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    placeholder="Department"
                    options={[
                      { value: "all", label: "All Departments" },
                      ...(activeTab === 'reports' ? [{ value: "church-wide", label: "Church-wide" }] : []),
                      ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                    ]}
                  />
                  {activeTab === 'minutes' ? (
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      placeholder="Status"
                      options={[
                        { value: "all", label: "All Status" },
                        { value: "approved", label: "Approved" },
                        { value: "pending", label: "Pending Approval" }
                      ]}
                    />
                  ) : (
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      placeholder="Report Type"
                      options={[
                        { value: "all", label: "All Types" },
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                        { value: "annual", label: "Annual" }
                      ]}
                    />
                  )}
                  <div></div>
                </div>
              </CardBody>
            </Card>

            {/* Meeting Minutes Tab */}
            {activeTab === 'minutes' && (
              <>
                {filteredMinutes.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-16 w-16 text-gray-400" />}
                    title="No Meeting Minutes Found"
                    description="No meeting minutes match your current filters."
                    action={{
                      label: "Add First Minutes",
                      onClick: () => setIsMinutesModalOpen(true)
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredMinutes.map((minute) => (
                      <Card key={minute.id} className="hover:shadow-md transition-shadow">
                        <CardBody>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {minute.department?.name} Meeting
                                </h3>
                                <Badge variant="default">
                                  {formatDate(minute.meeting_date)}
                                </Badge>
                                {minute.approved_by ? (
                                  <Badge variant="success">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="warning">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-1">Agenda:</h4>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {minute.agenda}
                                </p>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-1">Minutes:</h4>
                                <p className="text-gray-600 text-sm line-clamp-3">
                                  {minute.minutes}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span>
                                    Recorded by {minute.recorder?.first_name} {minute.recorder?.last_name}
                                  </span>
                                  {minute.attendee_details && (
                                    <div className="flex items-center space-x-1">
                                      <Users className="h-4 w-4" />
                                      <span>{minute.attendee_details.length} attendees</span>
                                    </div>
                                  )}
                                  {minute.next_meeting_date && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>Next: {formatDate(minute.next_meeting_date)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  {!minute.approved_by && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleApproveMinutes(minute.id)}
                                      icon={<CheckCircle className="h-4 w-4" />}
                                      className="text-green-600 hover:text-green-700"
                                    />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Eye className="h-4 w-4" />}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Download className="h-4 w-4" />}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedItem(minute);
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
                )}
              </>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <>
                {filteredReports.length === 0 ? (
                  <EmptyState
                    icon={<Folder className="h-16 w-16 text-gray-400" />}
                    title="No Reports Found"
                    description="No reports match your current filters."
                    action={{
                      label: "Create First Report",
                      onClick: () => setIsReportModalOpen(true)
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                      <Card key={report.id} className="hover:shadow-lg transition-shadow">
                        <CardBody>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              {getFileIcon(report.file_url || 'report.pdf')}
                              <Badge 
                                variant={
                                  report.type === 'annual' ? 'primary' :
                                  report.type === 'quarterly' ? 'info' :
                                  'success'
                                }
                              >
                                {report.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Eye className="h-4 w-4" />}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Download className="h-4 w-4" />}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(report);
                                  setIsDeleteModalOpen(true);
                                }}
                                icon={<Trash2 className="h-4 w-4" />}
                                className="text-red-600 hover:text-red-700"
                              />
                            </div>
                          </div>

                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {report.title}
                          </h3>

                          {report.department ? (
                            <Badge variant="default" className="mb-3">
                              {report.department.name}
                            </Badge>
                          ) : (
                            <Badge variant="success" className="mb-3">
                              Church-wide
                            </Badge>
                          )}

                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {report.content}
                          </p>

                          <div className="text-sm text-gray-500">
                            <div className="flex justify-between items-center">
                              <span>
                                By {report.generator?.first_name} {report.generator?.last_name}
                              </span>
                              <span>
                                {formatDate(report.created_at)}
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Meeting Minutes Modal */}
      <Modal
        isOpen={isMinutesModalOpen}
        onClose={() => setIsMinutesModalOpen(false)}
        title="Add Meeting Minutes"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isDepartmentLeader ? (
              <Select
                label="Department"
                value={minutesForm.department_id}
                onChange={(e) => setMinutesForm({ ...minutesForm, department_id: e.target.value })}
                required
                placeholder="Select department..."
                options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
              />
            ) : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {departmentName}
                </div>
              </div>
            )}

            <Input
              label="Meeting Date"
              type="date"
              value={minutesForm.meeting_date}
              onChange={(e) => setMinutesForm({ ...minutesForm, meeting_date: e.target.value })}
              required
            />
          </div>

          <TextArea
            label="Agenda"
            value={minutesForm.agenda}
            onChange={(e) => setMinutesForm({ ...minutesForm, agenda: e.target.value })}
            placeholder="Enter meeting agenda"
            rows={3}
            required
          />
          
          <TextArea
            label="Minutes"
            value={minutesForm.minutes}
            onChange={(e) => setMinutesForm({ ...minutesForm, minutes: e.target.value })}
            placeholder="Enter meeting minutes"
            rows={6}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendees
              </label>
              <select
                multiple
                value={minutesForm.attendees}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setMinutesForm({ ...minutesForm, attendees: selected });
                }}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                size={5}
              >
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <Input
              label="Next Meeting Date (Optional)"
              type="date"
              value={minutesForm.next_meeting_date}
              onChange={(e) => setMinutesForm({ ...minutesForm, next_meeting_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsMinutesModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateMinutes}>
            Save Minutes
          </Button>
        </div>
      </Modal>

      {/* Create Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Create Report"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Report Title"
            value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
            placeholder="Enter report title"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Report Type"
              value={reportForm.type}
              onChange={(e) => setReportForm({ ...reportForm, type: e.target.value as Report['type'] })}
              required
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "annual", label: "Annual" }
              ]}
            />

            {!isDepartmentLeader ? (
              <Select
                label="Department"
                value={reportForm.department_id}
                onChange={(e) => setReportForm({ ...reportForm, department_id: e.target.value })}
                placeholder="Church-wide"
                options={[
                  { value: "", label: "Church-wide" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
              />
            ) : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {departmentName}
                </div>
              </div>
            )}
          </div>
          
          <TextArea
            label="Report Content"
            value={reportForm.content}
            onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
            placeholder="Enter report content"
            rows={8}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateReport}>
            Create Report
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteItem}
        title={`Delete ${activeTab === 'minutes' ? 'Meeting Minutes' : 'Report'}`}
        message={`Are you sure you want to delete this ${activeTab === 'minutes' ? 'meeting minutes' : 'report'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

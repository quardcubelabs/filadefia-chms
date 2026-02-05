'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useZoneAccess } from '@/hooks/useZoneAccess';
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
  FileSpreadsheet,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface MeetingMinutes {
  id: string;
  department_id: string;
  meeting_date: string;
  agenda: string;
  minutes: string;
  attendees: string[];
  next_meeting_date?: string;
  attachment_url?: string;
  attachment_name?: string;
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
  zone_id?: string;
  content: string;
  generated_by: string;
  file_url?: string;
  source?: 'manual' | 'generated';
  description?: string;
  period_start?: string;
  period_end?: string;
  data?: {
    reportType?: string;
    reportPeriod?: string;
    filename?: string;
    totalMembers?: number;
    totalIncome?: number;
    totalExpenses?: number;
    generatedAt?: string;
    generatedBy?: string;
    content?: string;
  };
  created_at: string;
  department?: {
    name: string;
  };
  zone?: {
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
  const { isZoneLeader, zoneId, zoneName } = useZoneAccess();
  
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
  const [filterSource, setFilterSource] = useState<string>('all');
  
  // Modal states
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isViewReportModalOpen, setIsViewReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MeetingMinutes | Report | null>(null);
  const [viewingMinutes, setViewingMinutes] = useState<MeetingMinutes | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  
  // Form data for meeting minutes
  const [minutesForm, setMinutesForm] = useState({
    department_id: '',
    meeting_date: '',
    agenda: '',
    minutes: '',
    attendees: [] as string[],
    next_meeting_date: ''
  });
  
  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

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

  // Helper to check if error is JWT expired
  const isJWTExpiredError = (error: any): boolean => {
    if (!error) return false;
    const message = error?.message || error?.error_description || String(error);
    return message.toLowerCase().includes('jwt') && 
           (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid'));
  };

  // Wrapper to handle JWT errors and retry
  const withJWTRetry = async <T,>(operation: () => Promise<T>, retryCount = 0): Promise<T> => {
    try {
      return await operation();
    } catch (err: any) {
      if (isJWTExpiredError(err) && retryCount < 2 && supabase) {
        console.log('JWT expired, refreshing token and retrying...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          return withJWTRetry(operation, retryCount + 1);
        }
      }
      throw err;
    }
  };

  const loadData = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a fresh session before loading data
      await supabase.auth.refreshSession();
      
      if (activeTab === 'minutes') {
        await loadMeetingMinutes();
      } else {
        await loadReports();
      }
      
      await loadDepartments();
      await loadMembers();
    } catch (err: any) {
      console.error('Error loading data:', err);
      // Handle JWT expired errors gracefully
      if (isJWTExpiredError(err)) {
        // Try one more refresh
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            // Retry loading data
            setError(null);
            if (activeTab === 'minutes') {
              await loadMeetingMinutes();
            } else {
              await loadReports();
            }
            await loadDepartments();
            await loadMembers();
            return;
          }
        } catch {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          return;
        }
        setError('Session expired. Please refresh the page or log in again.');
      } else {
        setError(err?.message || 'Failed to load data. Please try again.');
      }
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
        zone:zones(name),
        generator:profiles(first_name, last_name)
      `);

    // Filter by department for department leaders
    if (isDepartmentLeader && departmentId) {
      reportsQuery = reportsQuery.eq('department_id', departmentId);
    }
    
    // Filter by zone for zone leaders
    if (isZoneLeader && zoneId) {
      reportsQuery = reportsQuery.eq('zone_id', zoneId);
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
    console.log('Starting handleCreateMinutes...');
    console.log('Supabase client:', !!supabase);
    console.log('User profile:', user?.profile);
    console.log('Form data:', minutesForm);
    console.log('Is department leader:', isDepartmentLeader, 'Department ID:', departmentId);

    if (!supabase) {
      setError('Database connection not available. Please refresh the page and try again.');
      return;
    }
    
    if (!user?.profile?.id) {
      setError('User authentication required. Please log in again.');
      return;
    }

    // Validate required fields
    if (!minutesForm.meeting_date) {
      setError('Meeting date is required.');
      return;
    }
    if (!minutesForm.agenda) {
      setError('Agenda is required.');
      return;
    }
    if (!minutesForm.minutes) {
      setError('Minutes content is required.');
      return;
    }
    if (!isDepartmentLeader && !minutesForm.department_id) {
      setError('Department selection is required.');
      return;
    }

    try {
      // Check user permissions before attempting insert
      console.log('User role check:', {
        userRole: user?.profile?.role,
        isDepartmentLeader,
        departmentId,
        canAccessAllDepartments: user?.profile?.role === 'administrator' || user?.profile?.role === 'pastor'
      });

      // Check if user has department membership
      if (isDepartmentLeader && departmentId) {
        console.log('Checking department membership...');
        
        // First find the member record using email
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, email')
          .eq('email', user.email)
          .single();
        
        console.log('Member lookup:', { memberData, memberError });
        
        if (memberError || !memberData) {
          setError('Member record not found. Please contact your administrator to set up your member profile.');
          return;
        }
        
        // Then check department membership using member_id
        const { data: membershipCheck, error: membershipError } = await supabase
          .from('department_members')
          .select('*')
          .eq('member_id', memberData.id)
          .eq('department_id', departmentId)
          .single();
        
        console.log('Department membership check:', { membershipCheck, membershipError });
        
        if (membershipError || !membershipCheck) {
          setError('You are not properly assigned to your department. Please contact your administrator.');
          return;
        }
      }

      // Handle attachment upload if file is selected
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      
      if (attachmentFile) {
        setUploadingAttachment(true);
        try {
          const fileExt = attachmentFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `meeting-minutes/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, attachmentFile);
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Try alternate bucket name
            const { data: uploadData2, error: uploadError2 } = await supabase.storage
              .from('attachments')
              .upload(filePath, attachmentFile);
            
            if (uploadError2) {
              throw new Error('Failed to upload attachment. Please check storage configuration.');
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from('attachments')
              .getPublicUrl(filePath);
            attachmentUrl = publicUrl;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(filePath);
            attachmentUrl = publicUrl;
          }
          
          attachmentName = attachmentFile.name;
        } catch (uploadErr: any) {
          console.error('Attachment upload failed:', uploadErr);
          setError(uploadErr.message || 'Failed to upload attachment');
          setUploadingAttachment(false);
          return;
        }
        setUploadingAttachment(false);
      }

      const minutesData = {
        department_id: isDepartmentLeader ? departmentId : minutesForm.department_id,
        meeting_date: minutesForm.meeting_date,
        agenda: minutesForm.agenda,
        minutes: minutesForm.minutes,
        attendees: Array.isArray(minutesForm.attendees) ? minutesForm.attendees : [],
        next_meeting_date: minutesForm.next_meeting_date || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        recorded_by: user.profile.id
      };

      console.log('Attempting to insert meeting minutes:', minutesData);

      // Validate that department_id is not null/undefined
      if (!minutesData.department_id) {
        throw new Error('Department selection is required.');
      }

      const { data, error } = await supabase
        .from('meeting_minutes')
        .insert(minutesData)
        .select();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Handle specific RLS policy violations
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('You do not have permission to create meeting minutes for this department. Please contact your administrator.');
        }
        
        throw error;
      }

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
      setAttachmentFile(null);
      loadMeetingMinutes();
    } catch (err: any) {
      console.error('Error creating meeting minutes:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', Object.keys(err || {}));
      console.error('Error string:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Failed to create meeting minutes. Please try again.';
      
      if (err && typeof err === 'object') {
        // Handle RLS policy violations specifically
        if (err.code === '42501' || err.message?.includes('row-level security')) {
          errorMessage = 'You do not have permission to create meeting minutes for this department. Please contact your administrator.';
        } else {
          errorMessage = err.message || err.details || err.hint || errorMessage;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    }
  };

  const handleCreateReport = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      // Calculate period dates based on report type
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (reportForm.type === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (reportForm.type === 'quarterly') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      } else { // annual
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
      }

      const reportData = {
        title: reportForm.title,
        type: reportForm.type,
        department_id: isDepartmentLeader ? departmentId : (reportForm.department_id || null),
        period_start: periodStart.toISOString().split('T')[0], // YYYY-MM-DD format
        period_end: periodEnd.toISOString().split('T')[0],
        data: {
          content: reportForm.content,
          created_at: new Date().toISOString()
        },
        generated_by: user.profile.id
      };

      console.log('Creating report with data:', reportData);

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
      console.error('Error type:', typeof err);
      console.error('Error keys:', Object.keys(err || {}));
      console.error('Error string:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Failed to create report. Please try again.';
      
      if (err && typeof err === 'object') {
        // Handle RLS policy violations specifically
        if (err.code === '42501' || err.message?.includes('row-level security')) {
          errorMessage = 'You do not have permission to create reports for this department. Please contact your administrator.';
        } else if (err.code === 'PGRST204') {
          errorMessage = 'Database schema error. Please contact your administrator.';
        } else {
          errorMessage = err.message || err.details || err.hint || errorMessage;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
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
      const errorMessage = err?.message || err?.details || 'Failed to delete item. Please try again.';
      setError(errorMessage);
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

  // Handle view meeting minutes
  const handleViewMinutes = (minute: MeetingMinutes) => {
    setViewingMinutes(minute);
    setIsViewModalOpen(true);
  };

  // Handle download meeting minutes as PDF
  const handleDownloadMinutesPDF = (minute: MeetingMinutes) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Header
      doc.setFillColor(139, 0, 0); // Dark red color
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MEETING MINUTES', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(minute.department?.name || 'Department Meeting', pageWidth / 2, 32, { align: 'center' });

      yPosition = 55;
      doc.setTextColor(0, 0, 0);

      // Meeting Details Section
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, contentWidth, 30, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 30, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Meeting Date:', margin + 5, yPosition + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(minute.meeting_date), margin + 40, yPosition + 10);

      if (minute.next_meeting_date) {
        doc.setFont('helvetica', 'bold');
        doc.text('Next Meeting:', margin + 5, yPosition + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(minute.next_meeting_date), margin + 40, yPosition + 22);
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Status:', margin + contentWidth / 2, yPosition + 10);
      doc.setFont('helvetica', 'normal');
      const status = minute.approved_by ? 'Approved' : 'Pending Approval';
      if (minute.approved_by) {
        doc.setTextColor(0, 128, 0);
      } else {
        doc.setTextColor(255, 165, 0);
      }
      doc.text(status, margin + contentWidth / 2 + 20, yPosition + 10);
      doc.setTextColor(0, 0, 0);

      doc.setFont('helvetica', 'bold');
      doc.text('Recorded By:', margin + contentWidth / 2, yPosition + 22);
      doc.setFont('helvetica', 'normal');
      doc.text(`${minute.recorder?.first_name || ''} ${minute.recorder?.last_name || ''}`.trim() || 'N/A', margin + contentWidth / 2 + 35, yPosition + 22);

      yPosition += 40;

      // Agenda Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0);
      doc.text('AGENDA', margin, yPosition);
      doc.setDrawColor(139, 0, 0);
      doc.line(margin, yPosition + 2, margin + 30, yPosition + 2);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const agendaLines = doc.splitTextToSize(minute.agenda, contentWidth);
      agendaLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Minutes Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0);
      doc.text('MINUTES', margin, yPosition);
      doc.line(margin, yPosition + 2, margin + 35, yPosition + 2);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const minutesLines = doc.splitTextToSize(minute.minutes, contentWidth);
      minutesLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Attendees Section
      if (minute.attendee_details && minute.attendee_details.length > 0) {
        if (yPosition > pageHeight - margin - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 0, 0);
        doc.text('ATTENDEES', margin, yPosition);
        doc.line(margin, yPosition + 2, margin + 45, yPosition + 2);
        yPosition += 10;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        minute.attendee_details.forEach((attendee, index) => {
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(`${index + 1}. ${attendee.first_name} ${attendee.last_name}`, margin + 5, yPosition);
          yPosition += 6;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          margin,
          pageHeight - 10
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      }

      // Download the PDF
      const fileName = `meeting-minutes-${minute.department?.name?.replace(/\s+/g, '-').toLowerCase() || 'dept'}-${minute.meeting_date}.pdf`;
      doc.save(fileName);
      setSuccess('Meeting minutes downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Handle view report
  const handleViewReport = (report: Report) => {
    setViewingReport(report);
    setIsViewReportModalOpen(true);
  };

  // Handle download report as PDF
  const handleDownloadReportPDF = (report: Report) => {
    // If report has a file_url, download it directly
    if (report.file_url) {
      const link = document.createElement('a');
      link.href = report.file_url;
      link.download = report.data?.filename || `report-${report.id}.pdf`;
      link.click();
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Header
      doc.setFillColor(30, 64, 175); // Blue
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('CHURCH REPORT', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(report.title, pageWidth / 2, 30, { align: 'center' });

      yPosition = 55;
      doc.setTextColor(0, 0, 0);

      // Report Details Box
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, contentWidth, 35, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 35, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Type:', margin + 5, yPosition + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(report.type.charAt(0).toUpperCase() + report.type.slice(1), margin + 38, yPosition + 10);

      doc.setFont('helvetica', 'bold');
      doc.text('Department:', margin + 5, yPosition + 20);
      doc.setFont('helvetica', 'normal');
      const deptName = report.department?.name || report.zone?.name || 'Church-wide';
      doc.text(deptName, margin + 38, yPosition + 20);

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', margin + contentWidth / 2, yPosition + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(report.created_at), margin + contentWidth / 2 + 18, yPosition + 10);

      doc.setFont('helvetica', 'bold');
      doc.text('Created By:', margin + contentWidth / 2, yPosition + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${report.generator?.first_name || ''} ${report.generator?.last_name || ''}`.trim() || 'N/A', margin + contentWidth / 2 + 32, yPosition + 20);

      if (report.period_start && report.period_end) {
        doc.setFont('helvetica', 'bold');
        doc.text('Period:', margin + 5, yPosition + 30);
        doc.setFont('helvetica', 'normal');
        doc.text(`${new Date(report.period_start).toLocaleDateString()} - ${new Date(report.period_end).toLocaleDateString()}`, margin + 28, yPosition + 30);
      }

      yPosition += 45;

      // Stats Section (if available)
      if (report.data && (report.data.totalMembers !== undefined || report.data.totalIncome !== undefined)) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('KEY STATISTICS', margin, yPosition);
        doc.line(margin, yPosition + 2, margin + 55, yPosition + 2);
        yPosition += 12;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        if (report.data.totalMembers !== undefined) {
          doc.setFont('helvetica', 'bold');
          doc.text('Total Members:', margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(String(report.data.totalMembers), margin + 45, yPosition);
          yPosition += 8;
        }
        if (report.data.totalIncome !== undefined) {
          doc.setFont('helvetica', 'bold');
          doc.text('Total Income:', margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(`TZS ${report.data.totalIncome.toLocaleString()}`, margin + 45, yPosition);
          yPosition += 8;
        }
        if (report.data.totalExpenses !== undefined) {
          doc.setFont('helvetica', 'bold');
          doc.text('Total Expenses:', margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(`TZS ${report.data.totalExpenses.toLocaleString()}`, margin + 45, yPosition);
          yPosition += 8;
        }
        yPosition += 8;
      }

      // Content Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('REPORT CONTENT', margin, yPosition);
      doc.line(margin, yPosition + 2, margin + 55, yPosition + 2);
      yPosition += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const content = report.content || report.data?.content || report.description || 'No content available';
      const contentLines = doc.splitTextToSize(content, contentWidth);
      contentLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          margin,
          pageHeight - 10
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      }

      const fileName = `report-${report.title.replace(/\s+/g, '-').toLowerCase()}-${formatDate(report.created_at).replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
      setSuccess('Report downloaded successfully!');
    } catch (err) {
      console.error('Error generating report PDF:', err);
      setError('Failed to generate PDF. Please try again.');
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
    const searchContent = report.data?.content || '';
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || 
                             (filterDepartment === 'church-wide' && !report.department_id && !report.zone_id) ||
                             (filterDepartment === 'zones' && report.zone_id) ||
                             report.department_id === filterDepartment;
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesSource = filterSource === 'all' || report.source === filterSource;
    
    return matchesSearch && matchesDepartment && matchesType && matchesSource;
  });

  if (authLoading || loading) {
    return (
      <MainLayout title="Documents & Records">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  const title = 'Documents Management';
  const subtitle = 'Manage meeting minutes, reports, and church documents';

  return (
    <MainLayout 
      title={title}
      subtitle={subtitle}
    >
      <div className="max-w-7xl mx-auto">
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

        {/* Zone Access Notification */}
        {isZoneLeader && zoneName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-green-900">Zone Documents: {zoneName}</h3>
                <p className="text-green-700 text-sm mt-1">
                  You can view reports generated for your zone. Generate new reports from the Reports page.
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
              <nav className="flex space-x-0 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('minutes')}
                  className={`relative flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'minutes'
                      ? 'bg-red-100 text-red-600 rounded-tl-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Meeting Minutes</span>
                  {activeTab === 'minutes' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`relative flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'reports'
                      ? 'bg-red-100 text-red-600 rounded-tl-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Folder className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Reports</span>
                  {activeTab === 'reports' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
              </nav>
            </div>

            {/* Search and Filters */}
            <Card className="mb-4 md:mb-6">
              <CardBody className="p-3 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="md:col-span-1">
                    <Input
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                      className="text-xs md:text-sm"
                    />
                  </div>
                  {!isDepartmentLeader && !isZoneLeader && (
                    <Select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      placeholder="Filter by Entity"
                      className="text-xs md:text-sm"
                      options={[
                        { value: "all", label: "All Sources" },
                        ...(activeTab === 'reports' ? [
                          { value: "church-wide", label: "Church-wide" },
                          { value: "zones", label: "All Zones" }
                        ] : []),
                        ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                      ]}
                    />
                  )}
                  {activeTab === 'minutes' ? (
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      placeholder="Status"
                      className="text-xs md:text-sm"
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
                      className="text-xs md:text-sm"
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
                {/* Add Meeting Minutes Button */}
                <div className="flex justify-end mb-3 md:mb-4">
                  <Button
                    onClick={() => setIsMinutesModalOpen(true)}
                    icon={<Plus className="h-3 w-3 md:h-4 md:w-4" />}
                    className="text-xs md:text-sm px-3 md:px-4 py-2"
                  >
                    <span className="hidden md:inline">Add Meeting Minutes</span>
                    <span className="md:hidden">Add Minutes</span>
                  </Button>
                </div>
                
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
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Recorded By</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Attendees</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredMinutes.map((minute) => (
                            <tr key={minute.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{minute.department?.name} Meeting</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{minute.agenda}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden sm:table-cell">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {formatDate(minute.meeting_date)}
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden md:table-cell">
                                <div className="text-sm text-gray-600">
                                  {minute.recorder?.first_name} {minute.recorder?.last_name}
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden lg:table-cell">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="h-4 w-4 mr-2" />
                                  {minute.attendee_details?.length || 0}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {minute.approved_by ? (
                                  <Badge variant="success">Approved</Badge>
                                ) : (
                                  <Badge variant="warning">Pending</Badge>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex justify-end space-x-1">
                                  {!minute.approved_by && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleApproveMinutes(minute.id)}
                                      icon={<CheckCircle className="h-4 w-4" />}
                                      className="text-green-600 hover:text-green-700"
                                      title="Approve"
                                    />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewMinutes(minute)}
                                    icon={<Eye className="h-4 w-4" />}
                                    title="View"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadMinutesPDF(minute)}
                                    icon={<Download className="h-4 w-4" />}
                                    title="Download PDF"
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
                                    title="Delete"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <>
                {/* Add Report Button */}
                <div className="flex justify-end mb-3 md:mb-4">
                  <Button
                    onClick={() => setIsReportModalOpen(true)}
                    icon={<Plus className="h-3 w-3 md:h-4 md:w-4" />}
                    className="text-xs md:text-sm px-3 md:px-4 py-2"
                  >
                    <span className="hidden md:inline">Create Report</span>
                    <span className="md:hidden">Create</span>
                  </Button>
                </div>
                
                {/* Filter by Source */}
                <div className="flex gap-2 md:gap-4 mb-3 md:mb-4">
                  <Select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full md:w-48 text-xs md:text-sm"
                    options={[
                      { value: "all", label: "All Sources" },
                      { value: "generated", label: "Auto-generated" },
                      { value: "manual", label: "Manual" }
                    ]}
                  />
                </div>
                
                {filteredReports.length === 0 ? (
                  <EmptyState
                    icon={<Folder className="h-16 w-16 text-gray-400" />}
                    title="No Reports Found"
                    description="No reports match your current filters. Generate reports from the Reports page."
                    action={{
                      label: "Create Manual Report",
                      onClick: () => setIsReportModalOpen(true)
                    }}
                  />
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredReports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                                    <Folder className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{report.title}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {report.description || report.data?.content || 'No description'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden sm:table-cell">
                                <Badge 
                                  variant={
                                    report.type === 'annual' ? 'primary' :
                                    report.type === 'quarterly' ? 'info' :
                                    'success'
                                  }
                                >
                                  {report.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 hidden md:table-cell">
                                <div className="text-sm text-gray-600">
                                  {report.department ? (
                                    <span className="flex items-center">
                                      <Building2 className="h-4 w-4 mr-1" />
                                      {report.department.name}
                                    </span>
                                  ) : report.zone ? (
                                    <span className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {report.zone.name}
                                    </span>
                                  ) : (
                                    <span>Church-wide</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden lg:table-cell">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {formatDate(report.created_at)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {report.source === 'generated' ? (
                                  <Badge variant="warning">Auto</Badge>
                                ) : (
                                  <Badge variant="default">Manual</Badge>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewReport(report)}
                                    icon={<Eye className="h-4 w-4" />}
                                    title="View"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadReportPDF(report)}
                                    icon={<Download className="h-4 w-4" />}
                                    title="Download PDF"
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
                                    title="Delete"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

          {/* Create Meeting Minutes Modal */}
          <Modal
            isOpen={isMinutesModalOpen}
            onClose={() => setIsMinutesModalOpen(false)}
        title="Add Meeting Minutes"
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Department</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md sm:rounded-lg bg-gray-50 text-sm sm:text-base text-gray-700">
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
            rows={4}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Attendees
              </label>
              <select
                multiple
                value={minutesForm.attendees}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setMinutesForm({ ...minutesForm, attendees: selected });
                }}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50 text-sm"
                size={4}
              >
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <Input
              label="Next Meeting Date (Optional)"
              type="date"
              value={minutesForm.next_meeting_date}
              onChange={(e) => setMinutesForm({ ...minutesForm, next_meeting_date: e.target.value })}
            />
          </div>

          {/* Attachment Upload */}
          <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Attachment (Optional)</span>
              </div>
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1">
                <div className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer transition-colors ${
                  attachmentFile 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}>
                  {attachmentFile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <File className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      <span className="text-green-700 font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{attachmentFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAttachmentFile(null);
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 text-xs sm:text-sm">Click to upload or drag and drop</p>
                      <p className="text-gray-400 text-xs mt-1">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setError('File size must be less than 10MB');
                        return;
                      }
                      setAttachmentFile(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button variant="outline" onClick={() => {
            setIsMinutesModalOpen(false);
            setAttachmentFile(null);
          }} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleCreateMinutes} disabled={uploadingAttachment} className="w-full sm:w-auto">
            {uploadingAttachment ? 'Uploading...' : 'Save Minutes'}
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
        <div className="space-y-3 sm:space-y-4">
          <Input
            label="Report Title"
            value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
            placeholder="Enter report title"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Department</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md sm:rounded-lg bg-gray-50 text-sm sm:text-base text-gray-700">
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
            rows={6}
            required
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button variant="outline" onClick={() => setIsReportModalOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleCreateReport} className="w-full sm:w-auto">
            Create Report
          </Button>
        </div>
      </Modal>

      {/* View Meeting Minutes Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingMinutes(null);
        }}
        title="Meeting Minutes Details"
        size="lg"
      >
        {viewingMinutes && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 rounded-lg -mt-4 -mx-4 sm:-mx-6">
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                {viewingMinutes.department?.name} Meeting
              </h2>
              <div className="flex flex-wrap gap-3 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(viewingMinutes.meeting_date)}</span>
                </div>
                {viewingMinutes.approved_by ? (
                  <div className="flex items-center gap-1 bg-green-500 bg-opacity-30 px-2 py-0.5 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>Approved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-yellow-500 bg-opacity-30 px-2 py-0.5 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>Pending Approval</span>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Recorded By</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {viewingMinutes.recorder?.first_name} {viewingMinutes.recorder?.last_name}
                </p>
              </div>
              {viewingMinutes.next_meeting_date && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Next Meeting</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(viewingMinutes.next_meeting_date)}
                  </p>
                </div>
              )}
              {viewingMinutes.approved_by && viewingMinutes.approver && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Approved By</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {viewingMinutes.approver.first_name} {viewingMinutes.approver.last_name}
                  </p>
                </div>
              )}
              {viewingMinutes.approved_at && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Approved On</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(viewingMinutes.approved_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Agenda Section */}
            <div>
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Agenda
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingMinutes.agenda}</p>
              </div>
            </div>

            {/* Minutes Section */}
            <div>
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Minutes
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingMinutes.minutes}</p>
              </div>
            </div>

            {/* Attendees Section */}
            {viewingMinutes.attendee_details && viewingMinutes.attendee_details.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendees ({viewingMinutes.attendee_details.length})
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {viewingMinutes.attendee_details.map((attendee, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {attendee.first_name} {attendee.last_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attachment Section */}
            {viewingMinutes.attachment_url && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Attachment
                </h3>
                <a
                  href={viewingMinutes.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {getFileIcon(viewingMinutes.attachment_name || '')}
                  <span className="text-sm font-medium">{viewingMinutes.attachment_name || 'View Attachment'}</span>
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingMinutes(null);
                }}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadMinutesPDF(viewingMinutes)}
                icon={<Download className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Report Modal */}
      <Modal
        isOpen={isViewReportModalOpen}
        onClose={() => {
          setIsViewReportModalOpen(false);
          setViewingReport(null);
        }}
        title="Report Details"
        size="lg"
      >
        {viewingReport && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-lg -mt-4 -mx-4 sm:-mx-6">
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                {viewingReport.title}
              </h2>
              <div className="flex flex-wrap gap-3 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(viewingReport.created_at)}</span>
                </div>
                <div className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs font-medium">
                  {viewingReport.type.toUpperCase()}
                </div>
                {viewingReport.source === 'generated' && (
                  <div className="bg-yellow-400 bg-opacity-30 px-2 py-0.5 rounded text-xs font-medium">
                    Auto-generated
                  </div>
                )}
              </div>
            </div>

            {/* Report Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Department / Scope</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {viewingReport.department?.name || viewingReport.zone?.name || 'Church-wide'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Created By</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {viewingReport.generator?.first_name} {viewingReport.generator?.last_name}
                </p>
              </div>
              {viewingReport.period_start && viewingReport.period_end && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Report Period</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(viewingReport.period_start).toLocaleDateString()} - {new Date(viewingReport.period_end).toLocaleDateString()}
                  </p>
                </div>
              )}
              {viewingReport.description && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Description</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {viewingReport.description}
                  </p>
                </div>
              )}
            </div>

            {/* Statistics Section */}
            {viewingReport.data && (viewingReport.data.totalMembers !== undefined || viewingReport.data.totalIncome !== undefined || viewingReport.data.totalExpenses !== undefined) && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Statistics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {viewingReport.data.totalMembers !== undefined && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-900">{viewingReport.data.totalMembers}</p>
                      <p className="text-xs text-blue-600">Total Members</p>
                    </div>
                  )}
                  {viewingReport.data.totalIncome !== undefined && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-900">TZS {viewingReport.data.totalIncome.toLocaleString()}</p>
                      <p className="text-xs text-green-600">Total Income</p>
                    </div>
                  )}
                  {viewingReport.data.totalExpenses !== undefined && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <TrendingUp className="h-5 w-5 text-red-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-red-900">TZS {viewingReport.data.totalExpenses.toLocaleString()}</p>
                      <p className="text-xs text-red-600">Total Expenses</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Section */}
            <div>
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report Content
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {viewingReport.content || viewingReport.data?.content || 'No content available'}
                </p>
              </div>
            </div>

            {/* File Attachment */}
            {viewingReport.file_url && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Attached File
                </h3>
                <a
                  href={viewingReport.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {getFileIcon(viewingReport.data?.filename || 'report.pdf')}
                  <span className="text-sm font-medium">{viewingReport.data?.filename || 'View File'}</span>
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewReportModalOpen(false);
                  setViewingReport(null);
                }}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadReportPDF(viewingReport)}
                icon={<Download className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
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
    </MainLayout>
  );
}

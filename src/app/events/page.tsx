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
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  MapPin,
  Clock,
  DollarSign,
  UserCheck,
  Settings,
  Download
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: 'conference' | 'crusade' | 'seminar' | 'prayer_night' | 'workshop' | 'fellowship';
  start_date: string;
  end_date: string;
  location: string;
  organizer_id: string;
  department_id?: string;
  zone_id?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
  cost: number;
  is_active: boolean;
  created_at: string;
  organizer?: {
    first_name: string;
    last_name: string;
  };
  department?: {
    name: string;
  };
  zone?: {
    name: string;
  };
  registration_count?: number;
  attendance_count?: number;
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

interface Zone {
  id: string;
  name: string;
  is_active: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase, signOut } = useAuth();
  const { 
    departmentId, 
    departmentName, 
    isDepartmentLeader, 
    canAccessAllDepartments 
  } = useDepartmentAccess();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'fellowship' as Event['event_type'],
    start_date: '',
    end_date: '',
    location: '',
    department_id: '',
    zone_id: '',
    max_attendees: '',
    registration_required: false,
    registration_deadline: '',
    cost: '0'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('Events page auth state:', { 
      user: !!user, 
      userEmail: user?.email,
      authLoading,
      supabaseAvailable: !!supabase 
    });
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    if (user && supabase) {
      console.log('User authenticated, loading data');
      loadEvents();
      loadDepartments();
      loadZones();
    }
  }, [user, authLoading, supabase]);

  // Initialize form with department leader's department
  useEffect(() => {
    if (isDepartmentLeader && departmentId && !formData.department_id) {
      setFormData(prev => ({
        ...prev,
        department_id: departmentId
      }));
    }
  }, [isDepartmentLeader, departmentId]);

  const loadEvents = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setError('Database connection not available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading events from database...');
      
      // Test table access first
      const { count, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      console.log('Table access test:', { count, error: countError });
      
      // Also test RLS bypass (this will help identify RLS issues)
      const { data: rlsTestData, error: rlsTestError } = await supabase
        .rpc('get_events_count'); // We'll create this function if needed
        
      console.log('RLS test (if function exists):', { data: rlsTestData, error: rlsTestError });
      
      if (countError) {
        throw new Error(`Cannot access events table: ${countError.message}`);
      }
      
      if (count === 0) {
        console.warn('⚠️ ISSUE DETECTED: Events table returns 0 rows but Supabase editor shows 30 rows');
        console.warn('This suggests Row Level Security (RLS) policies are filtering out all events for this user');
        console.warn('User email:', user?.email);
        console.warn('User ID:', user?.id);
        
        // Check user's profile and role
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user?.id)
            .single();
            
          console.log('User profile check:', { profile: profileData, error: profileError });
          
          if (profileData) {
            console.log('User role:', profileData.role);
            console.log('User active:', profileData.is_active);
          }
        } catch (profileErr) {
          console.warn('Could not check user profile:', profileErr);
        }
        
        // Try different queries to understand RLS behavior
        console.log('🔍 Testing different query approaches...');
        
        // Test 1: Check if user can select any rows at all
        const { data: limitTest, error: limitError } = await supabase
          .from('events')
          .select('id')
          .limit(1);
        console.log('Limit 1 test:', { count: limitTest?.length || 0, error: limitError });
        
        // Test 2: Try with specific date range
        const { data: dateTest, error: dateError } = await supabase
          .from('events')
          .select('id, title')
          .gte('created_at', '2024-01-01')
          .limit(5);
        console.log('Date range test:', { count: dateTest?.length || 0, error: dateError });
        
        // Test 3: Check RLS status and policies
        console.log('🔍 Checking table RLS status...');
        try {
          const { data: rlsCheck } = await supabase.rpc('check_table_rls', { table_name: 'events' });
          console.log('RLS check result:', rlsCheck);
        } catch (rlsError) {
          console.log('RLS check not available, trying manual query');
        }
        
        // Test 4: Try to bypass RLS temporarily for testing
        console.log('🔍 Attempting to query without RLS restrictions...');
        const { data: bypassTest, error: bypassError } = await supabase
          .from('events')
          .select('id, title, created_at')
          .limit(3);
        console.log('Bypass test:', { 
          count: bypassTest?.length || 0, 
          error: bypassError?.message || 'none',
          sample: bypassTest?.[0] || 'none'
        });
      }
      
      // First, try simple query to get basic events data with department filtering
      let eventsQuery = supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      // Apply department filtering for department leaders
      if (isDepartmentLeader && departmentId) {
        eventsQuery = eventsQuery.eq('department_id', departmentId);
      }

      const { data: simpleData, error: simpleError } = await eventsQuery;

      console.log('Simple events query result:', { 
        dataCount: simpleData?.length || 0, 
        error: simpleError,
        sampleData: simpleData?.[0] 
      });

      if (simpleError) {
        console.error('Simple events query failed:', simpleError);
        throw new Error(`Failed to fetch events: ${simpleError.message}`);
      }

      if (!simpleData || simpleData.length === 0) {
        console.log('No events found in database');
        setEvents([]);
        setError('No events found in the database. Create your first event using the "Add Event" button.');
        return;
      }

      // If simple query works, try to enhance with joins
      console.log('Simple query successful, trying with joins for additional details...');
      
      let enhancedQuery = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(first_name, last_name),
          department:departments!department_id(name)
        `)
        .order('start_date', { ascending: false });

      // Apply department filtering for department leaders in enhanced query too
      if (isDepartmentLeader && departmentId) {
        enhancedQuery = enhancedQuery.eq('department_id', departmentId);
      }

      const { data: enhancedData, error: joinError } = await enhancedQuery;

      if (joinError) {
        console.warn('Join query failed, using simple data:', joinError);
        setEvents(simpleData);
        setError(`Loaded ${simpleData.length} events (organizer/department details unavailable: ${joinError.message})`);
      } else {
        console.log('Enhanced query successful:', enhancedData?.length || 0, 'events with details');
        setEvents(enhancedData || simpleData);
        setError(null); // Clear any previous errors
      }

    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(`Failed to load events: ${err.message || 'Unknown error'}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to test different connection methods
  const debugEventsAccess = async () => {
    if (!supabase || !user) return;
    
    console.log('🚀 DEBUGGING EVENTS ACCESS...');
    console.log('Current user:', user.email, user.id);
    
    try {
      // Method 1: Use debug function to get events count
      console.log('Method 1: Using debug function for events count...');
      const { data: countResult, error: countError } = await supabase.rpc('get_events_count');
      console.log('Events count via function:', { count: countResult, error: countError });
      
      // Method 2: Get sample events using debug function
      console.log('Method 2: Getting sample events via function...');
      const { data: sampleEvents, error: sampleError } = await supabase.rpc('get_sample_events', { limit_count: 3 });
      console.log('Sample events:', { events: sampleEvents, error: sampleError });
      
      // Method 3: Check user permissions
      console.log('Method 3: Checking user permissions...');
      const { data: permissions, error: permError } = await supabase.rpc('check_user_permissions');
      console.log('User permissions:', { permissions, error: permError });
      
      // Method 4: Check RLS policies
      console.log('Method 4: Checking RLS policies...');
      const { data: policies, error: policiesError } = await supabase.rpc('check_events_policies');
      console.log('RLS policies:', { policies, error: policiesError });
      
      // Method 5: Direct table access test
      console.log('Method 5: Direct table access...');
      const { data: directTest, error: directError } = await supabase
        .from('events')
        .select('id, title')
        .limit(1);
      console.log('Direct access test:', { 
        accessible: directTest !== null, 
        error: directError?.message,
        count: directTest?.length,
        data: directTest
      });
      
    } catch (debugError) {
      console.error('Debug error:', debugError);
    }
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

  const handleAddEvent = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location,
        organizer_id: user.profile.id,
        department_id: isDepartmentLeader && departmentId ? departmentId : (formData.department_id || null),
        zone_id: formData.zone_id || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        registration_required: formData.registration_required,
        registration_deadline: formData.registration_deadline || null,
        cost: parseFloat(formData.cost) || 0
      };

      const { error } = await supabase
        .from('events')
        .insert(eventData);

      if (error) throw error;

      setSuccess('Event created successfully!');
      setIsAddModalOpen(false);
      resetForm();
      loadEvents();
    } catch (err: any) {
      console.error('Error adding event:', err);
      setError(err.message);
    }
  };

  const handleEditEvent = async () => {
    if (!supabase || !selectedEvent) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location,
        department_id: isDepartmentLeader && departmentId ? departmentId : (formData.department_id || null),
        zone_id: formData.zone_id || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        registration_required: formData.registration_required,
        registration_deadline: formData.registration_deadline || null,
        cost: parseFloat(formData.cost) || 0
      };

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', selectedEvent.id);

      if (error) throw error;

      setSuccess('Event updated successfully!');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      resetForm();
      loadEvents();
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (!supabase || !selectedEvent) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', selectedEvent.id);

      if (error) throw error;

      setSuccess('Event deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'fellowship',
      start_date: '',
      end_date: '',
      location: '',
      department_id: isDepartmentLeader && departmentId ? departmentId : '',
      zone_id: '',
      max_attendees: '',
      registration_required: false,
      registration_deadline: '',
      cost: '0'
    });
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_date: new Date(event.start_date).toISOString().slice(0, 16),
      end_date: new Date(event.end_date).toISOString().slice(0, 16),
      location: event.location,
      department_id: isDepartmentLeader && departmentId ? departmentId : (event.department_id || ''),
      zone_id: event.zone_id || '',
      max_attendees: event.max_attendees?.toString() || '',
      registration_required: event.registration_required,
      registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : '',
      cost: event.cost.toString()
    });
    setIsEditModalOpen(true);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && event.is_active) ||
                         (filterStatus === 'inactive' && !event.is_active) ||
                         (filterStatus === 'upcoming' && new Date(event.start_date) > new Date()) ||
                         (filterStatus === 'past' && new Date(event.end_date) < new Date());
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getEventTypeColor = (type: string) => {
    const colors = {
      conference: 'bg-purple-100 text-purple-800',
      crusade: 'bg-red-100 text-red-800',
      seminar: 'bg-blue-100 text-blue-800',
      prayer_night: 'bg-green-100 text-green-800',
      workshop: 'bg-cyan-100 text-cyan-800',
      fellowship: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  if (authLoading || loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <MainLayout
      title="Events Management"
      subtitle="Manage church events, conferences, and activities"
    >
      <div className="max-w-7xl mx-auto">
        {/* Department Leader Access Notification */}
        {isDepartmentLeader && departmentName && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start sm:items-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-red-800">
                  Department Events: {departmentName}
                </h3>
                <p className="text-xs sm:text-sm text-red-700 mt-0.5">
                  Showing events for your department only.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div>
            {events.length > 0 && (
              <span className="text-xs sm:text-sm font-normal text-gray-500">
                ({events.length} {events.length === 1 ? 'event' : 'events'})
              </span>
            )}
          </div>
          <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    console.log('Manual refresh clicked');
                    await loadEvents();
                  }}
                  disabled={loading}
                  className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-red-700 hover:bg-red-800 text-white p-2 md:px-4 md:py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Add Event</span>
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert
                variant="error"
                onClose={() => setError('')}
                className="mb-3 sm:mb-4"
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                variant="success"
                onClose={() => setSuccess('')}
                className="mb-3 sm:mb-4"
              >
                {success}
              </Alert>
            )}

            {/* Search and Filters */}
            <Card className="mb-4 sm:mb-6" padding="sm" rounded="xl">
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    placeholder="Event Type"
                    options={[
                      { value: "all", label: "All Types" },
                      { value: "conference", label: "Conference" },
                      { value: "crusade", label: "Crusade" },
                      { value: "seminar", label: "Seminar" },
                      { value: "prayer_night", label: "Prayer Night" },
                      { value: "workshop", label: "Workshop" },
                      { value: "fellowship", label: "Fellowship" }
                    ]}
                  />
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    placeholder="Status"
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "upcoming", label: "Upcoming" },
                      { value: "past", label: "Past" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" }
                    ]}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />}
                title={events.length === 0 ? "No Events Yet" : "No Events Match Filters"}
                description={
                  events.length === 0 
                    ? "Get started by creating your first church event."
                    : "Try adjusting your search or filters."
                }
                action={{
                  label: events.length === 0 ? "Create Event" : "Clear Filters",
                  onClick: events.length === 0 
                    ? () => setIsAddModalOpen(true)
                    : () => {
                        setSearchTerm('');
                        setFilterType('all');
                        setFilterStatus('all');
                      }
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow" padding="sm" rounded="xl">
                    <CardBody>
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 truncate">
                            {event.title}
                          </h3>
                          <Badge 
                            variant="default" 
                            className={`text-xs ${getEventTypeColor(event.event_type)}`}
                          >
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/events/${event.id}`)}
                            icon={<Eye className="h-4 w-4" />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(event)}
                            icon={<Edit className="h-4 w-4" />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsDeleteModalOpen(true);
                            }}
                            icon={<Trash2 className="h-4 w-4" />}
                            className="text-red-600 hover:text-red-700"
                          />
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{event.location}</span>
                        </div>
                        {event.department && (
                          <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            <span>{event.department.name}</span>
                          </div>
                        )}
                        {event.cost > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>TZS {event.cost.toLocaleString()}</span>
                          </div>
                        )}
                        {event.registration_required && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>
                                {event.registration_count || 0}
                                {event.max_attendees && `/${event.max_attendees}`} registered
                              </span>
                            </div>
                            {event.attendance_count !== undefined && (
                              <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-1" />
                                <span>{event.attendance_count} attended</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <Badge 
                            variant={new Date(event.start_date) > new Date() ? 'success' : 'default'}
                          >
                            {new Date(event.start_date) > new Date() ? 'Upcoming' : 'Past'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            by {event.organizer?.first_name} {event.organizer?.last_name}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

        {/* Add Event Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Event"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
            required
          />
          
          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter event description"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as Event['event_type'] })}
              required
              options={[
                { value: "fellowship", label: "Fellowship" },
                { value: "conference", label: "Conference" },
                { value: "crusade", label: "Crusade" },
                { value: "seminar", label: "Seminar" },
                { value: "prayer_night", label: "Prayer Night" },
                { value: "workshop", label: "Workshop" }
              ]}
            />

            {isDepartmentLeader && departmentName ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {departmentName}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Events will be created for your department
                </p>
              </div>
            ) : (
              <Select
                label="Department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: "", label: "No Department" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
              />
            )}
          </div>

          <Select
            label="Zone (Optional)"
            value={formData.zone_id}
            onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
            options={[
              { value: "", label: "No Zone" },
              ...zones.map(zone => ({ value: zone.id, label: zone.name }))
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter event location"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Max Attendees (Optional)"
              type="number"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              placeholder="No limit"
            />
            <Input
              label="Cost (TZS)"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="registration_required"
              checked={formData.registration_required}
              onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="registration_required" className="text-sm text-gray-700">
              Registration Required
            </label>
          </div>

          {formData.registration_required && (
            <Input
              label="Registration Deadline"
              type="datetime-local"
              value={formData.registration_deadline}
              onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 mt-4 sm:mt-6">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddEvent}>
            Create Event
          </Button>
        </div>
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Event"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
            required
          />
          
          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter event description"
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as Event['event_type'] })}
              required
              options={[
                { value: "fellowship", label: "Fellowship" },
                { value: "conference", label: "Conference" },
                { value: "crusade", label: "Crusade" },
                { value: "seminar", label: "Seminar" },
                { value: "prayer_night", label: "Prayer Night" },
                { value: "workshop", label: "Workshop" }
              ]}
            />

            {isDepartmentLeader && departmentName ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {departmentName}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Editing events for your department
                </p>
              </div>
            ) : (
              <Select
                label="Department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: "", label: "No Department" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
              />
            )}
          </div>

          <Select
            label="Zone (Optional)"
            value={formData.zone_id}
            onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
            options={[
              { value: "", label: "No Zone" },
              ...zones.map(zone => ({ value: zone.id, label: zone.name }))
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter event location"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Max Attendees (Optional)"
              type="number"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              placeholder="No limit"
            />
            <Input
              label="Cost (TZS)"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit_registration_required"
              checked={formData.registration_required}
              onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="edit_registration_required" className="text-sm text-gray-700">
              Registration Required
            </label>
          </div>

          {formData.registration_required && (
            <Input
              label="Registration Deadline"
              type="datetime-local"
              value={formData.registration_deadline}
              onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditEvent}>
            Update Event
          </Button>
        </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteEvent}
          title="Delete Event"
          message={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
        </div>
      </MainLayout>
    );
  }

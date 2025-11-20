'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
  registration_count?: number;
  attendance_count?: number;
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase, signOut } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'fellowship' as Event['event_type'],
    start_date: '',
    end_date: '',
    location: '',
    department_id: '',
    max_attendees: '',
    registration_required: false,
    registration_deadline: '',
    cost: '0'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
    if (user) {
      loadEvents();
      loadDepartments();
    }
  }, [user, authLoading]);

  const loadEvents = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles(first_name, last_name),
          department:departments(name),
          registrations:event_registrations(count),
          attendance:event_registrations(count).filter(attended.eq.true)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
        department_id: formData.department_id || null,
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
        department_id: formData.department_id || null,
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
      department_id: '',
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
      department_id: event.department_id || '',
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
    const matchesDepartment = filterDepartment === 'all' || event.department_id === filterDepartment;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && event.is_active) ||
                         (filterStatus === 'inactive' && !event.is_active) ||
                         (filterStatus === 'upcoming' && new Date(event.start_date) > new Date()) ||
                         (filterStatus === 'past' && new Date(event.end_date) < new Date());
    
    return matchesSearch && matchesType && matchesDepartment && matchesStatus;
  });

  const getEventTypeColor = (type: string) => {
    const colors = {
      conference: 'bg-purple-100 text-purple-800',
      crusade: 'bg-red-100 text-red-800',
      seminar: 'bg-blue-100 text-blue-800',
      prayer_night: 'bg-green-100 text-green-800',
      workshop: 'bg-yellow-100 text-yellow-800',
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
                <h1 className="text-3xl font-bold text-gray-900">Church Events</h1>
                <p className="text-gray-600 mt-1">Manage church events, conferences, and activities</p>
              </div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Event
              </Button>
            </div>

            {/* Alerts */}
            {error && (
              <Alert
                variant="error"
                onClose={() => setError('')}
                className="mb-4"
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                variant="success"
                onClose={() => setSuccess('')}
                className="mb-4"
              >
                {success}
              </Alert>
            )}

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
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
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    placeholder="Department"
                    options={[
                      { value: "all", label: "All Departments" },
                      ...departments.map(dept => ({ value: dept.id, label: dept.name }))
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
                icon={<Calendar className="h-16 w-16 text-gray-400" />}
                title="No Events Found"
                description="No events match your current filters. Try adjusting your search criteria."
                action={{
                  label: "Create First Event",
                  onClick: () => setIsAddModalOpen(true)
                }}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardBody>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {event.title}
                          </h3>
                          <Badge 
                            variant="default" 
                            className={getEventTypeColor(event.event_type)}
                          >
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
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
          </div>
        </div>
      </div>

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

            <Select
              label="Department"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={[
                { value: "", label: "No Department" },
                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
              ]}
            />
          </div>

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

        <div className="flex justify-end space-x-3 mt-6">
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

            <Select
              label="Department"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={[
                { value: "", label: "No Department" },
                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
              ]}
            />
          </div>

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

        <div className="flex justify-end space-x-3 mt-6">
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
  );
}

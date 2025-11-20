'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { 
  Button, 
  Card, 
  CardBody, 
  Badge, 
  Avatar, 
  EmptyState, 
  Loading, 
  Alert,
  Modal,
  Input,
  Table
} from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  UserCheck,
  UserPlus,
  Edit,
  Trash2,
  Download,
  Settings,
  CheckCircle,
  XCircle
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
    email: string;
  };
  department?: {
    name: string;
  };
}

interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string;
  registered_at: string;
  attended: boolean;
  payment_status: string;
  notes?: string;
  member: {
    id: string;
    member_number: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    photo_url?: string;
  };
}

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [isAddRegistrationModalOpen, setIsAddRegistrationModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  
  // Filter states
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
    if (user && params.id) {
      loadEventDetails();
      loadRegistrations();
      loadMembers();
    }
  }, [user, authLoading, params.id]);

  const loadEventDetails = async () => {
    if (!supabase || !params.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles(first_name, last_name, email),
          department:departments(name)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setEvent(data);
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    if (!supabase || !params.id) return;
    
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          member:members(
            id,
            member_number,
            first_name,
            last_name,
            phone,
            email,
            photo_url
          )
        `)
        .eq('event_id', params.id)
        .order('registered_at', { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
    } catch (err: any) {
      console.error('Error loading registrations:', err);
      setError(err.message);
    }
  };

  const loadMembers = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, member_number, first_name, last_name, phone, email')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;

      setMembers(data || []);
    } catch (err: any) {
      console.error('Error loading members:', err);
    }
  };

  const handleAddRegistration = async () => {
    if (!supabase || !selectedMemberId || !params.id) return;

    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: params.id,
          member_id: selectedMemberId,
          payment_status: paymentStatus,
          notes: notes || null
        });

      if (error) throw error;

      setSuccess('Registration added successfully!');
      setIsAddRegistrationModalOpen(false);
      setSelectedMemberId('');
      setPaymentStatus('pending');
      setNotes('');
      loadRegistrations();
    } catch (err: any) {
      console.error('Error adding registration:', err);
      setError(err.message);
    }
  };

  const toggleAttendance = async (registrationId: string, currentStatus: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended: !currentStatus })
        .eq('id', registrationId);

      if (error) throw error;

      setSuccess(`Attendance ${!currentStatus ? 'marked' : 'unmarked'} successfully!`);
      loadRegistrations();
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      setError(err.message);
    }
  };

  const updatePaymentStatus = async (registrationId: string, newStatus: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ payment_status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      setSuccess('Payment status updated successfully!');
      loadRegistrations();
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      setError(err.message);
    }
  };

  const removeRegistration = async (registrationId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      setSuccess('Registration removed successfully!');
      loadRegistrations();
    } catch (err: any) {
      console.error('Error removing registration:', err);
      setError(err.message);
    }
  };

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

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      waived: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRegistrations = registrations.filter(reg => {
    const attendanceMatch = attendanceFilter === 'all' || 
                           (attendanceFilter === 'attended' && reg.attended) ||
                           (attendanceFilter === 'not_attended' && !reg.attended);
    const paymentMatch = paymentFilter === 'all' || reg.payment_status === paymentFilter;
    return attendanceMatch && paymentMatch;
  });

  const stats = {
    totalRegistrations: registrations.length,
    attended: registrations.filter(r => r.attended).length,
    paidRegistrations: registrations.filter(r => r.payment_status === 'paid').length,
    pendingPayments: registrations.filter(r => r.payment_status === 'pending').length
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Calendar className="h-16 w-16 text-gray-400" />}
            title="Event Not Found"
            description="The event you're looking for doesn't exist or has been deleted."
            action={{
              label: "Back to Events",
              onClick: () => router.push('/events')
            }}
          />
        </div>
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/events')}
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back to Events
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  <p className="text-gray-600 mt-1">Event Details & Registration Management</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/events/${event.id}/edit`)}
                  icon={<Edit className="h-4 w-4" />}
                >
                  Edit Event
                </Button>
                {event.registration_required && (
                  <Button
                    onClick={() => setIsAddRegistrationModalOpen(true)}
                    icon={<UserPlus className="h-4 w-4" />}
                  >
                    Add Registration
                  </Button>
                )}
              </div>
            </div>

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

            {/* Event Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Main Event Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardBody>
                    <div className="flex justify-between items-start mb-4">
                      <Badge 
                        variant="default" 
                        className={getEventTypeColor(event.event_type)}
                      >
                        {event.event_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge 
                        variant={new Date(event.start_date) > new Date() ? 'success' : 'default'}
                      >
                        {new Date(event.start_date) > new Date() ? 'Upcoming' : 'Past'}
                      </Badge>
                    </div>

                    {event.description && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600">{event.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p className="font-medium">{formatDate(event.start_date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">End Date</p>
                            <p className="font-medium">{formatDate(event.end_date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{event.location}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {event.cost > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">Cost</p>
                              <p className="font-medium">TZS {event.cost.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {event.department && (
                          <div className="flex items-center">
                            <Settings className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">Department</p>
                              <p className="font-medium">{event.department.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Organizer</p>
                            <p className="font-medium">
                              {event.organizer?.first_name} {event.organizer?.last_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Statistics */}
              <div className="space-y-6">
                <Card>
                  <CardBody>
                    <h3 className="font-semibold text-gray-900 mb-4">Registration Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Registrations</span>
                        <span className="font-semibold text-2xl text-blue-600">{stats.totalRegistrations}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Attended</span>
                        <span className="font-semibold text-green-600">{stats.attended}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Paid</span>
                        <span className="font-semibold text-blue-600">{stats.paidRegistrations}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Pending Payment</span>
                        <span className="font-semibold text-yellow-600">{stats.pendingPayments}</span>
                      </div>
                      {event.max_attendees && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-semibold">
                            {stats.totalRegistrations}/{event.max_attendees}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {event.registration_deadline && (
                  <Card>
                    <CardBody>
                      <h3 className="font-semibold text-gray-900 mb-2">Registration Deadline</h3>
                      <p className="text-gray-600">{formatDate(event.registration_deadline)}</p>
                      {new Date(event.registration_deadline) < new Date() && (
                        <Badge variant="danger" className="mt-2">
                          Registration Closed
                        </Badge>
                      )}
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>

            {/* Registrations List */}
            {event.registration_required && (
              <Card>
                <CardBody>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Event Registrations</h3>
                    <div className="flex space-x-3">
                      <select
                        value={attendanceFilter}
                        onChange={(e) => setAttendanceFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Attendance</option>
                        <option value="attended">Attended</option>
                        <option value="not_attended">Not Attended</option>
                      </select>
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Payments</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="waived">Waived</option>
                      </select>
                      <Button
                        variant="outline"
                        icon={<Download className="h-4 w-4" />}
                        size="sm"
                      >
                        Export
                      </Button>
                    </div>
                  </div>

                  {filteredRegistrations.length === 0 ? (
                    <EmptyState
                      icon={<Users className="h-12 w-12 text-gray-400" />}
                      title="No Registrations Found"
                      description="No registrations match your current filters."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Registration Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredRegistrations.map((registration) => (
                            <tr key={registration.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar
                                    src={registration.member.photo_url}
                                    name={`${registration.member.first_name} ${registration.member.last_name}`}
                                    size="sm"
                                    className="mr-3"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {registration.member.first_name} {registration.member.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      #{registration.member.member_number}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(registration.registered_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={registration.payment_status}
                                  onChange={(e) => updatePaymentStatus(registration.id, e.target.value)}
                                  className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getPaymentStatusColor(registration.payment_status)}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  <option value="partial">Partial</option>
                                  <option value="waived">Waived</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleAttendance(registration.id, registration.attended)}
                                  icon={registration.attended ? 
                                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                  }
                                  className={registration.attended ? 'text-green-600' : 'text-gray-400'}
                                >
                                  {registration.attended ? 'Attended' : 'Mark Present'}
                                </Button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRegistration(registration.id)}
                                  icon={<Trash2 className="h-4 w-4" />}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Registration Modal */}
      <Modal
        isOpen={isAddRegistrationModalOpen}
        onClose={() => setIsAddRegistrationModalOpen(false)}
        title="Add Event Registration"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a member...</option>
              {members.filter(member => 
                !registrations.some(reg => reg.member_id === member.id)
              ).map(member => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name} (#{member.member_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="waived">Waived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any notes about this registration..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsAddRegistrationModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddRegistration} disabled={!selectedMemberId}>
            Add Registration
          </Button>
        </div>
      </Modal>
    </div>
  );
}
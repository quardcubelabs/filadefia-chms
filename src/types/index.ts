// Database Types for FCC Church Management System

export type UserRole = 
  | 'administrator' 
  | 'pastor' 
  | 'treasurer' 
  | 'secretary' 
  | 'department_leader' 
  | 'member';

export type MemberStatus = 'active' | 'visitor' | 'transferred' | 'inactive';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export type Gender = 'male' | 'female';

export type DepartmentPosition = 'chairperson' | 'secretary' | 'treasurer' | 'coordinator' | 'member';

export type AttendanceType = 'sunday_service' | 'midweek_fellowship' | 'special_event' | 'department_meeting';

export type TransactionType = 'tithe' | 'offering' | 'donation' | 'project' | 'pledge' | 'mission' | 'welfare' | 'expense';

export type EventType = 'conference' | 'crusade' | 'seminar' | 'prayer_night' | 'workshop' | 'fellowship';

export type NotificationType = 'sms' | 'email' | 'whatsapp';

// Database Tables

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: Gender;
  date_of_birth: string;
  marital_status: MaritalStatus;
  phone: string;
  email?: string;
  address: string;
  occupation?: string;
  employer?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  baptism_date?: string;
  membership_date: string;
  status: MemberStatus;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  leader_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  member_id: string;
  position: DepartmentPosition;
  joined_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  event_id?: string;
  attendance_type: AttendanceType;
  date: string;
  present: boolean;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  member_id?: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string; // TZS, USD, etc.
  description?: string;
  payment_method: string;
  reference_number?: string;
  department_id?: string;
  date: string;
  recorded_by: string;
  verified: boolean;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string;
  organizer_id: string;
  department_id?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string;
  registered_at: string;
  attended: boolean;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  department_id?: string; // null means church-wide
  priority: 'low' | 'medium' | 'high';
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  recipient_ids: string[];
  message: string;
  type: NotificationType;
  subject?: string;
  sent_by: string;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduled_at?: string;
}

export interface MeetingMinutes {
  id: string;
  department_id: string;
  meeting_date: string;
  agenda: string;
  minutes: string;
  attendees: string[];
  next_meeting_date?: string;
  recorded_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual';
  department_id?: string;
  period_start: string;
  period_end: string;
  data: any; // JSON data
  generated_by: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form Types
export interface MemberFormData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: Gender;
  date_of_birth: string;
  marital_status: MaritalStatus;
  phone: string;
  email?: string;
  address: string;
  occupation?: string;
  employer?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  baptism_date?: string;
  departments: string[];
}

export interface EventFormData {
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string;
  department_id?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
}

export interface FinancialFormData {
  member_id?: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  payment_method: string;
  reference_number?: string;
  department_id?: string;
  date: string;
}

// Dashboard Types
export interface DashboardStats {
  total_members: number;
  active_members: number;
  total_departments: number;
  monthly_income: number;
  monthly_expenses: number;
  attendance_rate: number;
  upcoming_events: number;
}

export interface AttendanceStats {
  date: string;
  count: number;
  percentage: number;
}

export interface FinancialStats {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

// Component Props Types
export interface MemberCardProps {
  member: Member;
  departments?: Department[];
  onEdit?: (member: Member) => void;
  onDelete?: (memberId: string) => void;
}

export interface DepartmentCardProps {
  department: Department & {
    member_count: number;
    leader_name?: string;
  };
  onEdit?: (department: Department) => void;
  onView?: (departmentId: string) => void;
}
-- FCC Church Management System Database Schema
-- Tanzania Assemblies of God (TAG) Structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM (
  'administrator', 
  'pastor', 
  'treasurer', 
  'secretary', 
  'department_leader', 
  'member'
);

CREATE TYPE member_status AS ENUM ('active', 'visitor', 'transferred', 'inactive');
CREATE TYPE marital_status AS ENUM ('single', 'married', 'divorced', 'widowed');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE department_position AS ENUM ('chairperson', 'secretary', 'treasurer', 'coordinator', 'member');
CREATE TYPE attendance_type AS ENUM ('sunday_service', 'midweek_fellowship', 'special_event', 'department_meeting');
CREATE TYPE transaction_type AS ENUM ('tithe', 'offering', 'donation', 'project', 'pledge', 'mission', 'welfare', 'expense');
CREATE TYPE event_type AS ENUM ('conference', 'crusade', 'seminar', 'prayer_night', 'workshop', 'fellowship');
CREATE TYPE notification_type AS ENUM ('sms', 'email', 'whatsapp');
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE report_type AS ENUM ('monthly', 'quarterly', 'annual');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'member',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  gender gender NOT NULL,
  date_of_birth DATE NOT NULL,
  marital_status marital_status NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  occupation TEXT,
  employer TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  baptism_date DATE,
  membership_date DATE DEFAULT CURRENT_DATE,
  status member_status DEFAULT 'active',
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table (TAG structure)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  swahili_name TEXT,
  description TEXT,
  leader_id UUID REFERENCES members(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Department members table (many-to-many relationship)
CREATE TABLE department_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  position department_position DEFAULT 'member',
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, member_id)
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID, -- Will reference events table
  attendance_type attendance_type NOT NULL,
  date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial transactions table
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id),
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'TZS',
  description TEXT,
  payment_method TEXT NOT NULL, -- Cash, M-Pesa, TigoPesa, Airtel Money, Bank, etc.
  reference_number TEXT,
  department_id UUID REFERENCES departments(id),
  date DATE NOT NULL,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  department_id UUID REFERENCES departments(id),
  max_attendees INTEGER,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  cost DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  UNIQUE(event_id, member_id)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  department_id UUID REFERENCES departments(id), -- null means church-wide
  priority priority DEFAULT 'medium',
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communications table (for tracking sent messages)
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_ids UUID[] NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  subject TEXT,
  sent_by UUID REFERENCES profiles(id) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status delivery_status DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  cost DECIMAL(10,2) DEFAULT 0
);

-- Meeting minutes table
CREATE TABLE meeting_minutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  agenda TEXT NOT NULL,
  minutes TEXT NOT NULL,
  attendees UUID[] NOT NULL,
  next_meeting_date DATE,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type report_type NOT NULL,
  department_id UUID REFERENCES departments(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  generated_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pledges table (for tracking financial commitments)
CREATE TABLE pledges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(15,2) DEFAULT 0 CHECK (paid_amount >= 0),
  currency TEXT DEFAULT 'TZS',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for events attendance
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_event 
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_member_number ON members(member_number);

CREATE INDEX idx_department_members_department ON department_members(department_id);
CREATE INDEX idx_department_members_member ON department_members(member_id);
CREATE INDEX idx_department_members_active ON department_members(is_active);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_type ON attendance(attendance_type);

CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_member ON financial_transactions(member_id);
CREATE INDEX idx_financial_transactions_department ON financial_transactions(department_id);

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_department ON events(department_id);
CREATE INDEX idx_events_active ON events(is_active);

CREATE INDEX idx_announcements_department ON announcements(department_id);
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_expires ON announcements(expires_at);

-- Create update timestamp functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pledges_updated_at BEFORE UPDATE ON pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor')
  )
);

-- Members: Authenticated users can read, admins/staff can modify
CREATE POLICY "Authenticated users can view members" ON members FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage members" ON members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Similar policies for other tables...
-- (Add more specific policies based on your security requirements)

-- Insert initial TAG departments
INSERT INTO departments (name, swahili_name, description) VALUES
('Youth Department', 'Vijana – TAG Youth Movement', 'Ministry for young people aged 15-35'),
('Women''s Department', 'Wanawake wa TAG / Women''s Fellowship', 'Ministry for women of all ages'),
('Men''s Department', 'Wanaume wa TAG / Brotherhood Ministry', 'Ministry for men of all ages'),
('Children''s Department', 'Watoto / Sunday School Ministry', 'Ministry for children under 15 years'),
('Evangelism Department', 'Huduma ya Uinjilisti', 'Outreach and evangelistic activities'),
('Choir & Praise Team', 'Huduma ya Uimbaji / Praise & Worship', 'Music and worship ministry'),
('Prayer & Intercession Department', 'Huduma ya Maombi na Maombezi', 'Prayer ministry and intercession'),
('Ushering Department', 'Huduma ya Ukarimu / Usher Ministry', 'Hospitality and ushering services'),
('Media & Technical Department', 'Huduma ya Vyombo vya Habari na Teknolojia', 'Audio/visual and technical support'),
('Discipleship & Teaching Department', 'Huduma ya Mafundisho na Ushirika', 'Teaching and discipleship programs'),
('Mission & Outreach Department', 'Huduma ya Misioni na Nje', 'Mission work and community outreach'),
('Welfare & Counseling Department', 'Huduma ya Kiroho na Kijamii', 'Counseling and welfare services');

-- Insert initial system settings
INSERT INTO system_settings (key, value, description) VALUES
('church_name', 'Filadefia Christian Center', 'Official church name'),
('church_short_name', 'FCC', 'Church abbreviation'),
('church_denomination', 'Tanzania Assemblies of God (TAG)', 'Church denomination'),
('default_currency', 'TZS', 'Default currency for financial transactions'),
('member_number_prefix', 'FCC', 'Prefix for member numbers'),
('sms_provider', 'local', 'SMS service provider'),
('email_notifications', 'true', 'Enable email notifications'),
('backup_frequency', 'weekly', 'Database backup frequency'),
('session_timeout', '24', 'Session timeout in hours'),
('max_file_size', '10', 'Maximum file upload size in MB');
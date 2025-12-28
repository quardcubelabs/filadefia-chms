-- Check what tables exist and create missing ones for reports functionality

-- First, check what tables currently exist
SELECT 'Current tables in database:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check if the required tables exist
SELECT 'Checking required tables...' as info;

-- Create missing tables if they don't exist
-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create types if they don't exist
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM (
      'administrator', 
      'pastor', 
      'treasurer', 
      'secretary', 
      'department_leader', 
      'member'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE member_status AS ENUM ('active', 'visitor', 'transferred', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE marital_status AS ENUM ('single', 'married', 'divorced', 'widowed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE transaction_type AS ENUM ('tithe', 'offering', 'donation', 'project', 'pledge', 'mission', 'welfare', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
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

-- Create members table if it doesn't exist
CREATE TABLE IF NOT EXISTS members (
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

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  swahili_name TEXT,
  description TEXT,
  leader_id UUID REFERENCES members(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create department_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS department_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  position TEXT DEFAULT 'member',
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, member_id)
);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  department_id UUID REFERENCES departments(id),
  event_type TEXT DEFAULT 'conference',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(event_id, member_id)
);

-- Create financial_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  department_id UUID REFERENCES departments(id),
  member_id UUID REFERENCES members(id),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  department_id UUID REFERENCES departments(id),
  is_priority BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some basic departments if table is empty
INSERT INTO departments (name, swahili_name, description) 
SELECT * FROM (VALUES 
  ('Youth Department', 'Idara ya Vijana', 'Ministry focused on young people'),
  ('Womens Department', 'Idara ya Wanawake', 'Ministry focused on women'),
  ('Mens Department', 'Idara ya Wanaume', 'Ministry focused on men'),
  ('Children Department', 'Idara ya Watoto', 'Ministry focused on children')
) AS new_departments(name, swahili_name, description)
WHERE NOT EXISTS (SELECT 1 FROM departments);

-- Verify the tables now exist
SELECT 'Tables after creation:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'members', 'departments', 'department_members', 'events', 'event_registrations', 'financial_transactions', 'announcements')
ORDER BY tablename;

-- Show row counts
SELECT 'Row counts:' as info;
SELECT 'members' as table_name, count(*) as count FROM members
UNION ALL
SELECT 'departments', count(*) FROM departments  
UNION ALL
SELECT 'events', count(*) FROM events
UNION ALL
SELECT 'financial_transactions', count(*) FROM financial_transactions
UNION ALL
SELECT 'announcements', count(*) FROM announcements
ORDER BY table_name;
-- Complete setup script for visitors, assets, work plans, strategic plans, and attendance
-- Creates tables if they don't exist and fixes RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- PREREQUISITE: Create types if they don't exist
-- ============================================

DO $$ 
BEGIN
  -- Asset enums
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category') THEN
    CREATE TYPE asset_category AS ENUM (
      'property', 'vehicle', 'electronics', 'furniture', 'musical_instruments',
      'office_equipment', 'kitchen_equipment', 'sound_system', 'lighting', 'tools', 'other'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_condition') THEN
    CREATE TYPE asset_condition AS ENUM (
      'excellent', 'good', 'fair', 'poor', 'needs_repair', 'non_functional'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
    CREATE TYPE asset_status AS ENUM (
      'active', 'in_use', 'in_storage', 'under_maintenance', 'disposed', 'donated', 'sold', 'lost'
    );
  END IF;
  
  -- Plan enums
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_status') THEN
    CREATE TYPE plan_status AS ENUM ('draft', 'active', 'completed', 'cancelled', 'on_hold');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_scope') THEN
    CREATE TYPE plan_scope AS ENUM ('church', 'department', 'zone');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');
  END IF;
END $$;

-- ============================================
-- VISITORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  gender TEXT,
  date_of_birth DATE,
  marital_status TEXT,
  occupation TEXT,
  how_did_you_hear TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_date DATE,
  referred_by_member_id UUID,
  visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
  followed_up BOOLEAN DEFAULT false,
  followed_up_by UUID,
  followed_up_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_number TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other',
  condition TEXT DEFAULT 'good',
  status TEXT DEFAULT 'active',
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  currency TEXT DEFAULT 'TZS',
  location TEXT,
  department_id UUID,
  assigned_to UUID,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  warranty_expiry DATE,
  photo_url TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSET MAINTENANCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  performed_by TEXT,
  performed_date DATE NOT NULL,
  next_maintenance_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORK PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS work_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT DEFAULT 'church',
  department_id UUID,
  zone_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORK PLAN TASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS work_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STRATEGIC PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  vision TEXT,
  mission TEXT,
  description TEXT,
  scope TEXT DEFAULT 'church',
  department_id UUID,
  zone_id UUID,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STRATEGIC GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategic_plan_id UUID REFERENCES strategic_plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_metric TEXT,
  target_value TEXT,
  current_value TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STRATEGIC OBJECTIVES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategic_goal_id UUID REFERENCES strategic_goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  key_result TEXT,
  assigned_to UUID,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  date DATE NOT NULL,
  attendance_type VARCHAR(50) NOT NULL,
  present BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  event_id UUID,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  attendance_type VARCHAR(50) NOT NULL,
  session_name VARCHAR(200),
  department_id UUID,
  event_id UUID,
  created_by UUID,
  total_members INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  qr_code_data_url TEXT,
  qr_session_id VARCHAR(50),
  qr_check_in_url TEXT,
  qr_expires_at TIMESTAMP WITH TIME ZONE,
  qr_is_active BOOLEAN DEFAULT FALSE,
  qr_check_ins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QR ATTENDANCE SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS qr_attendance_sessions (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  attendance_type VARCHAR(50) NOT NULL,
  session_name VARCHAR(200) NOT NULL,
  department_id UUID,
  event_id UUID,
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  check_ins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_visited_date ON visitors(visited_date);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_work_plans_status ON work_plans(status);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_status ON strategic_plans(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);

-- ============================================
-- ENABLE RLS AND CREATE PERMISSIVE POLICIES
-- ============================================

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create permissive ones
DO $$ 
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['visitors', 'assets', 'asset_maintenance', 'work_plans', 'work_plan_tasks', 
                          'strategic_plans', 'strategic_goals', 'strategic_objectives', 
                          'attendance', 'attendance_sessions', 'qr_attendance_sessions'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Drop all existing policies on the table
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access to %I" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Staff can view all %I" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Staff can create %I" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Staff can update %I" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can delete %I" ON %I', tbl, tbl);
    
    -- Create permissive policy
    EXECUTE format('CREATE POLICY "Allow all access" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- Grant permissions
GRANT ALL ON visitors TO authenticated, anon, service_role;
GRANT ALL ON assets TO authenticated, anon, service_role;
GRANT ALL ON asset_maintenance TO authenticated, anon, service_role;
GRANT ALL ON work_plans TO authenticated, anon, service_role;
GRANT ALL ON work_plan_tasks TO authenticated, anon, service_role;
GRANT ALL ON strategic_plans TO authenticated, anon, service_role;
GRANT ALL ON strategic_goals TO authenticated, anon, service_role;
GRANT ALL ON strategic_objectives TO authenticated, anon, service_role;
GRANT ALL ON attendance TO authenticated, anon, service_role;
GRANT ALL ON attendance_sessions TO authenticated, anon, service_role;
GRANT ALL ON qr_attendance_sessions TO authenticated, anon, service_role;

SELECT 'All tables created and RLS policies configured successfully!' AS status;

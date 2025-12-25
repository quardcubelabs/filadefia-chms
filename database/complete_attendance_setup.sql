-- Complete Attendance System Database Setup
-- Run this script to create all missing tables and fix RLS policies

-- ========================================
-- 1. CREATE ATTENDANCE TABLES
-- ========================================

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    date DATE NOT NULL,
    attendance_type VARCHAR(50) NOT NULL, 
    present BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    event_id UUID,
    recorded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate attendance records
    UNIQUE(member_id, date, attendance_type, event_id)
);

-- QR attendance sessions table
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

-- Attendance sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, attendance_type, department_id, event_id)
);

-- ========================================
-- 2. CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(attendance_type);
CREATE INDEX IF NOT EXISTS idx_attendance_date_type ON attendance(date, attendance_type);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_attendance_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(date);

-- ========================================
-- 3. CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qr_sessions_updated_at ON qr_attendance_sessions;
CREATE TRIGGER update_qr_sessions_updated_at 
    BEFORE UPDATE ON qr_attendance_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON attendance_sessions;
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON attendance_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. ENABLE RLS ON NEW TABLES
-- ========================================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CREATE SERVICE ROLE POLICIES
-- ========================================

-- Service role policies for all tables
DROP POLICY IF EXISTS "service_role_full_access" ON departments;
CREATE POLICY "service_role_full_access" 
ON departments FOR ALL TO service_role 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_members_access" ON members;
CREATE POLICY "service_role_members_access" 
ON members FOR ALL TO service_role 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_attendance_access" ON attendance;
CREATE POLICY "service_role_attendance_access" 
ON attendance FOR ALL TO service_role 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_qr_sessions_access" ON qr_attendance_sessions;
CREATE POLICY "service_role_qr_sessions_access" 
ON qr_attendance_sessions FOR ALL TO service_role 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_sessions_access" ON attendance_sessions;
CREATE POLICY "service_role_sessions_access" 
ON attendance_sessions FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- ========================================
-- 6. CREATE HELPER FUNCTIONS
-- ========================================

-- Function to get departments (bypasses RLS)
CREATE OR REPLACE FUNCTION get_departments()
RETURNS TABLE (
  id UUID,
  name TEXT,
  swahili_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.swahili_name
  FROM departments d
  WHERE d.is_active = true
  ORDER BY d.name ASC;
END;
$$;

-- Function to get members (bypasses RLS)
CREATE OR REPLACE FUNCTION get_members(dept_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  member_number TEXT,
  photo_url TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF dept_id IS NULL THEN
    RETURN QUERY
    SELECT m.id, m.first_name, m.last_name, m.member_number, m.photo_url
    FROM members m
    WHERE m.status = 'active'
    ORDER BY m.first_name ASC;
  ELSE
    RETURN QUERY
    SELECT m.id, m.first_name, m.last_name, m.member_number, m.photo_url
    FROM members m
    INNER JOIN department_members dm ON m.id = dm.member_id
    WHERE m.status = 'active' 
    AND dm.department_id = dept_id 
    AND dm.is_active = true
    ORDER BY m.first_name ASC;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_departments() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_members(UUID) TO service_role, authenticated;

-- ========================================
-- 7. VERIFY SETUP
-- ========================================

-- Test departments access
SELECT 'Testing departments access...' as status;
SELECT COUNT(*) as department_count FROM departments;

-- Test members access
SELECT 'Testing members access...' as status;
SELECT COUNT(*) as member_count FROM members WHERE status = 'active';

-- Show all attendance tables
SELECT 'Attendance tables created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%attendance%'
ORDER BY table_name;

-- Show all policies for key tables
SELECT 'Service role policies:' as status;
SELECT tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%service_role%'
ORDER BY tablename, policyname;
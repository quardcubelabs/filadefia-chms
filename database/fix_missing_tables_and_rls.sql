-- Fix Missing Attendance Tables and RLS Policies
-- Since attendance table exists, only create missing tables and fix RLS

-- ========================================
-- 1. CREATE MISSING QR ATTENDANCE SESSIONS TABLE
-- ========================================

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

-- ========================================
-- 2. CREATE INDEXES FOR QR SESSIONS
-- ========================================

CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_attendance_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_date ON qr_attendance_sessions(date);

-- ========================================
-- 3. ENABLE RLS ON QR SESSIONS TABLE
-- ========================================

ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CREATE SERVICE ROLE POLICIES FOR ALL TABLES
-- ========================================

-- Fix departments access
DROP POLICY IF EXISTS "service_role_full_access" ON departments;
CREATE POLICY "service_role_full_access" 
ON departments FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Fix members access  
DROP POLICY IF EXISTS "service_role_members_access" ON members;
CREATE POLICY "service_role_members_access" 
ON members FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Fix department_members access
DROP POLICY IF EXISTS "service_role_department_members_access" ON department_members;
CREATE POLICY "service_role_department_members_access" 
ON department_members FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Fix attendance access
DROP POLICY IF EXISTS "service_role_attendance_access" ON attendance;
CREATE POLICY "service_role_attendance_access" 
ON attendance FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Fix QR sessions access
DROP POLICY IF EXISTS "service_role_qr_sessions_access" ON qr_attendance_sessions;
CREATE POLICY "service_role_qr_sessions_access" 
ON qr_attendance_sessions FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- ========================================
-- 5. CREATE HELPER FUNCTIONS (FALLBACK FOR RLS)
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
-- 6. VERIFY THE SETUP
-- ========================================

-- Check if qr_attendance_sessions table was created
SELECT 'QR Sessions table status:' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qr_attendance_sessions') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Test service role policies
SELECT 'Service role policies created:' as check_type;
SELECT tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%service_role%'
AND tablename IN ('departments', 'members', 'attendance', 'qr_attendance_sessions', 'department_members')
ORDER BY tablename, policyname;

-- Test functions
SELECT 'Testing departments function:' as check_type;
SELECT COUNT(*) as departments_count FROM get_departments();

SELECT 'Testing members function:' as check_type;
SELECT COUNT(*) as members_count FROM get_members();

-- Show attendance table structure to confirm it exists
SELECT 'Attendance table columns:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;
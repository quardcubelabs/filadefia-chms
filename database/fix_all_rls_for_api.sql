-- Fix RLS policies for all tables that need to be accessed via API routes
-- This ensures service_role key can bypass RLS for server-side API operations
-- Run this in Supabase SQL Editor

-- ============================================
-- VISITORS TABLE
-- ============================================

-- Drop existing restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Staff can view all visitors" ON visitors;
DROP POLICY IF EXISTS "Staff can create visitors" ON visitors;
DROP POLICY IF EXISTS "Staff can update visitors" ON visitors;
DROP POLICY IF EXISTS "Admins can delete visitors" ON visitors;
DROP POLICY IF EXISTS "Service role full access to visitors" ON visitors;

-- Create service role bypass policy (this is the key fix)
CREATE POLICY "Service role full access to visitors" ON visitors
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ASSETS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access to assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can view assets" ON assets;
DROP POLICY IF EXISTS "Staff can manage assets" ON assets;

-- Create permissive policy for assets
CREATE POLICY "Service role full access to assets" ON assets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ASSET MAINTENANCE TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to asset_maintenance" ON asset_maintenance;

CREATE POLICY "Service role full access to asset_maintenance" ON asset_maintenance
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- WORK PLANS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to work_plans" ON work_plans;
DROP POLICY IF EXISTS "view_work_plans" ON work_plans;
DROP POLICY IF EXISTS "insert_work_plans" ON work_plans;
DROP POLICY IF EXISTS "update_work_plans" ON work_plans;
DROP POLICY IF EXISTS "delete_work_plans" ON work_plans;

CREATE POLICY "Service role full access to work_plans" ON work_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- WORK PLAN TASKS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to work_plan_tasks" ON work_plan_tasks;
DROP POLICY IF EXISTS "view_work_plan_tasks" ON work_plan_tasks;
DROP POLICY IF EXISTS "insert_work_plan_tasks" ON work_plan_tasks;
DROP POLICY IF EXISTS "update_work_plan_tasks" ON work_plan_tasks;
DROP POLICY IF EXISTS "delete_work_plan_tasks" ON work_plan_tasks;

CREATE POLICY "Service role full access to work_plan_tasks" ON work_plan_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STRATEGIC PLANS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to strategic_plans" ON strategic_plans;
DROP POLICY IF EXISTS "view_strategic_plans" ON strategic_plans;
DROP POLICY IF EXISTS "insert_strategic_plans" ON strategic_plans;
DROP POLICY IF EXISTS "update_strategic_plans" ON strategic_plans;
DROP POLICY IF EXISTS "delete_strategic_plans" ON strategic_plans;

CREATE POLICY "Service role full access to strategic_plans" ON strategic_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STRATEGIC GOALS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to strategic_goals" ON strategic_goals;

CREATE POLICY "Service role full access to strategic_goals" ON strategic_goals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STRATEGIC OBJECTIVES TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to strategic_objectives" ON strategic_objectives;

CREATE POLICY "Service role full access to strategic_objectives" ON strategic_objectives
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON attendance;
DROP POLICY IF EXISTS "Staff can manage attendance" ON attendance;

CREATE POLICY "Service role full access to attendance" ON attendance
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ATTENDANCE SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to attendance_sessions" ON attendance_sessions;

CREATE POLICY "Service role full access to attendance_sessions" ON attendance_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- QR ATTENDANCE SESSIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role full access to qr_attendance_sessions" ON qr_attendance_sessions;

CREATE POLICY "Service role full access to qr_attendance_sessions" ON qr_attendance_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Verify RLS is enabled on all tables
-- ============================================

ALTER TABLE IF EXISTS visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS qr_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Grant permissions to authenticated users
-- ============================================

GRANT ALL ON visitors TO authenticated;
GRANT ALL ON assets TO authenticated;
GRANT ALL ON asset_maintenance TO authenticated;
GRANT ALL ON work_plans TO authenticated;
GRANT ALL ON work_plan_tasks TO authenticated;
GRANT ALL ON strategic_plans TO authenticated;
GRANT ALL ON strategic_goals TO authenticated;
GRANT ALL ON strategic_objectives TO authenticated;
GRANT ALL ON attendance TO authenticated;
GRANT ALL ON attendance_sessions TO authenticated;
GRANT ALL ON qr_attendance_sessions TO authenticated;

-- Grant to service_role explicitly
GRANT ALL ON visitors TO service_role;
GRANT ALL ON assets TO service_role;
GRANT ALL ON asset_maintenance TO service_role;
GRANT ALL ON work_plans TO service_role;
GRANT ALL ON work_plan_tasks TO service_role;
GRANT ALL ON strategic_plans TO service_role;
GRANT ALL ON strategic_goals TO service_role;
GRANT ALL ON strategic_objectives TO service_role;
GRANT ALL ON attendance TO service_role;
GRANT ALL ON attendance_sessions TO service_role;
GRANT ALL ON qr_attendance_sessions TO service_role;

SELECT 'RLS policies updated successfully for all tables' AS status;

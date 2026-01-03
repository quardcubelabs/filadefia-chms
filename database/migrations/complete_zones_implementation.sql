-- Complete Zones Implementation
-- FCC Church Management System - Tanzania Assemblies of God
-- This migration adds full zone support similar to departments

-- ============================================
-- PART 1: ADD ZONE_LEADER ROLE (Must be separate transaction)
-- ============================================

-- Add zone_leader to user_role enum if it doesn't exist
-- NOTE: This must be committed before using the new value
DO $$ 
BEGIN
  -- Check if zone_leader already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'zone_leader' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'zone_leader';
  END IF;
END $$;

-- ============================================
-- PART 2: MAIN MIGRATION (Separate transaction)
-- ============================================

BEGIN;

-- ============================================
-- 1. ZONE PROFILES TABLE (for zone leaders)
-- ============================================

-- Create zone_profiles table for zone leader dashboard access
CREATE TABLE IF NOT EXISTS zone_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, zone_id)
);

-- Add leader_user_id column to zones table (similar to departments)
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS leader_user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_zone_profiles_user_id ON zone_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_zone_profiles_zone_id ON zone_profiles(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_profiles_profile_id ON zone_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_zones_leader_user_id ON zones(leader_user_id);

-- ============================================
-- 2. ADD ZONE_ID TO RELEVANT TABLES
-- ============================================

-- Add zone_id to financial_transactions table
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_zone ON financial_transactions(zone_id);

-- Add zone_id to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_events_zone ON events(zone_id);

-- Add zone_id to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_attendance_zone ON attendance(zone_id);

-- Add zone_id to announcements/communications table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_announcements_zone ON announcements(zone_id);

-- Add zone_id to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_reports_zone ON reports(zone_id);

-- Add zone_id to meeting_minutes table
ALTER TABLE meeting_minutes 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_zone ON meeting_minutes(zone_id);

-- ============================================
-- 3. ADD ZONE_ID TO PROFILES TABLE
-- ============================================

-- Add zone_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

CREATE INDEX IF NOT EXISTS idx_profiles_zone_id ON profiles(zone_id);

-- ============================================
-- 4. ROW LEVEL SECURITY FOR ZONE_PROFILES
-- ============================================

ALTER TABLE zone_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view zone profiles
DROP POLICY IF EXISTS zone_profiles_select_policy ON zone_profiles;
CREATE POLICY zone_profiles_select_policy ON zone_profiles
  FOR SELECT TO authenticated
  USING (true);

-- Allow admins, pastors, and secretaries to manage zone profiles
DROP POLICY IF EXISTS zone_profiles_insert_policy ON zone_profiles;
CREATE POLICY zone_profiles_insert_policy ON zone_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

DROP POLICY IF EXISTS zone_profiles_update_policy ON zone_profiles;
CREATE POLICY zone_profiles_update_policy ON zone_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

DROP POLICY IF EXISTS zone_profiles_delete_policy ON zone_profiles;
CREATE POLICY zone_profiles_delete_policy ON zone_profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor')
    )
  );

-- ============================================
-- 5. UPDATE ZONE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS zones_update_policy ON zones;

-- Zone leaders can update their own zone
CREATE POLICY zones_update_policy ON zones
  FOR UPDATE TO authenticated
  USING (
    leader_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

-- ============================================
-- 6. UPDATE FINANCIAL TRANSACTIONS RLS FOR ZONES
-- ============================================

-- Drop existing policies and recreate with zone support
DROP POLICY IF EXISTS financial_transactions_select_policy ON financial_transactions;
DROP POLICY IF EXISTS "Zone leaders can view zone transactions" ON financial_transactions;

-- Zone leaders can view their zone's transactions
CREATE POLICY "Zone leaders can view zone transactions" ON financial_transactions
  FOR SELECT TO authenticated
  USING (
    zone_id IN (
      SELECT zone_id FROM zone_profiles WHERE user_id = auth.uid()
    ) OR
    zone_id IN (
      SELECT id FROM zones WHERE leader_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'treasurer')
    )
  );

-- ============================================
-- 7. CREATE VIEWS FOR ZONE LEADERSHIP
-- ============================================

-- Create or replace zone leadership view
-- Note: Uses text cast to avoid enum value commit issues
CREATE OR REPLACE VIEW zone_leadership_view AS
SELECT 
    p.user_id,
    p.email,
    p.first_name || ' ' || p.last_name as leader_name,
    p.role,
    z.id as zone_id,
    z.name as zone_name,
    '/zones/' || z.id as dashboard_url,
    CASE 
        WHEN p.user_id IS NOT NULL AND z.id IS NOT NULL THEN 'PROPERLY_LINKED'
        WHEN p.user_id IS NOT NULL AND z.id IS NULL THEN 'NO_ZONE'
        ELSE 'NO_PROFILE'
    END as status
FROM profiles p
LEFT JOIN zones z ON z.leader_user_id = p.user_id
WHERE p.role::text = 'zone_leader'
   OR z.leader_user_id IS NOT NULL
ORDER BY z.name NULLS LAST;

-- Create zone statistics view
CREATE OR REPLACE VIEW zone_statistics_view AS
SELECT 
    z.id,
    z.name,
    z.swahili_name,
    z.description,
    z.leader_id,
    z.leader_user_id,
    z.is_active,
    COALESCE(
      (SELECT first_name || ' ' || last_name 
       FROM members 
       WHERE id = z.leader_id), 
      (SELECT first_name || ' ' || last_name 
       FROM profiles 
       WHERE user_id = z.leader_user_id)
    ) as leader_name,
    (SELECT COUNT(*) FROM zone_members zm WHERE zm.zone_id = z.id AND zm.is_active = true) as member_count,
    (SELECT COUNT(*) FROM events e WHERE e.zone_id = z.id AND e.start_date >= CURRENT_DATE) as upcoming_events,
    (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions ft 
     WHERE ft.zone_id = z.id 
     AND ft.transaction_type NOT IN ('expense') 
     AND ft.date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_income,
    (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions ft 
     WHERE ft.zone_id = z.id 
     AND ft.transaction_type = 'expense' 
     AND ft.date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_expenses
FROM zones z
WHERE z.is_active = true
ORDER BY z.name;

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to check if a user is a zone leader
CREATE OR REPLACE FUNCTION is_zone_leader(check_user_id UUID, check_zone_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF check_zone_id IS NOT NULL THEN
        -- Check for specific zone
        RETURN EXISTS (
            SELECT 1 FROM zones 
            WHERE id = check_zone_id 
            AND leader_user_id = check_user_id
        ) OR EXISTS (
            SELECT 1 FROM zone_profiles 
            WHERE user_id = check_user_id 
            AND zone_id = check_zone_id 
            AND is_active = true
        );
    ELSE
        -- Check if user is leader of any zone
        RETURN EXISTS (
            SELECT 1 FROM zones 
            WHERE leader_user_id = check_user_id
        ) OR EXISTS (
            SELECT 1 FROM zone_profiles 
            WHERE user_id = check_user_id 
            AND is_active = true
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's zones
CREATE OR REPLACE FUNCTION get_user_zones(check_user_id UUID)
RETURNS TABLE (
    zone_id UUID,
    zone_name TEXT,
    is_leader BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        z.id as zone_id,
        z.name as zone_name,
        (z.leader_user_id = check_user_id OR 
         EXISTS (SELECT 1 FROM zone_profiles zp WHERE zp.zone_id = z.id AND zp.user_id = check_user_id AND zp.is_active = true)) as is_leader
    FROM zones z
    WHERE z.leader_user_id = check_user_id
       OR EXISTS (SELECT 1 FROM zone_profiles zp WHERE zp.zone_id = z.id AND zp.user_id = check_user_id AND zp.is_active = true)
    ORDER BY z.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync zone leadership (similar to department leadership)
CREATE OR REPLACE FUNCTION sync_zone_leadership() 
RETURNS void AS $$
DECLARE
    zone_record RECORD;
    profile_user_id UUID;
BEGIN
    -- For each zone with a current leader_id (member-based)
    FOR zone_record IN 
        SELECT z.id, z.name, z.leader_id, m.first_name, m.last_name, m.email
        FROM zones z
        JOIN members m ON z.leader_id = m.id
        WHERE z.is_active = true AND z.leader_id IS NOT NULL
    LOOP
        -- Find matching profile for this member
        SELECT user_id INTO profile_user_id
        FROM profiles p
        WHERE LOWER(p.first_name) = LOWER(zone_record.first_name) 
          AND LOWER(p.last_name) = LOWER(zone_record.last_name)
          AND p.role::text IN ('zone_leader', 'administrator', 'pastor')
        LIMIT 1;
        
        -- If profile found, update zone to use user_id
        IF profile_user_id IS NOT NULL THEN
            UPDATE zones 
            SET leader_user_id = profile_user_id
            WHERE id = zone_record.id;
            
            -- Also set the leader's zone_id in profiles
            UPDATE profiles 
            SET zone_id = zone_record.id
            WHERE user_id = profile_user_id;
            
            -- Create zone_profile entry if not exists
            INSERT INTO zone_profiles (user_id, profile_id, zone_id)
            SELECT profile_user_id, p.id, zone_record.id
            FROM profiles p
            WHERE p.user_id = profile_user_id
            ON CONFLICT (user_id, zone_id) DO NOTHING;
            
            RAISE NOTICE 'Linked zone % to user_id %', zone_record.name, profile_user_id;
        ELSE
            RAISE NOTICE 'No profile found for zone leader: % %', zone_record.first_name, zone_record.last_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. UPDATE TIMESTAMP TRIGGER FOR ZONE_PROFILES
-- ============================================

CREATE TRIGGER update_zone_profiles_updated_at
    BEFORE UPDATE ON zone_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Check zone_profiles table
-- SELECT * FROM zone_profiles;

-- Check zone statistics
-- SELECT * FROM zone_statistics_view;

-- Check zone leadership
-- SELECT * FROM zone_leadership_view;

-- Test zone leader check function
-- SELECT is_zone_leader('user-uuid-here');

-- Get user's zones
-- SELECT * FROM get_user_zones('user-uuid-here');

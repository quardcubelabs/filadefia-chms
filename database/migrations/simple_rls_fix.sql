-- Simple RLS fix for events and event_registrations
-- This migration creates the most permissive policies possible for debugging

-- Step 1: Ensure RLS is enabled but create permissive policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on events table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on event_registrations table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'event_registrations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON event_registrations', policy_record.policyname);
    END LOOP;
END $$;

-- Step 3: Create the most permissive policies possible
CREATE POLICY "allow_all_events" ON events FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_registrations" ON event_registrations FOR ALL TO public USING (true) WITH CHECK (true);

-- Step 4: Grant explicit table permissions
GRANT ALL ON events TO authenticated, anon, service_role;
GRANT ALL ON event_registrations TO authenticated, anon, service_role;

-- Step 5: Verify the setup
SELECT 'Checking final setup...' as status;

-- Show current policies
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('events', 'event_registrations')
ORDER BY tablename;

-- Test access
SELECT 'Events table test:' as test, count(*) as count FROM events;
SELECT 'Event registrations table test:' as test, count(*) as count FROM event_registrations;

SELECT 'RLS policies have been reset to most permissive settings' as result;
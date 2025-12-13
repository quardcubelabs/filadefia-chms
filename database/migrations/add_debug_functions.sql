-- Create helper functions for debugging events access
-- These functions can help bypass RLS for debugging purposes

-- Function to get events count directly
CREATE OR REPLACE FUNCTION get_events_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer FROM events;
$$;

-- Function to get sample events data
CREATE OR REPLACE FUNCTION get_sample_events(limit_count integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  start_date timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, title, description, start_date, created_at 
  FROM events 
  ORDER BY created_at DESC 
  LIMIT limit_count;
$$;

-- Function to check user's role and permissions
CREATE OR REPLACE FUNCTION check_user_permissions(user_email text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  is_active boolean,
  can_access_events boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.user_id,
    au.email,
    p.role,
    p.is_active,
    CASE 
      WHEN p.role IN ('administrator', 'pastor', 'secretary') THEN true
      WHEN p.is_active = true THEN true
      ELSE false
    END as can_access_events
  FROM profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE (user_email IS NULL AND p.user_id = auth.uid())
     OR (user_email IS NOT NULL AND au.email = user_email);
$$;

-- Function to check RLS policies on events table
CREATE OR REPLACE FUNCTION check_events_policies()
RETURNS TABLE (
  policy_name text,
  policy_cmd text,
  policy_roles text[],
  policy_qual text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    policyname::text,
    cmd::text,
    roles,
    qual::text
  FROM pg_policies 
  WHERE tablename = 'events'
  ORDER BY policyname;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_events_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sample_events(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permissions(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_events_policies() TO authenticated;

-- Function to get event registrations count
CREATE OR REPLACE FUNCTION get_registrations_count(event_uuid uuid DEFAULT NULL)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer 
  FROM event_registrations 
  WHERE (event_uuid IS NULL OR event_id = event_uuid);
$$;

-- Function to test event registration insertion
CREATE OR REPLACE FUNCTION test_registration_insert(
  test_event_id uuid,
  test_member_id uuid,
  test_payment_status text DEFAULT 'pending'
)
RETURNS TABLE (
  success boolean,
  error_message text,
  registration_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
  error_msg text := '';
BEGIN
  BEGIN
    INSERT INTO event_registrations (event_id, member_id, payment_status)
    VALUES (test_event_id, test_member_id, test_payment_status)
    RETURNING id INTO new_id;
    
    RETURN QUERY SELECT true, ''::text, new_id;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    RETURN QUERY SELECT false, error_msg, NULL::uuid;
  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_registrations_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION test_registration_insert(uuid, uuid, text) TO authenticated;

-- Also grant to anon for public access during debugging
GRANT EXECUTE ON FUNCTION get_events_count() TO anon;
GRANT EXECUTE ON FUNCTION get_sample_events(integer) TO anon;
GRANT EXECUTE ON FUNCTION get_registrations_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION test_registration_insert(uuid, uuid, text) TO anon;
-- Update the handle_new_user function to capture Google OAuth profile data
-- This migration updates the trigger function to extract avatar_url and full_name from Google sign-in

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name TEXT;
  first_name TEXT;
  last_name TEXT;
  avatar_url TEXT;
BEGIN
  -- Extract full name from Google OAuth metadata
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Extract avatar URL from Google OAuth metadata (try both 'avatar_url' and 'picture')
  avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );
  
  -- Parse first and last name
  IF full_name != '' THEN
    first_name := SPLIT_PART(full_name, ' ', 1);
    last_name := TRIM(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2));
  ELSE
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1));
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  END IF;
  
  -- Insert profile with Google data
  INSERT INTO public.profiles (user_id, email, role, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    'member',
    first_name,
    last_name,
    avatar_url
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    notifications JSONB DEFAULT '{
        "email": true,
        "push": true,
        "events": true,
        "finances": true,
        "announcements": true
    }',
    privacy JSONB DEFAULT '{
        "profileVisible": true,
        "showEmail": false,
        "showPhone": false
    }',
    appearance JSONB DEFAULT '{
        "theme": "light",
        "language": "en"
    }',
    security JSONB DEFAULT '{
        "twoFactorEnabled": false,
        "loginNotifications": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile photos
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;
CREATE POLICY "Profile photos are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
CREATE POLICY "Users can upload own profile photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
CREATE POLICY "Users can update own profile photos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
CREATE POLICY "Users can delete own profile photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    department_id UUID REFERENCES departments(id),
    created_by UUID REFERENCES user_profiles(id),
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_attendees table for tracking event participation
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended BOOLEAN DEFAULT false,
    notes TEXT,
    UNIQUE(event_id, member_id)
);

-- Enable RLS on events tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
DROP POLICY IF EXISTS "Everyone can view events" ON events;
CREATE POLICY "Everyone can view events" ON events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leaders can manage events" ON events;
CREATE POLICY "Leaders can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader')
        )
    );

-- RLS policies for event_attendees
DROP POLICY IF EXISTS "Users can view event attendees" ON event_attendees;
CREATE POLICY "Users can view event attendees" ON event_attendees
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can register for events" ON event_attendees;
CREATE POLICY "Users can register for events" ON event_attendees
    FOR INSERT WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Users can update own registration" ON event_attendees;
CREATE POLICY "Users can update own registration" ON event_attendees
    FOR UPDATE USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Leaders can manage event attendance" ON event_attendees;
CREATE POLICY "Leaders can manage event attendance" ON event_attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pastor', 'leader')
        )
    );

-- Add additional columns to user_profiles table if they don't exist
DO $$ 
BEGIN
    -- Add bio column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
        ALTER TABLE user_profiles ADD COLUMN bio TEXT;
    END IF;

    -- Add address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'address') THEN
        ALTER TABLE user_profiles ADD COLUMN address TEXT;
    END IF;

    -- Add emergency_contact column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'emergency_contact') THEN
        ALTER TABLE user_profiles ADD COLUMN emergency_contact TEXT;
    END IF;

    -- Add emergency_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'emergency_phone') THEN
        ALTER TABLE user_profiles ADD COLUMN emergency_phone TEXT;
    END IF;

    -- Add photo_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'photo_url') THEN
        ALTER TABLE user_profiles ADD COLUMN photo_url TEXT;
    END IF;
END $$;

-- Seed some sample events for demo purposes
DO $$
DECLARE
    dept_id UUID;
    leader_id UUID;
BEGIN
    -- Get a department and leader for the events
    SELECT id INTO dept_id FROM departments LIMIT 1;
    SELECT id INTO leader_id FROM user_profiles WHERE role IN ('admin', 'pastor', 'leader') LIMIT 1;
    
    -- Insert sample events if none exist
    IF NOT EXISTS (SELECT 1 FROM events LIMIT 1) THEN
        INSERT INTO events (title, description, start_date, end_date, location, department_id, created_by) VALUES
        ('Sunday Service', 'Weekly Sunday morning worship service', 
         NOW() + INTERVAL '1 week', NOW() + INTERVAL '1 week' + INTERVAL '2 hours', 
         'Main Sanctuary', dept_id, leader_id),
        ('Bible Study', 'Weekly Bible study and discussion', 
         NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1.5 hours', 
         'Fellowship Hall', dept_id, leader_id),
        ('Youth Meeting', 'Monthly youth group gathering', 
         NOW() + INTERVAL '2 weeks', NOW() + INTERVAL '2 weeks' + INTERVAL '2 hours', 
         'Youth Room', dept_id, leader_id),
        ('Prayer Meeting', 'Weekly prayer and intercession', 
         NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 
         'Prayer Chapel', dept_id, leader_id),
        ('Community Outreach', 'Monthly community service event', 
         NOW() + INTERVAL '3 weeks', NOW() + INTERVAL '3 weeks' + INTERVAL '4 hours', 
         'Community Center', dept_id, leader_id);
        
        -- Add some sample event attendees for existing users
        INSERT INTO event_attendees (event_id, member_id, attended)
        SELECT e.id, up.id, (RANDOM() < 0.7)  -- 70% attendance rate
        FROM events e
        CROSS JOIN user_profiles up
        WHERE RANDOM() < 0.6  -- 60% of users attend each event
        ON CONFLICT (event_id, member_id) DO NOTHING;
    END IF;
END $$;
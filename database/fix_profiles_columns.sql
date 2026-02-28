-- Fix missing columns on the 'profiles' table.
-- Run this once in the Supabase SQL editor (Database → SQL Editor → New query).
-- Safe to run multiple times – uses IF NOT EXISTS checks.

DO $$
BEGIN
    -- bio: free-text biography
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;

    -- address: home / mailing address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE profiles ADD COLUMN address TEXT;
    END IF;

    -- emergency_contact: name of emergency contact
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'emergency_contact') THEN
        ALTER TABLE profiles ADD COLUMN emergency_contact TEXT;
    END IF;

    -- emergency_phone: phone of emergency contact
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'emergency_phone') THEN
        ALTER TABLE profiles ADD COLUMN emergency_phone TEXT;
    END IF;

    -- photo_url: profile photo stored in Supabase Storage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'photo_url') THEN
        ALTER TABLE profiles ADD COLUMN photo_url TEXT;
    END IF;
END $$;

-- Grant existing RLS policies access to the new columns (no extra RLS changes needed
-- since column-level security is not used; row-level policies already cover the table).

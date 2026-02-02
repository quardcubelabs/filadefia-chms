-- Migration: Add zone_meeting to attendance_type enum
-- Run this in your Supabase SQL Editor

-- IMPORTANT: Run this command FIRST, then click "Run" again for verification
-- PostgreSQL requires new enum values to be committed before use

-- Step 1: Add the new enum value (run this alone first)
ALTER TYPE attendance_type ADD VALUE IF NOT EXISTS 'zone_meeting';

-- Step 2: After Step 1 succeeds, run this separately to verify
-- SELECT enum_range(NULL::attendance_type);

-- Alternative approach if above fails - recreate the enum type:
-- (Only use this if the simple ALTER fails)
/*
DO $$
BEGIN
    -- Check if zone_meeting already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'zone_meeting' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'attendance_type')
    ) THEN
        -- Create a new type with the additional value
        CREATE TYPE attendance_type_new AS ENUM (
            'sunday_service', 
            'midweek_fellowship', 
            'special_event', 
            'department_meeting', 
            'zone_meeting'
        );
        
        -- Update the column to use the new type
        ALTER TABLE attendance 
            ALTER COLUMN attendance_type TYPE attendance_type_new 
            USING attendance_type::text::attendance_type_new;
        
        -- Drop the old type
        DROP TYPE attendance_type;
        
        -- Rename new type to original name
        ALTER TYPE attendance_type_new RENAME TO attendance_type;
    END IF;
END $$;
*/

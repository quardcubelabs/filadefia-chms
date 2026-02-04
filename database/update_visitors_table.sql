-- Add additional columns to visitors table for seamless member conversion
-- Run this in Supabase SQL Editor

-- Add middle_name column
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS middle_name TEXT;

-- Add employer column
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS employer TEXT;

-- Add emergency contact columns
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Add baptism_date column
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS baptism_date DATE;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'visitors'
ORDER BY ordinal_position;

-- Migration: Add attachment columns to meeting_minutes table
-- Run this in Supabase SQL Editor

-- Add attachment columns to meeting_minutes table
ALTER TABLE meeting_minutes 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Create storage bucket for documents if it doesn't exist
-- Note: You may need to create this via Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy for documents bucket (run in Supabase Dashboard)
-- This allows authenticated users to upload and read documents

-- Policy: Allow authenticated users to upload
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'documents');

-- Policy: Allow public read access
-- CREATE POLICY "Allow public read" ON storage.objects
-- FOR SELECT TO public
-- USING (bucket_id = 'documents');

-- Policy: Allow users to delete their own uploads
-- CREATE POLICY "Allow delete own uploads" ON storage.objects
-- FOR DELETE TO authenticated
-- USING (bucket_id = 'documents');

SELECT 'Migration completed: attachment columns added to meeting_minutes' as status;

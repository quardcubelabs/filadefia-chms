-- Add zone_id column to reports table for zone leader reports
-- This allows zone leaders to generate and save reports

-- Add zone_id column
ALTER TABLE reports ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

-- Add file_url column to store the PDF file URL if uploaded
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add source column to track where the report was generated from
ALTER TABLE reports ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
-- source values: 'manual' (created from documents page), 'generated' (exported from reports page)

-- Add description column for additional context
ALTER TABLE reports ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for zone_id
CREATE INDEX IF NOT EXISTS idx_reports_zone_id ON reports(zone_id);

-- Create index for source
CREATE INDEX IF NOT EXISTS idx_reports_source ON reports(source);

-- Update RLS policies to allow zone leaders to manage their zone reports

-- Drop existing policies if they exist
DROP POLICY IF EXISTS reports_select_policy ON reports;
DROP POLICY IF EXISTS reports_insert_policy ON reports;
DROP POLICY IF EXISTS reports_update_policy ON reports;
DROP POLICY IF EXISTS reports_delete_policy ON reports;

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to view reports
CREATE POLICY reports_select_policy ON reports
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert reports
-- Simplified policy that allows any authenticated user to insert
-- The application code handles the authorization logic
CREATE POLICY reports_insert_policy ON reports
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Must have a valid generated_by that matches current user's profile
    generated_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Policy: Allow update by the creator or admin/pastor
CREATE POLICY reports_update_policy ON reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor')
    )
    OR
    generated_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Policy: Allow delete by admin/pastor or the creator
CREATE POLICY reports_delete_policy ON reports
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor')
    )
    OR
    generated_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Create a function to make type column optional (use 'monthly' as default)
-- This allows generated reports to be saved without specifying a type

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

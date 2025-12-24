-- Create QR attendance sessions table
CREATE TABLE IF NOT EXISTS qr_attendance_sessions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  attendance_type attendance_type NOT NULL,
  event_id UUID REFERENCES events(id),
  department_id UUID REFERENCES departments(id),
  session_name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  check_ins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for QR attendance sessions
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for reading QR sessions (anyone can read active sessions for check-in)
CREATE POLICY "Anyone can view active QR attendance sessions" ON qr_attendance_sessions
  FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Policy for creating QR sessions (authenticated users with appropriate roles)
CREATE POLICY "Authenticated users can create QR attendance sessions" ON qr_attendance_sessions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor', 'secretary', 'department_leader')
      )
    )
  );

-- Policy for updating QR sessions (creators and admins)
CREATE POLICY "Session creators and admins can update QR attendance sessions" ON qr_attendance_sessions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor', 'secretary')
      )
    )
  );

-- Policy for deleting QR sessions (creators and admins)
CREATE POLICY "Session creators and admins can delete QR attendance sessions" ON qr_attendance_sessions
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor')
      )
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_qr_attendance_sessions_active ON qr_attendance_sessions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_qr_attendance_sessions_date ON qr_attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_qr_attendance_sessions_creator ON qr_attendance_sessions(created_by);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_attendance_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qr_attendance_sessions_updated_at
  BEFORE UPDATE ON qr_attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_attendance_sessions_updated_at();
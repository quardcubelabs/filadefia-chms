-- Attendance Management System Database Schema
-- This file contains the required tables for the attendance system

-- Create attendance table for storing attendance records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    date DATE NOT NULL,
    attendance_type VARCHAR(50) NOT NULL, -- sunday_service, midweek_fellowship, special_event, department_meeting
    present BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    event_id UUID,
    recorded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraints if members table exists
    -- FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    -- FOREIGN KEY (recorded_by) REFERENCES members(id) ON DELETE SET NULL,
    
    -- Prevent duplicate attendance records for same member, date, and type
    UNIQUE(member_id, date, attendance_type, event_id)
);

-- Create QR attendance sessions table
CREATE TABLE IF NOT EXISTS qr_attendance_sessions (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    attendance_type VARCHAR(50) NOT NULL,
    session_name VARCHAR(200) NOT NULL,
    department_id UUID,
    event_id UUID,
    created_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    check_ins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance sessions table for grouping attendance records
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    attendance_type VARCHAR(50) NOT NULL,
    session_name VARCHAR(200),
    department_id UUID,
    event_id UUID,
    created_by UUID,
    total_members INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate sessions for same date and type
    UNIQUE(date, attendance_type, department_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(attendance_type);
CREATE INDEX IF NOT EXISTS idx_attendance_date_type ON attendance(date, attendance_type);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_attendance_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(date);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_sessions_updated_at 
    BEFORE UPDATE ON qr_attendance_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON attendance_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - optional but recommended
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and adjust as needed):
-- CREATE POLICY "Users can view their own attendance" ON attendance
--     FOR SELECT USING (auth.uid() = member_id);

-- CREATE POLICY "Authorized users can manage attendance" ON attendance
--     FOR ALL USING (
--         auth.uid() IN (
--             SELECT id FROM members WHERE role IN ('administrator', 'pastor', 'secretary')
--         )
--     );

-- Add comments for documentation
COMMENT ON TABLE attendance IS 'Stores attendance records for church members';
COMMENT ON TABLE qr_attendance_sessions IS 'Stores QR code attendance sessions';
COMMENT ON TABLE attendance_sessions IS 'Stores attendance session metadata and statistics';

COMMENT ON COLUMN attendance.attendance_type IS 'Type of service: sunday_service, midweek_fellowship, special_event, department_meeting';
COMMENT ON COLUMN attendance.present IS 'Whether the member was present (true) or absent (false)';
COMMENT ON COLUMN qr_attendance_sessions.expires_at IS 'When the QR session expires and becomes invalid';
COMMENT ON COLUMN qr_attendance_sessions.check_ins IS 'Number of successful check-ins through this QR session';
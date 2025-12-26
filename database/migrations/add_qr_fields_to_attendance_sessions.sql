-- Add QR code fields to attendance_sessions table
-- Migration script to update existing table structure

-- Add QR Code related columns to attendance_sessions table if they don't exist
DO $$
BEGIN
    -- Add qr_code_data_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_sessions' 
                   AND column_name = 'qr_code_data_url') THEN
        ALTER TABLE attendance_sessions ADD COLUMN qr_code_data_url TEXT;
    END IF;

    -- Add qr_session_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_sessions' 
                   AND column_name = 'qr_session_id') THEN
        ALTER TABLE attendance_sessions ADD COLUMN qr_session_id VARCHAR(50);
    END IF;

    -- Add qr_check_in_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_sessions' 
                   AND column_name = 'qr_check_in_url') THEN
        ALTER TABLE attendance_sessions ADD COLUMN qr_check_in_url TEXT;
    END IF;

    -- Add qr_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_sessions' 
                   AND column_name = 'qr_expires_at') THEN
        ALTER TABLE attendance_sessions ADD COLUMN qr_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add qr_is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_sessions' 
                   AND column_name = 'qr_is_active') THEN
        ALTER TABLE attendance_sessions ADD COLUMN qr_is_active BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add qr_check_ins column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_sessions' 
                   AND column_name = 'qr_check_ins') THEN
        ALTER TABLE attendance_sessions ADD COLUMN qr_check_ins INTEGER DEFAULT 0;
    END IF;

END$$;

-- Add index for QR session lookups
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_qr_session_id ON attendance_sessions(qr_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_qr_active ON attendance_sessions(qr_is_active, qr_expires_at);

-- Add comments for the new columns
COMMENT ON COLUMN attendance_sessions.qr_code_data_url IS 'Base64 encoded QR code image for the session';
COMMENT ON COLUMN attendance_sessions.qr_session_id IS 'Unique identifier for the QR attendance session';
COMMENT ON COLUMN attendance_sessions.qr_check_in_url IS 'URL that the QR code points to for check-in';
COMMENT ON COLUMN attendance_sessions.qr_expires_at IS 'When the QR session expires and becomes invalid';
COMMENT ON COLUMN attendance_sessions.qr_is_active IS 'Whether QR check-in is currently active for this session';
COMMENT ON COLUMN attendance_sessions.qr_check_ins IS 'Number of successful QR check-ins for this session';
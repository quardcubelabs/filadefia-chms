-- Visitors table for tracking first-time visitors and guest attendees
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  gender gender,
  date_of_birth DATE,
  marital_status marital_status,
  occupation TEXT,
  how_did_you_hear TEXT, -- How they learned about the church
  converted BOOLEAN DEFAULT false,
  conversion_date DATE,
  referred_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
  followed_up BOOLEAN DEFAULT false,
  followed_up_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  followed_up_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT DEFAULT 'new', -- new, contacted, interested, converted, not_interested
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for frequently queried fields
CREATE INDEX idx_visitors_phone ON visitors(phone);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_visited_date ON visitors(visited_date);
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_visitors_followed_up ON visitors(followed_up);
CREATE INDEX idx_visitors_referred_by ON visitors(referred_by_member_id);

-- Trigger for update_updated_at
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visitors
-- Staff can view all visitors
CREATE POLICY "Staff can view all visitors" ON visitors FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Staff can insert new visitors
CREATE POLICY "Staff can create visitors" ON visitors FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'secretary', 'department_leader')
  )
);

-- Staff can update visitors
CREATE POLICY "Staff can update visitors" ON visitors FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Admins can delete visitors
CREATE POLICY "Admins can delete visitors" ON visitors FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor')
  )
);

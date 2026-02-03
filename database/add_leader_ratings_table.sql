-- Leader Ratings table for pastor to rate department leaders
CREATE TABLE IF NOT EXISTS leader_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leader_id, rated_by) -- One rating per leader per rater
);

-- Index for frequently queried fields
CREATE INDEX idx_leader_ratings_leader ON leader_ratings(leader_id);
CREATE INDEX idx_leader_ratings_department ON leader_ratings(department_id);
CREATE INDEX idx_leader_ratings_rated_by ON leader_ratings(rated_by);

-- Trigger for update_updated_at
CREATE TRIGGER update_leader_ratings_updated_at BEFORE UPDATE ON leader_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE leader_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leader_ratings
-- Anyone authenticated can view ratings
CREATE POLICY "Authenticated users can view ratings" ON leader_ratings FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Only pastors and admins can create/update ratings
CREATE POLICY "Pastors can create ratings" ON leader_ratings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor')
  )
);

CREATE POLICY "Pastors can update their ratings" ON leader_ratings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor')
  )
);

CREATE POLICY "Pastors can delete their ratings" ON leader_ratings FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor')
  )
);

-- Church Zones Schema
-- FCC Church Management System - Tanzania Assemblies of God

-- Zone position type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'zone_position') THEN
    CREATE TYPE zone_position AS ENUM ('leader', 'assistant_leader', 'secretary', 'treasurer', 'member');
  END IF;
END $$;

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  swahili_name TEXT,
  description TEXT,
  leader_id UUID REFERENCES members(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zone members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS zone_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  position zone_position DEFAULT 'member',
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(zone_id, member_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);
CREATE INDEX IF NOT EXISTS idx_zones_is_active ON zones(is_active);
CREATE INDEX IF NOT EXISTS idx_zone_members_zone_id ON zone_members(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_members_member_id ON zone_members(member_id);
CREATE INDEX IF NOT EXISTS idx_zone_members_is_active ON zone_members(is_active);

-- Row Level Security (RLS) for zones table
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to view zones
CREATE POLICY zones_select_policy ON zones
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Allow admin, pastor, secretary to manage zones
CREATE POLICY zones_insert_policy ON zones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

CREATE POLICY zones_update_policy ON zones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

CREATE POLICY zones_delete_policy ON zones
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor')
    )
  );

-- Row Level Security (RLS) for zone_members table
ALTER TABLE zone_members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to view zone members
CREATE POLICY zone_members_select_policy ON zone_members
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Allow admin, pastor, secretary to manage zone members
CREATE POLICY zone_members_insert_policy ON zone_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

CREATE POLICY zone_members_update_policy ON zone_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

CREATE POLICY zone_members_delete_policy ON zone_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('administrator', 'pastor', 'secretary')
    )
  );

-- Seed the 10 church zones
INSERT INTO zones (name, swahili_name, description, is_active) VALUES
  ('Ebenezer', 'Ebenezari', 'Ebenezer Zone - The Lord has helped us', true),
  ('Betheli', 'Betheli', 'Betheli Zone - House of God', true),
  ('Galilaya', 'Galilaya', 'Galilaya Zone - Region of hope', true),
  ('Horebu', 'Horebu', 'Horebu Zone - Mountain of God', true),
  ('Mizeituni', 'Mizeituni', 'Mizeituni Zone - Olive Mountain', true),
  ('Maranatha', 'Maranatha', 'Maranatha Zone - Our Lord comes', true),
  ('Sayuni', 'Sayuni', 'Sayuni Zone - Zion, City of God', true),
  ('Yerusalemu', 'Yerusalemu', 'Yerusalemu Zone - City of Peace', true),
  ('Gosheni', 'Gosheni', 'Gosheni Zone - Land of plenty', true),
  ('Nazareth', 'Nazareti', 'Nazareth Zone - Where Jesus grew', true)
ON CONFLICT (name) DO NOTHING;

-- Function to update zones updated_at timestamp
CREATE OR REPLACE FUNCTION update_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS zones_updated_at_trigger ON zones;
CREATE TRIGGER zones_updated_at_trigger
  BEFORE UPDATE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION update_zones_updated_at();

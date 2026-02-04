-- Church Assets Management Schema
-- Track all church assets including equipment, vehicles, property, furniture, etc.

-- Asset category enum
CREATE TYPE asset_category AS ENUM (
  'property',
  'vehicle',
  'electronics',
  'furniture',
  'musical_instruments',
  'office_equipment',
  'kitchen_equipment',
  'sound_system',
  'lighting',
  'tools',
  'other'
);

-- Asset condition enum
CREATE TYPE asset_condition AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_repair',
  'non_functional'
);

-- Asset status enum
CREATE TYPE asset_status AS ENUM (
  'active',
  'in_use',
  'in_storage',
  'under_maintenance',
  'disposed',
  'donated',
  'sold',
  'lost'
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category asset_category NOT NULL,
  condition asset_condition DEFAULT 'good',
  status asset_status DEFAULT 'active',
  
  -- Financial info
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  currency TEXT DEFAULT 'TZS',
  
  -- Location and assignment
  location TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES members(id) ON DELETE SET NULL,
  
  -- Details
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  warranty_expiry DATE,
  
  -- Documents
  photo_url TEXT,
  receipt_url TEXT,
  
  -- Tracking
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset maintenance records
CREATE TABLE asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT NOT NULL, -- repair, service, inspection, upgrade
  description TEXT NOT NULL,
  cost DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  performed_by TEXT,
  performed_date DATE NOT NULL,
  next_maintenance_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset disposal records
CREATE TABLE asset_disposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  disposal_type TEXT NOT NULL, -- sold, donated, discarded, lost
  disposal_date DATE NOT NULL,
  disposal_value DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  recipient TEXT, -- who received it (if sold or donated)
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_condition ON assets(condition);
CREATE INDEX idx_assets_department ON assets(department_id);
CREATE INDEX idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX idx_assets_asset_number ON assets(asset_number);
CREATE INDEX idx_assets_active ON assets(is_active);

CREATE INDEX idx_asset_maintenance_asset ON asset_maintenance(asset_id);
CREATE INDEX idx_asset_maintenance_date ON asset_maintenance(performed_date);

CREATE INDEX idx_asset_disposals_asset ON asset_disposals(asset_id);
CREATE INDEX idx_asset_disposals_date ON asset_disposals(disposal_date);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- Assets policies
CREATE POLICY "Authenticated users can view assets" ON assets 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin, pastor and treasurer can manage assets" ON assets 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor', 'treasurer')
    )
  );

-- Asset maintenance policies
CREATE POLICY "Authenticated users can view asset maintenance" ON asset_maintenance 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin, pastor and treasurer can manage asset maintenance" ON asset_maintenance 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor', 'treasurer')
    )
  );

-- Asset disposals policies
CREATE POLICY "Authenticated users can view asset disposals" ON asset_disposals 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pastor can manage asset disposals" ON asset_disposals 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );

-- Service role full access
CREATE POLICY "service_role_assets" ON assets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_asset_maintenance" ON asset_maintenance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_asset_disposals" ON asset_disposals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTION TO GENERATE ASSET NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION generate_asset_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := 'FCC-' || TO_CHAR(NOW(), 'YYYY') || '-';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(asset_number FROM LENGTH(year_prefix) + 1) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM assets
  WHERE asset_number LIKE year_prefix || '%';
  
  new_number := year_prefix || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

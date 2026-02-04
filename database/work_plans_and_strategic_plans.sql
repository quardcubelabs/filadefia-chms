-- Work Plans and Strategic Plans Schema
-- Separate tables for operational work plans and long-term strategic plans

-- Plan status enum
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'completed', 'cancelled', 'on_hold');
CREATE TYPE plan_scope AS ENUM ('church', 'department', 'zone');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');

-- ============================================
-- WORK PLANS (Operational, Short-term)
-- ============================================

-- Work Plans table
CREATE TABLE work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  scope plan_scope NOT NULL DEFAULT 'church',
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status plan_status DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure proper scope assignment
  CONSTRAINT work_plan_scope_check CHECK (
    (scope = 'church' AND department_id IS NULL AND zone_id IS NULL) OR
    (scope = 'department' AND department_id IS NOT NULL AND zone_id IS NULL) OR
    (scope = 'zone' AND zone_id IS NOT NULL AND department_id IS NULL)
  )
);

-- Work Plan Tasks table
CREATE TABLE work_plan_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES members(id),
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STRATEGIC PLANS (Long-term, Vision-based)
-- ============================================

-- Strategic Plans table
CREATE TABLE strategic_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  vision TEXT,
  mission TEXT,
  description TEXT,
  scope plan_scope NOT NULL DEFAULT 'church',
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  status plan_status DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure proper scope assignment
  CONSTRAINT strategic_plan_scope_check CHECK (
    (scope = 'church' AND department_id IS NULL AND zone_id IS NULL) OR
    (scope = 'department' AND department_id IS NOT NULL AND zone_id IS NULL) OR
    (scope = 'zone' AND zone_id IS NOT NULL AND department_id IS NULL)
  ),
  
  -- Year validation
  CONSTRAINT strategic_plan_year_check CHECK (year_end >= year_start)
);

-- Strategic Goals table
CREATE TABLE strategic_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategic_plan_id UUID REFERENCES strategic_plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_metric TEXT,
  target_value TEXT,
  current_value TEXT,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategic Objectives table (sub-goals)
CREATE TABLE strategic_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategic_goal_id UUID REFERENCES strategic_goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  key_result TEXT,
  assigned_to UUID REFERENCES members(id),
  due_date DATE,
  status task_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_work_plans_scope ON work_plans(scope);
CREATE INDEX idx_work_plans_department ON work_plans(department_id);
CREATE INDEX idx_work_plans_zone ON work_plans(zone_id);
CREATE INDEX idx_work_plans_status ON work_plans(status);
CREATE INDEX idx_work_plans_dates ON work_plans(start_date, end_date);
CREATE INDEX idx_work_plans_created_by ON work_plans(created_by);

CREATE INDEX idx_work_plan_tasks_plan ON work_plan_tasks(work_plan_id);
CREATE INDEX idx_work_plan_tasks_assigned ON work_plan_tasks(assigned_to);
CREATE INDEX idx_work_plan_tasks_status ON work_plan_tasks(status);
CREATE INDEX idx_work_plan_tasks_due ON work_plan_tasks(due_date);

CREATE INDEX idx_strategic_plans_scope ON strategic_plans(scope);
CREATE INDEX idx_strategic_plans_department ON strategic_plans(department_id);
CREATE INDEX idx_strategic_plans_zone ON strategic_plans(zone_id);
CREATE INDEX idx_strategic_plans_status ON strategic_plans(status);
CREATE INDEX idx_strategic_plans_years ON strategic_plans(year_start, year_end);

CREATE INDEX idx_strategic_goals_plan ON strategic_goals(strategic_plan_id);
CREATE INDEX idx_strategic_goals_status ON strategic_goals(status);

CREATE INDEX idx_strategic_objectives_goal ON strategic_objectives(strategic_goal_id);
CREATE INDEX idx_strategic_objectives_assigned ON strategic_objectives(assigned_to);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_work_plans_updated_at 
  BEFORE UPDATE ON work_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_plan_tasks_updated_at 
  BEFORE UPDATE ON work_plan_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategic_plans_updated_at 
  BEFORE UPDATE ON strategic_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategic_goals_updated_at 
  BEFORE UPDATE ON strategic_goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategic_objectives_updated_at 
  BEFORE UPDATE ON strategic_objectives 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;

-- Work Plans policies
CREATE POLICY "Authenticated users can view work plans" ON work_plans 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pastor can manage all work plans" ON work_plans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );

CREATE POLICY "Department leaders can manage their department work plans" ON work_plans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN departments d ON d.leader_id = p.id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'department_leader'
      AND d.id = work_plans.department_id
    )
  );

CREATE POLICY "Zone leaders can manage their zone work plans" ON work_plans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN zones z ON z.leader_id = p.id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'zone_leader'
      AND z.id = work_plans.zone_id
    )
  );

-- Work Plan Tasks policies
CREATE POLICY "Authenticated users can view work plan tasks" ON work_plan_tasks 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pastor can manage all work plan tasks" ON work_plan_tasks 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );

-- Strategic Plans policies
CREATE POLICY "Authenticated users can view strategic plans" ON strategic_plans 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pastor can manage all strategic plans" ON strategic_plans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );

CREATE POLICY "Department leaders can manage their department strategic plans" ON strategic_plans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN departments d ON d.leader_id = p.id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'department_leader'
      AND d.id = strategic_plans.department_id
    )
  );

CREATE POLICY "Zone leaders can manage their zone strategic plans" ON strategic_plans 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN zones z ON z.leader_id = p.id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'zone_leader'
      AND z.id = strategic_plans.zone_id
    )
  );

-- Strategic Goals policies
CREATE POLICY "Authenticated users can view strategic goals" ON strategic_goals 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pastor can manage all strategic goals" ON strategic_goals 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );

-- Strategic Objectives policies
CREATE POLICY "Authenticated users can view strategic objectives" ON strategic_objectives 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and pastor can manage all strategic objectives" ON strategic_objectives 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );

-- Service role full access policies
CREATE POLICY "service_role_work_plans" ON work_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_work_plan_tasks" ON work_plan_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_strategic_plans" ON strategic_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_strategic_goals" ON strategic_goals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_strategic_objectives" ON strategic_objectives FOR ALL TO service_role USING (true) WITH CHECK (true);

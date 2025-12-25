-- Setup basic departments for church management system
-- Run this script if your departments table is empty

-- Insert default departments for typical church structure
INSERT INTO departments (id, name, swahili_name, description, is_active) 
VALUES 
  (
    'default-1',
    'General Assembly',
    'Mkutano wa Jumla',
    'Main church assembly for all members',
    true
  ),
  (
    'default-2',
    'Youth Department',
    'Idara ya Vijana',
    'Department for young people (18-35)',
    true
  ),
  (
    'default-3',
    'Women Department',
    'Idara ya Wanawake',
    'Department for women members',
    true
  ),
  (
    'default-4',
    'Men Department',
    'Idara ya Wanaume',
    'Department for men members',
    true
  ),
  (
    'default-5',
    'Children Department',
    'Idara ya Watoto',
    'Department for children and Sunday school',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Show inserted departments
SELECT id, name, swahili_name, description FROM departments WHERE is_active = true ORDER BY name;
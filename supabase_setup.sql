-- SUPABASE SETUP SQL
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ==========================================
-- OPTIONAL: CLEAN SLATE (Uncomment to reset)
-- ==========================================
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS role_permissions CASCADE;
-- DROP TABLE IF EXISTS permissions CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- 1. Create Tables

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT CHECK (type IN ('Individual', 'Business')),
  status TEXT DEFAULT 'Active',
  pan TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Medium',
  due_date TIMESTAMPTZ,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to UUID, -- References auth.users(id)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY, -- e.g., 'view_dashboard'
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Role Permissions Join Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Initial Data

-- Insert Default Permissions
INSERT INTO permissions (id, name, description) VALUES
  ('view_dashboard', 'View Dashboard', 'Access to the main dashboard'),
  ('view_tasks', 'View Tasks', 'Ability to view tasks'),
  ('manage_tasks', 'Manage Tasks', 'Ability to create, edit, and delete tasks'),
  ('view_clients', 'View Clients', 'Ability to view client list'),
  ('manage_clients', 'Manage Clients', 'Ability to create and edit clients'),
  ('manage_settings', 'Manage Settings', 'Access to system settings'),
  ('view_compliance', 'View Compliance', 'Access to compliance section')
ON CONFLICT (id) DO NOTHING;

-- Insert Default Roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full system access'),
  ('Manager', 'Manage tasks and clients'),
  ('Staff', 'View and update assigned tasks')
ON CONFLICT (name) DO NOTHING;

-- Assign Permissions to Admin Role
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM roles WHERE name = 'Admin';
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_id, id FROM permissions
  ON CONFLICT DO NOTHING;
END $$;

-- 3. RLS (Row Level Security)
-- Enable RLS on tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow authenticated users full access for now)
-- In a real production app, you would restrict this further based on role_id
CREATE POLICY "Allow all access for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');

-- 4. Helper for Admin Setup
-- After you sign up, run this to make yourself an Admin:
-- UPDATE user_profiles SET role_id = (SELECT id FROM roles WHERE name = 'Admin') 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'kartikkhandelwal1104@gmail.com');

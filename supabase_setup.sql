-- SUPABASE SETUP SQL (Full Schema)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ==========================================
-- OPTIONAL: CLEAN SLATE (Uncomment to reset)
-- ==========================================
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS meetings CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS folders CASCADE;
-- DROP TABLE IF EXISTS passwords CASCADE;
-- DROP TABLE IF EXISTS notes CASCADE;
-- DROP TABLE IF EXISTS emails CASCADE;
-- DROP TABLE IF EXISTS deadlines CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS task_types CASCADE;
-- DROP TABLE IF EXISTS workflows CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS role_permissions CASCADE;
-- DROP TABLE IF EXISTS permissions CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- 1. Core Tables

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
  designation TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
  category TEXT,
  address TEXT,
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  statuses TEXT[] NOT NULL,
  transitions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task Types Table
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  workflow_id UUID REFERENCES workflows(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, -- Support KDK-1 style IDs
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Medium',
  due_date TIMESTAMPTZ,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id),
  type TEXT,
  issue_type TEXT,
  tags TEXT[],
  subtasks JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deadlines Table
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE NOT NULL,
  form TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  recurring TEXT,
  est_hours TEXT,
  description TEXT,
  color TEXT,
  subtasks TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_name TEXT,
  from_email TEXT,
  to_email TEXT,
  cc TEXT,
  bcc TEXT,
  client_id UUID REFERENCES clients(id),
  subject TEXT,
  preview TEXT,
  body TEXT,
  date DATE DEFAULT CURRENT_DATE,
  time TEXT,
  read BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'inbox',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  color TEXT,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Passwords Table
CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category TEXT,
  strength INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Folders Table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  client_id UUID REFERENCES clients(id),
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size TEXT,
  client_id UUID REFERENCES clients(id),
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  description TEXT,
  data TEXT, -- Base64 or URL
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  type TEXT,
  platform TEXT,
  meet_link TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER,
  attendees UUID[], -- Array of auth.users IDs
  description TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
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
-- Enable RLS on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON %I;', t);
        EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;

-- 4. Helper for Admin Setup
-- After you sign up, run this to make yourself an Admin:
-- UPDATE user_profiles SET role_id = (SELECT id FROM roles WHERE name = 'Admin') 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'kartikkhandelwal1104@gmail.com');

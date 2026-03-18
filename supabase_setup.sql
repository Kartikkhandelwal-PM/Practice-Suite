-- SUPABASE SETUP SQL (Full Schema)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ==========================================
-- OPTIONAL: CLEAN SLATE (Uncomment to reset)
-- ==========================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS passwords CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS deadlines CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_types CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Core Tables

-- Roles Table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID, -- Optional: for custom roles per organization
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[], -- Array of permission IDs
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions Table
CREATE TABLE permissions (
  id TEXT PRIMARY KEY, -- e.g., 'view_dashboard'
  name TEXT NOT NULL,
  description TEXT,
  module TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles (Extends auth.users)
CREATE TABLE user_profiles (
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
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT CHECK (type IN ('Individual', 'Business')),
  status TEXT DEFAULT 'Active',
  pan TEXT,
  gstin TEXT,
  category TEXT,
  address TEXT,
  services TEXT[],
  manager TEXT,
  active BOOLEAN DEFAULT true,
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflows Table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  statuses TEXT[] NOT NULL,
  transitions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task Types Table
CREATE TABLE task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  workflow_id UUID REFERENCES workflows(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks Table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY, -- Support KDK-1 style IDs
  profile_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Medium',
  due_date TIMESTAMPTZ,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  reporter_id UUID REFERENCES auth.users(id),
  type TEXT,
  issue_type TEXT,
  tags TEXT[],
  subtasks JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  activity JSONB DEFAULT '[]'::jsonb,
  recurring TEXT,
  parent_id TEXT,
  linked_tasks TEXT[],
  dependencies TEXT[],
  statutory_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deadlines Table
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE NOT NULL,
  clients INTEGER DEFAULT 0,
  form TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates Table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
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
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
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
  snoozed BOOLEAN DEFAULT false,
  labels TEXT[],
  attachments TEXT[],
  folder TEXT DEFAULT 'inbox',
  task_linked TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes Table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  color TEXT,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Passwords Table
CREATE TABLE passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category TEXT,
  strength INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Folders Table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  client_id UUID REFERENCES clients(id),
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
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
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
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
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Initial Data

-- Insert Default Permissions
INSERT INTO permissions (id, name, description, module) VALUES
  ('view_dashboard', 'View Dashboard', 'Access to the main dashboard', 'Core'),
  ('view_tasks', 'View Tasks', 'Ability to view tasks', 'Tasks'),
  ('manage_tasks', 'Manage Tasks', 'Ability to create, edit, and delete tasks', 'Tasks'),
  ('view_clients', 'View Clients', 'Ability to view client list', 'Clients'),
  ('manage_clients', 'Manage Clients', 'Ability to create and edit clients', 'Clients'),
  ('manage_settings', 'Manage Settings', 'Access to system settings', 'Settings'),
  ('view_compliance', 'View Compliance', 'Access to compliance section', 'Compliance')
ON CONFLICT (id) DO NOTHING;

-- Insert Default Roles
INSERT INTO roles (name, description, is_system, permissions) VALUES
  ('Admin', 'Full system access', true, ARRAY['view_dashboard', 'view_tasks', 'manage_tasks', 'view_clients', 'manage_clients', 'manage_settings', 'view_compliance']),
  ('Manager', 'Manage tasks and clients', true, ARRAY['view_dashboard', 'view_tasks', 'manage_tasks', 'view_clients', 'manage_clients', 'view_compliance']),
  ('Staff', 'View and update assigned tasks', true, ARRAY['view_dashboard', 'view_tasks', 'view_clients', 'view_compliance'])
ON CONFLICT (name) DO NOTHING;

-- 3. RLS (Row Level Security)
-- Enable RLS on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON %I;', t);
        -- Simple policy: users can only see/edit their own data (where profile_id matches)
        -- For roles and permissions, they are readable by all authenticated users
        IF t IN ('roles', 'permissions') THEN
            EXECUTE format('CREATE POLICY "Allow read for authenticated" ON %I FOR SELECT TO authenticated USING (true);', t);
        ELSE
            -- Check if table has profile_id column
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'profile_id') THEN
                EXECUTE format('CREATE POLICY "Allow owner access" ON %I FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);', t);
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'id' AND t = 'user_profiles') THEN
                EXECUTE format('CREATE POLICY "Allow owner access" ON %I FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);', t);
            ELSE
                -- Fallback for tables without profile_id (like role_permissions if it existed)
                EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 4. Helper for Admin Setup
-- After you sign up, run this to make yourself an Admin:
-- UPDATE user_profiles SET role_id = (SELECT id FROM roles WHERE name = 'Admin') 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'kartikkhandelwal1104@gmail.com');

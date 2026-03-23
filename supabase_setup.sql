-- Comprehensive Supabase Setup Script for KDK Practice Suite
-- This script ensures all tables, columns, and RLS policies are correctly configured.

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Security Definer function to get tenant_id without recursion
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid();
$$;

-- 3. Table Definitions and Column Checks
DO $$ 
BEGIN
    -- user_profiles
    CREATE TABLE IF NOT EXISTS user_profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        tenant_id uuid NOT NULL,
        full_name text,
        email text,
        role_id uuid, -- Changed to uuid
        designation text,
        color text,
        active boolean DEFAULT true,
        avatar_url text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- roles
    CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        description text,
        permissions text[] DEFAULT '{}',
        is_system boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- Migration: Ensure roles table has all required columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'description') THEN
            ALTER TABLE public.roles ADD COLUMN description text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'permissions') THEN
            ALTER TABLE public.roles ADD COLUMN permissions text[] DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'is_system') THEN
            ALTER TABLE public.roles ADD COLUMN is_system boolean DEFAULT false;
        END IF;
    END IF;

    -- Migration: Convert roles.id from text to uuid if necessary
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        -- 1. Drop foreign keys that depend on roles.id
        ALTER TABLE IF EXISTS public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_id_fkey;
        ALTER TABLE IF EXISTS public.permissions DROP CONSTRAINT IF EXISTS permissions_role_id_fkey;
        
        -- 2. Create a temporary mapping for non-uuid roles
        CREATE TEMP TABLE IF NOT EXISTS role_id_mapping AS
        SELECT id as old_id, 
            CASE 
                WHEN id = 'r1' THEN '00000000-0000-0000-0000-000000000001'::uuid
                WHEN id = 'r2' THEN '00000000-0000-0000-0000-000000000002'::uuid
                WHEN id = 'r3' THEN '00000000-0000-0000-0000-000000000003'::uuid
                WHEN id = 'r4' THEN '00000000-0000-0000-0000-000000000004'::uuid
                WHEN id = 'admin' THEN '00000000-0000-0000-0000-000000000001'::uuid
                WHEN id = 'manager' THEN '00000000-0000-0000-0000-000000000002'::uuid
                WHEN id = 'staff' THEN '00000000-0000-0000-0000-000000000003'::uuid
                WHEN id = 'article_clerk' THEN '00000000-0000-0000-0000-000000000004'::uuid
                ELSE uuid_generate_v4() 
            END as new_id
        FROM public.roles
        WHERE id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
        
        -- 3. Update references in user_profiles (if column is text)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role_id' AND data_type = 'text') THEN
            UPDATE public.user_profiles up
            SET role_id = m.new_id::text
            FROM role_id_mapping m
            WHERE up.role_id = m.old_id;
        END IF;
        
        -- 4. Update references in permissions (if column is text)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'role_id' AND data_type = 'text') THEN
            UPDATE public.permissions p
            SET role_id = m.new_id::text
            FROM role_id_mapping m
            WHERE p.role_id = m.old_id;
        END IF;
        
        -- 5. Update roles table (convert non-uuid IDs to uuid strings first)
        UPDATE public.roles r
        SET id = m.new_id::text
        FROM role_id_mapping m
        WHERE r.id = m.old_id;
        
        -- 6. Now safely convert roles.id to uuid
        -- For any remaining non-uuids (shouldn't be any), we use a fallback
        ALTER TABLE public.roles ALTER COLUMN id TYPE uuid USING (
            CASE 
                WHEN id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                THEN id::uuid 
                ELSE uuid_generate_v4() 
            END
        );
        ALTER TABLE public.roles ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        
        -- 7. Convert dependent columns to uuid
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role_id' AND data_type = 'text') THEN
            ALTER TABLE public.user_profiles ALTER COLUMN role_id TYPE uuid USING (
                CASE 
                    WHEN role_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                    THEN role_id::uuid 
                    ELSE NULL 
                END
            );
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'role_id' AND data_type = 'text') THEN
            ALTER TABLE public.permissions ALTER COLUMN role_id TYPE uuid USING (
                CASE 
                    WHEN role_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                    THEN role_id::uuid 
                    ELSE NULL 
                END
            );
        END IF;
        
        DROP TABLE IF EXISTS role_id_mapping;
    END IF;

    -- Ensure foreign keys exist (safe to run whether migration happened or not)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_profiles_role_id_fkey') THEN
            ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
        END IF;
    END IF;
    
    -- permissions
    CREATE TABLE IF NOT EXISTS permissions (
        id text,
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        description text,
        module text,
        role_id uuid,
        created_at timestamptz DEFAULT now(),
        PRIMARY KEY (id, tenant_id)
    );

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'role_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'permissions_role_id_fkey') THEN
            ALTER TABLE public.permissions ADD CONSTRAINT permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
        END IF;
    END IF;

    -- clients
    CREATE TABLE IF NOT EXISTS clients (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        type text,
        category text,
        pan text,
        gstin text,
        email text,
        phone text,
        address text,
        manager uuid,
        services text[] DEFAULT '{}',
        onboarded_at text,
        status text DEFAULT 'Active',
        active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- tasks
    CREATE TABLE IF NOT EXISTS tasks (
        id text PRIMARY KEY,
        tenant_id uuid NOT NULL,
        client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
        title text NOT NULL,
        type text,
        issue_type text DEFAULT 'Task',
        priority text DEFAULT 'Medium',
        status text DEFAULT 'To Do',
        assigned_to uuid,
        reviewer_id uuid,
        reporter_id uuid,
        due_date text,
        period text, -- e.g., "2024-10"
        unique_key text, -- tenant_id:client_id:type:period
        statutory_deadline text,
        parent_id text,
        linked_tasks text[] DEFAULT '{}',
        dependencies text[] DEFAULT '{}',
        recurring text,
        description text,
        tags text[] DEFAULT '{}',
        subtasks jsonb DEFAULT '[]',
        comments jsonb DEFAULT '[]',
        attachments jsonb DEFAULT '[]',
        activity jsonb DEFAULT '[]',
        created_at text,
        updated_at timestamptz DEFAULT now()
    );

    -- deadlines
    CREATE TABLE IF NOT EXISTS deadlines (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        title text NOT NULL,
        description text,
        due_date text,
        category text,
        priority text DEFAULT 'Medium',
        clients integer DEFAULT 0,
        form text,
        section text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- templates
    CREATE TABLE IF NOT EXISTS templates (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        type text NOT NULL DEFAULT 'Other',
        category text,
        recurring text,
        est_hours text,
        description text,
        color text,
        subtasks text[] DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- meetings
    CREATE TABLE IF NOT EXISTS meetings (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
        title text NOT NULL,
        description text,
        type text,
        platform text,
        meet_link text,
        date text,
        time text,
        duration integer,
        attendees text[] DEFAULT '{}',
        notes text,
        status text DEFAULT 'scheduled',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- notes
    CREATE TABLE IF NOT EXISTS notes (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        title text NOT NULL,
        content text,
        category text,
        color text,
        pinned boolean DEFAULT false,
        created_by uuid,
        created_at text,
        updated_at text
    );

    -- passwords
    CREATE TABLE IF NOT EXISTS passwords (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
        service text NOT NULL, -- Changed from portal to service to match error
        portal text,
        username text,
        password text,
        url text,
        notes text,
        category text,
        strength integer DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at text
    );

    -- folders
    CREATE TABLE IF NOT EXISTS folders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
        client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
        icon text DEFAULT 'folder',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- documents
    CREATE TABLE IF NOT EXISTS documents (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
        client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
        name text NOT NULL,
        type text,
        size text,
        data text,
        tags text[] DEFAULT '{}',
        description text,
        uploaded_by uuid,
        created_at text,
        updated_at timestamptz DEFAULT now()
    );

    -- emails
    CREATE TABLE IF NOT EXISTS emails (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        "from" text,
        from_email text,
        to_email text,
        cc text,
        bcc text,
        client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
        subject text,
        preview text,
        body text,
        date text,
        time text,
        read boolean DEFAULT false,
        starred boolean DEFAULT false,
        snoozed boolean DEFAULT false,
        labels text[] DEFAULT '{}',
        task_linked text,
        folder text DEFAULT 'inbox',
        attachments text[] DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- task_types
    CREATE TABLE IF NOT EXISTS task_types (
        id text PRIMARY KEY,
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        category text,
        icon text,
        color text,
        default_workflow_id uuid,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- workflows
    CREATE TABLE IF NOT EXISTS workflows (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        description text,
        statuses text[] DEFAULT '{}',
        transitions jsonb DEFAULT '[]',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- notifications
    CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        user_id uuid NOT NULL,
        text text NOT NULL,
        type text DEFAULT 'info',
        link text,
        read boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
    );

    -- Enable RLS on all tables
    ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS workflows ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS task_types ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS deadlines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS emails ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS passwords ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS folders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS meetings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

    -- Policies for tasks
    DROP POLICY IF EXISTS "Users can view their tenant's tasks" ON tasks;
    CREATE POLICY "Users can view their tenant's tasks" ON tasks
      FOR SELECT USING (tenant_id = get_my_tenant_id());

    DROP POLICY IF EXISTS "Users can insert tasks for their tenant" ON tasks;
    CREATE POLICY "Users can insert tasks for their tenant" ON tasks
      FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

    DROP POLICY IF EXISTS "Users can update their tenant's tasks" ON tasks;
    CREATE POLICY "Users can update their tenant's tasks" ON tasks
      FOR UPDATE USING (tenant_id = get_my_tenant_id());

    DROP POLICY IF EXISTS "Users can delete their tenant's tasks" ON tasks;
    CREATE POLICY "Users can delete their tenant's tasks" ON tasks
      FOR DELETE USING (tenant_id = get_my_tenant_id());

END $$;

-- 4. Ensure all columns exist (for existing tables)
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS module text;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id);
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Deadlines
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS clients integer DEFAULT 0;
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS form text;
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS category text;

-- Passwords
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS service text;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS portal text;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS strength integer DEFAULT 0;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.passwords ADD COLUMN IF NOT EXISTS notes text;

-- Ensure service is not null if it exists
DO $$ 
BEGIN
    -- If service exists, try to fill it from portal if null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passwords' AND column_name = 'service') THEN
        UPDATE public.passwords SET service = portal WHERE service IS NULL AND portal IS NOT NULL;
        UPDATE public.passwords SET service = 'Unknown' WHERE service IS NULL;
        -- We don't force NOT NULL here to avoid breaking existing setups if they don't have it yet, 
        -- but the CREATE TABLE above will have it.
    END IF;
END $$;

-- Task Types
ALTER TABLE public.task_types ADD COLUMN IF NOT EXISTS default_workflow_id uuid;
ALTER TABLE public.task_types ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.task_types ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.task_types ADD COLUMN IF NOT EXISTS color text;

-- Meetings
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS date text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS time text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS duration integer;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS attendees text[] DEFAULT '{}';
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled';
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meet_link text;

-- Clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.clients ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pan text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS manager uuid;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS onboarded_at text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';

-- Tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS period text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS unique_key text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'To Do';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reviewer_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks jsonb DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS activity jsonb DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES public.user_profiles(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS linked_tasks text[] DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS dependencies text[] DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS issue_type text DEFAULT 'Task';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS statutory_deadline text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_id text;

-- Templates
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS type text;
UPDATE public.templates SET type = category WHERE type IS NULL;
ALTER TABLE public.templates ALTER COLUMN type SET DEFAULT 'Other';
ALTER TABLE public.templates ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS recurring text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS est_hours text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS subtasks text[] DEFAULT '{}';

-- User Profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS dashboard_image_url text;

-- Notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS category text;

-- Documents & Folders
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS icon text DEFAULT 'folder';
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);

-- Workflows
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS statuses text[] DEFAULT '{}';
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS transitions jsonb DEFAULT '[]';
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS description text;

-- Fix null tenant_ids in permissions before making it a primary key
UPDATE public.permissions p
SET tenant_id = r.tenant_id
FROM public.roles r
WHERE p.role_id = r.id AND p.tenant_id IS NULL;

-- Delete any orphaned permissions that still have null tenant_id to avoid primary key constraint errors
DELETE FROM public.permissions WHERE tenant_id IS NULL;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'permissions_pkey' AND table_name = 'permissions') THEN
        ALTER TABLE public.permissions DROP CONSTRAINT permissions_pkey CASCADE;
        ALTER TABLE public.permissions ADD PRIMARY KEY (id, tenant_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_unique_key_key' AND table_name = 'tasks') THEN
        ALTER TABLE public.tasks DROP CONSTRAINT tasks_unique_key_key;
    END IF;
END $$;

DO $$ 
DECLARE
    r record;
BEGIN
    -- tenant_id on all tables (idempotent)
    FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid', r.table_name);
    END LOOP;
END $$;

-- 4. Grant permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 5. Enable RLS on all tables
DO $$ 
DECLARE
    r record;
BEGIN
    FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
    END LOOP;
END $$;

-- 6. Re-apply RLS Policies (using get_my_tenant_id() to avoid recursion)
DO $$ 
DECLARE
    r record;
BEGIN
    FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        -- Skip user_profiles in the generic loop to avoid recursion with get_my_tenant_id()
        IF r.table_name != 'user_profiles' THEN
            EXECUTE format('DROP POLICY IF EXISTS "Allow tenant access" ON %I', r.table_name);
            EXECUTE format('CREATE POLICY "Allow tenant access" ON %I FOR ALL USING (tenant_id = get_my_tenant_id()) WITH CHECK (tenant_id = get_my_tenant_id())', r.table_name);
        END IF;
    END LOOP;
END $$;

-- Special policies for roles and user_profiles to allow initial access
DROP POLICY IF EXISTS "Allow system roles access" ON roles;
CREATE POLICY "Allow system roles access" ON roles FOR SELECT USING (is_system = true OR tenant_id = get_my_tenant_id());

-- User Profiles policies (No recursion here)
DROP POLICY IF EXISTS "Allow tenant access" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON user_profiles;
CREATE POLICY "Allow users to read their own profile" ON user_profiles FOR SELECT USING (id = auth.uid() OR tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON user_profiles;
CREATE POLICY "Allow users to insert their own profile" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Allow users to update their own profile" ON user_profiles;
CREATE POLICY "Allow users to update their own profile" ON user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Reload schema cache to ensure new columns are visible
NOTIFY pgrst, 'reload schema';

-- 7. Trigger for new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Use user ID as tenant ID for the owner (first user of the tenant)
  new_tenant_id := new.id;
  
  -- Check if profile already exists to avoid duplicate key error
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = new.id) THEN
    INSERT INTO public.user_profiles (id, tenant_id, full_name, email, role_id, active)
    VALUES (new.id, new_tenant_id, new.raw_user_meta_data->>'full_name', new.email, NULL, true);
  END IF;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Refresh PostgREST cache (best effort)
NOTIFY pgrst, 'reload schema';

-- 9. Add dashboard_image_url and other missing columns to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS dashboard_image_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

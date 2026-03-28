-- SQL Setup for Supabase
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ===============================================================
-- ⚠️ CRITICAL: SUPABASE SERVICE ROLE KEY
-- ===============================================================
-- This application requires the "service_role" secret to bypass 
-- Row Level Security (RLS) for backend operations like email sync.
-- 
-- 1. Go to your Supabase Dashboard -> Project Settings -> API
-- 2. Find the "service_role" secret (NOT the "anon" public key)
-- 3. Copy it and set it as SUPABASE_SERVICE_ROLE_KEY in AI Studio Secrets.
-- ===============================================================

-- 1. Create user_tokens table for OAuth integrations
CREATE TABLE IF NOT EXISTS public.user_tokens (
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry TIMESTAMPTZ,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, provider)
);

-- Ensure primary key exists if table was created without it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tokens_pkey') THEN
        ALTER TABLE public.user_tokens ADD PRIMARY KEY (user_id, provider);
    END IF;
END $$;

-- 2. Enable RLS on user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for user_tokens
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Service role bypass user_tokens" ON public.user_tokens;

-- Allow users to see only their own tokens
CREATE POLICY "Users can view their own tokens" ON public.user_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert/update their own tokens
CREATE POLICY "Users can manage their own tokens" ON public.user_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Explicitly allow service_role to bypass RLS
CREATE POLICY "Service role bypass user_tokens" ON public.user_tokens
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Ensure other critical tables exist (basic versions)
-- Note: These are simplified. Your app may need more columns.

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID NOT NULL,
    email TEXT,
    full_name TEXT,
    role_id UUID,
    designation TEXT,
    avatar_url TEXT,
    color TEXT,
    active BOOLEAN DEFAULT TRUE,
    project_prefix TEXT DEFAULT 'KDK',
    cloud_storage_settings JSONB DEFAULT '{"autoSync": true, "clientSpecificFolders": true}',
    last_email_sync_at TIMESTAMPTZ,
    allowed_sync_emails JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new columns exist in user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'project_prefix') THEN
        ALTER TABLE public.user_profiles ADD COLUMN project_prefix TEXT DEFAULT 'KDK';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'cloud_storage_settings') THEN
        ALTER TABLE public.user_profiles ADD COLUMN cloud_storage_settings JSONB DEFAULT '{"autoSync": true, "clientSpecificFolders": true}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_email_sync_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_email_sync_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'allowed_sync_emails') THEN
        ALTER TABLE public.user_profiles ADD COLUMN allowed_sync_emails JSONB DEFAULT '[]';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    tenant_id UUID, -- Optional, for custom permissions
    name TEXT NOT NULL,
    description TEXT,
    module TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure primary key exists and is unique for ON CONFLICT
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permissions_pkey') THEN
        ALTER TABLE public.permissions ADD PRIMARY KEY (id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    pan TEXT,
    gstin TEXT,
    address TEXT,
    category TEXT,
    active BOOLEAN DEFAULT TRUE,
    onboarded_at TEXT,
    manager UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    statuses JSONB DEFAULT '[]',
    transitions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    icon TEXT,
    color TEXT,
    default_workflow_id UUID REFERENCES public.workflows(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    priority TEXT,
    due_date DATE,
    assigned_to UUID REFERENCES public.user_profiles(id),
    client_id UUID REFERENCES public.clients(id),
    task_type_id UUID REFERENCES public.task_types(id),
    workflow_id UUID REFERENCES public.workflows(id),
    reviewer_id UUID REFERENCES public.user_profiles(id),
    reporter_id UUID REFERENCES public.user_profiles(id),
    issue_type TEXT,
    parent_id TEXT REFERENCES public.tasks(id),
    statutory_deadline DATE,
    linked_tasks JSONB DEFAULT '[]',
    activity JSONB DEFAULT '[]',
    subtasks JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    client_id UUID REFERENCES public.clients(id),
    task_id UUID REFERENCES public.tasks(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emails (
    id TEXT PRIMARY KEY, -- Using provider-id format
    tenant_id UUID NOT NULL,
    provider TEXT NOT NULL,
    from_name TEXT,
    from_email TEXT,
    to_email TEXT,
    subject TEXT,
    body TEXT,
    preview TEXT,
    date TEXT,
    time TEXT,
    read BOOLEAN DEFAULT FALSE,
    folder TEXT DEFAULT 'inbox',
    client_id UUID REFERENCES public.clients(id),
    task_linked TEXT,
    attachments JSONB DEFAULT '[]',
    starred BOOLEAN DEFAULT FALSE,
    snoozed BOOLEAN DEFAULT FALSE,
    labels JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new columns exist in emails
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'folder') THEN
        ALTER TABLE public.emails ADD COLUMN folder TEXT DEFAULT 'inbox';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'task_linked') THEN
        ALTER TABLE public.emails ADD COLUMN task_linked TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'attachments') THEN
        ALTER TABLE public.emails ADD COLUMN attachments JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'starred') THEN
        ALTER TABLE public.emails ADD COLUMN starred BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'snoozed') THEN
        ALTER TABLE public.emails ADD COLUMN snoozed BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'labels') THEN
        ALTER TABLE public.emails ADD COLUMN labels JSONB DEFAULT '[]';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    due_date DATE,
    client_id UUID REFERENCES public.clients(id),
    status TEXT,
    priority TEXT,
    description TEXT,
    clients JSONB DEFAULT '[]',
    form TEXT,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    type TEXT,
    content TEXT,
    est_hours INTEGER,
    subtasks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    client_id UUID REFERENCES public.clients(id),
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    username TEXT,
    password TEXT,
    url TEXT,
    notes TEXT,
    client_id UUID REFERENCES public.clients(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT,
    size INTEGER,
    url TEXT,
    folder_id UUID REFERENCES public.folders(id),
    client_id UUID REFERENCES public.clients(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 161. Create a helper function to get the current user's tenant_id without recursion
-- Using PL/pgSQL and explicit search_path to ensure it bypasses RLS correctly
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  SELECT tenant_id INTO _tenant_id FROM public.user_profiles WHERE id = auth.uid();
  RETURN _tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 162. Create basic RLS policies (Tenant-based isolation)
-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation for %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation" ON public.%I', t);
    END LOOP;
END $$;

-- Special handling for user_profiles to avoid recursion
-- Users can always see and manage their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- Users can see others in the same tenant (using the non-recursive function)
DROP POLICY IF EXISTS "Users can view tenant members" ON public.user_profiles;
CREATE POLICY "Users can view tenant members" ON public.user_profiles
    FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Standard tenant isolation for other tables
DROP POLICY IF EXISTS "Tenant isolation for emails" ON public.emails;
CREATE POLICY "Tenant isolation for emails" ON public.emails FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for tasks" ON public.tasks;
CREATE POLICY "Tenant isolation for tasks" ON public.tasks FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for clients" ON public.clients;
CREATE POLICY "Tenant isolation for clients" ON public.clients FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for notes" ON public.notes;
CREATE POLICY "Tenant isolation for notes" ON public.notes FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for workflows" ON public.workflows;
CREATE POLICY "Tenant isolation for workflows" ON public.workflows FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for task_types" ON public.task_types;
CREATE POLICY "Tenant isolation for task_types" ON public.task_types FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for roles" ON public.roles;
DROP POLICY IF EXISTS "Tenant isolation for roles manage" ON public.roles;
CREATE POLICY "Tenant isolation for roles" ON public.roles FOR SELECT USING (is_system = true OR tenant_id = public.get_my_tenant_id());
CREATE POLICY "Tenant isolation for roles manage" ON public.roles FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for permissions" ON public.permissions;
DROP POLICY IF EXISTS "Tenant isolation for permissions manage" ON public.permissions;
CREATE POLICY "Tenant isolation for permissions" ON public.permissions FOR SELECT USING (tenant_id IS NULL OR tenant_id = public.get_my_tenant_id());
CREATE POLICY "Tenant isolation for permissions manage" ON public.permissions FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for deadlines" ON public.deadlines;
CREATE POLICY "Tenant isolation for deadlines" ON public.deadlines FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for templates" ON public.templates;
CREATE POLICY "Tenant isolation for templates" ON public.templates FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for meetings" ON public.meetings;
CREATE POLICY "Tenant isolation for meetings" ON public.meetings FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for passwords" ON public.passwords;
CREATE POLICY "Tenant isolation for passwords" ON public.passwords FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for documents" ON public.documents;
CREATE POLICY "Tenant isolation for documents" ON public.documents FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for folders" ON public.folders;
CREATE POLICY "Tenant isolation for folders" ON public.folders FOR ALL USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for notifications" ON public.notifications;
CREATE POLICY "Tenant isolation for notifications" ON public.notifications FOR ALL USING (tenant_id = public.get_my_tenant_id());

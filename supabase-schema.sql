
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'Staff',
  designation TEXT,
  color TEXT DEFAULT '#2563eb',
  active BOOLEAN DEFAULT true,
  avatarUrl TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pan TEXT,
  gstin TEXT,
  category TEXT,
  services TEXT[],
  manager UUID REFERENCES profiles(id),
  email TEXT,
  phone TEXT,
  address TEXT,
  onboarded DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create workflows table
CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  statuses TEXT[] NOT NULL,
  transitions JSONB NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create task_types table
CREATE TABLE task_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  workflowId UUID REFERENCES workflows(id),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY, -- Using KDK-1 style IDs or UUIDs
  title TEXT NOT NULL,
  clientId UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT,
  issueType TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigneeId UUID REFERENCES profiles(id),
  reviewerId UUID REFERENCES profiles(id),
  reporterId UUID REFERENCES profiles(id),
  dueDate DATE,
  recurring TEXT,
  description TEXT,
  tags TEXT[],
  parentId TEXT REFERENCES tasks(id),
  subtasks JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  activity JSONB DEFAULT '[]'::jsonb,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create deadlines table
CREATE TABLE deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  dueDate DATE NOT NULL,
  clientsCount INTEGER DEFAULT 0,
  form TEXT,
  section TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create templates table
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  recurring TEXT,
  estHours TEXT,
  description TEXT,
  color TEXT,
  subtasks TEXT[],
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create emails table
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fromName TEXT,
  fromEmail TEXT,
  toEmail TEXT,
  cc TEXT,
  bcc TEXT,
  clientId UUID REFERENCES clients(id),
  subject TEXT,
  preview TEXT,
  body TEXT,
  date DATE DEFAULT CURRENT_DATE,
  time TEXT,
  read BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  snoozed BOOLEAN DEFAULT false,
  labels TEXT[],
  taskLinked TEXT REFERENCES tasks(id),
  attachments TEXT[],
  folder TEXT DEFAULT 'inbox',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  color TEXT,
  pinned BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create passwords table
CREATE TABLE passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clientId UUID REFERENCES clients(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category TEXT,
  strength INTEGER,
  lastUpdated DATE DEFAULT CURRENT_DATE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create folders table
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parentId UUID REFERENCES folders(id),
  clientId UUID REFERENCES clients(id),
  icon TEXT DEFAULT 'folder',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folderId UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size TEXT,
  clientId UUID REFERENCES clients(id),
  tags TEXT[],
  uploadedBy UUID REFERENCES profiles(id),
  uploadedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  description TEXT,
  data TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create meetings table
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  clientId UUID REFERENCES clients(id),
  type TEXT,
  platform TEXT,
  meetLink TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER,
  attendees UUID[], -- Array of profile IDs
  description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read BOOLEAN DEFAULT false,
  type TEXT NOT NULL,
  link TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies (Simplified: Authenticated users can do everything for now)
-- In a real app, you'd restrict this based on roles or ownership.
CREATE POLICY "Allow authenticated read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individual update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON clients FOR DELETE TO authenticated USING (true);

-- Repeat for other tables... (Simplified for brevity, but same principle)
CREATE POLICY "Allow authenticated read" ON workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON task_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON passwords FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON notifications FOR SELECT TO authenticated USING (true);

-- Allow all actions for authenticated users on all tables for development speed
-- (Note: In production, you should be more specific)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;

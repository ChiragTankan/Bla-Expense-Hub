-- =========================================================================
-- BLA EXPENSE HUB - SUPABASE SQL SCHEMA
-- Run this script in the Supabase SQL Editor to create all cloud tables
-- =========================================================================

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  department TEXT DEFAULT 'General Operations',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Admins
INSERT INTO public.users (id, name, email, password, role, department, created_at)
VALUES 
  ('usr-admin-1', 'Chirag Tankan', 'chiragtankan@gmail.com', 'admin', 'admin', 'Executive Leadership', NOW()),
  ('usr-admin-2', 'Pardeep Sir', 'pardeepsir@company.com', 'admin', 'admin', 'Executive Leadership', NOW()),
  ('usr-admin-3', 'Mayank', 'mayank@company.com', 'admin', 'admin', 'Executive Leadership', NOW()),
  ('usr-admin-4', 'Pardeep Sir (Alias)', 'pardeep@enterprise.com', 'admin', 'admin', 'Executive Leadership', NOW()),
  ('usr-admin-5', 'Mayank (Alias)', 'mayank@enterprise.com', 'admin', 'admin', 'Executive Leadership', NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. DIRECT MESSAGES (1-ON-1) TABLE
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_dm_participants ON public.direct_messages (sender_email, recipient_email);

-- 3. DAILY UPDATES (COMPANY GROUP CHAT) TABLE
CREATE TABLE IF NOT EXISTS public.daily_updates (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_department TEXT DEFAULT 'Operations',
  tag TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  likes JSONB DEFAULT '[]'::jsonb
);

-- 4. ADMIN & TEAM CALLS (GOOGLE MEET COLLABORATION & PAST MEETS) TABLE
CREATE TABLE IF NOT EXISTS public.admin_calls (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  host_email TEXT NOT NULL,
  host_role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  platform TEXT DEFAULT 'Google Meet',
  scheduled_time TEXT DEFAULT 'Active Now',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ended_by TEXT,
  mom_note TEXT
);

-- 5. EXPENSE APPLICATIONS & CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  expense_type TEXT NOT NULL,
  date_time TIMESTAMPTZ DEFAULT NOW(),
  motive TEXT NOT NULL,
  receipt_url TEXT,
  receipt_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SYSTEM & MENTION NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  link_id TEXT,
  sender_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_email);

-- Enable Row Level Security (RLS) with open public access policies for anon client
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read direct_messages" ON public.direct_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert direct_messages" ON public.direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update direct_messages" ON public.direct_messages FOR UPDATE USING (true);

CREATE POLICY "Allow public read daily_updates" ON public.daily_updates FOR SELECT USING (true);
CREATE POLICY "Allow public insert daily_updates" ON public.daily_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update daily_updates" ON public.daily_updates FOR UPDATE USING (true);

CREATE POLICY "Allow public read admin_calls" ON public.admin_calls FOR SELECT USING (true);
CREATE POLICY "Allow public insert admin_calls" ON public.admin_calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update admin_calls" ON public.admin_calls FOR UPDATE USING (true);
CREATE POLICY "Allow public delete admin_calls" ON public.admin_calls FOR DELETE USING (true);

CREATE POLICY "Allow public read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);

CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notifications" ON public.notifications FOR UPDATE USING (true);

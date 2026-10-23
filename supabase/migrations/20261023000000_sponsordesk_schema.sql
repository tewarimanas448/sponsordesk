-- SponsorDesk Supabase Database Migration
-- Multi-tenant schema with Row Level Security (RLS) for College Fest & Club Sponsorship Management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_description TEXT,
  event_start_date DATE,
  event_end_date DATE,
  expected_attendance INTEGER DEFAULT 5000,
  audience_description TEXT,
  contact_email TEXT NOT NULL,
  website_url TEXT,
  currency TEXT DEFAULT 'INR' NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Workspace Members Table (Multi-tenant authorization)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- 4. Sponsorship Tiers Table
CREATE TABLE IF NOT EXISTS public.sponsorship_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  benefits JSONB DEFAULT '[]'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Prospects Table (Sponsors CRM)
CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT,
  contact_name TEXT,
  contact_designation TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  fit_rationale TEXT,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (
    stage IN ('lead', 'contacted', 'replied', 'meeting', 'negotiation', 'won', 'lost')
  ),
  tier_id UUID REFERENCES public.sponsorship_tiers(id) ON DELETE SET NULL,
  expected_value NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  agreed_value NUMERIC(12, 2) DEFAULT 0,
  lead_source TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  lost_reason TEXT,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Follow-ups Table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (
    status IN ('upcoming', 'due_today', 'overdue', 'completed', 'cancelled')
  ),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Pitches Table (AI Generated & Saved)
CREATE TABLE IF NOT EXISTS public.pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.sponsorship_tiers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp')),
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'friendly', 'concise', 'persuasive')),
  subject TEXT,
  body TEXT NOT NULL,
  generation_source TEXT NOT NULL DEFAULT 'gemini' CHECK (generation_source IN ('gemini', 'demo', 'manual')),
  generation_inputs JSONB DEFAULT '{}'::jsonb NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('draft', 'saved', 'sent')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospects_ws_stage ON public.prospects(workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_prospects_next_follow_up ON public.prospects(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON public.follow_ups(workspace_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_pitches_prospect ON public.pitches(prospect_id);
CREATE INDEX IF NOT EXISTS idx_activity_prospect ON public.activity_logs(prospect_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is member of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Profiles: users can view all member profiles, edit own profile
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workspaces: users can view workspaces they are members of
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id));

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Workspace owners/admins can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Workspace Members
CREATE POLICY "Members can view membership of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace owners can manage members"
  ON public.workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Sponsorship Tiers
CREATE POLICY "Members can view tiers in workspace"
  ON public.sponsorship_tiers FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can modify tiers in workspace"
  ON public.sponsorship_tiers FOR ALL
  USING (public.is_workspace_member(workspace_id));

-- Prospects
CREATE POLICY "Members can view prospects in workspace"
  ON public.prospects FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can modify prospects in workspace"
  ON public.prospects FOR ALL
  USING (public.is_workspace_member(workspace_id));

-- Follow-ups
CREATE POLICY "Members can view follow_ups in workspace"
  ON public.follow_ups FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can modify follow_ups in workspace"
  ON public.follow_ups FOR ALL
  USING (public.is_workspace_member(workspace_id));

-- Pitches
CREATE POLICY "Members can view pitches in workspace"
  ON public.pitches FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can modify pitches in workspace"
  ON public.pitches FOR ALL
  USING (public.is_workspace_member(workspace_id));

-- Activity Logs
CREATE POLICY "Members can view activity_logs in workspace"
  ON public.activity_logs FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can insert activity_logs in workspace"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Automatic profile creation trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

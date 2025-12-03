-- Create enums for role-based access control
CREATE TYPE public.system_role AS ENUM ('super_admin', 'user');
CREATE TYPE public.site_permission AS ENUM ('viewer', 'editor', 'manager');

-- Create profiles table (public user info, NO roles here)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (system-level roles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.system_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create sites table (core CMS data)
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  api_key UUID DEFAULT gen_random_uuid() NOT NULL,
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  schema JSONB,
  content JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create site_members table (per-site permissions)
CREATE TABLE public.site_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission public.site_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(site_id, user_id)
);

-- Create security definer function to check system roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_system_role(_user_id UUID, _role public.system_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_system_role(_user_id, 'super_admin'::public.system_role)
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger for sites updated_at
CREATE TRIGGER set_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Super admins can do everything
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all profiles"
  ON public.profiles FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
-- Only super admins can manage roles
CREATE POLICY "Super admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for sites
-- Super admins can do everything
CREATE POLICY "Super admins can view all sites"
  ON public.sites FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert sites"
  ON public.sites FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all sites"
  ON public.sites FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all sites"
  ON public.sites FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Site members can view their assigned sites
CREATE POLICY "Site members can view assigned sites"
  ON public.sites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_members
      WHERE site_members.site_id = sites.id
        AND site_members.user_id = auth.uid()
    )
  );

-- Editors and managers can update site content
CREATE POLICY "Editors and managers can update sites"
  ON public.sites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_members
      WHERE site_members.site_id = sites.id
        AND site_members.user_id = auth.uid()
        AND site_members.permission IN ('editor', 'manager')
    )
  );

-- RLS Policies for site_members
-- Super admins can do everything
CREATE POLICY "Super admins can view all site members"
  ON public.site_members FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert site members"
  ON public.site_members FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update site members"
  ON public.site_members FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete site members"
  ON public.site_members FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Managers can view members of their sites
CREATE POLICY "Managers can view site members"
  ON public.site_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_members AS sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.permission = 'manager'
    )
  );

-- Managers can add members to their sites
CREATE POLICY "Managers can add site members"
  ON public.site_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.site_members AS sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.permission = 'manager'
    )
  );

-- Managers can update members of their sites (but not change permissions to manager)
CREATE POLICY "Managers can update site members"
  ON public.site_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_members AS sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.permission = 'manager'
    )
  )
  WITH CHECK (
    permission IN ('viewer', 'editor') -- Managers can't create other managers
  );

-- Managers can remove members from their sites (but not other managers)
CREATE POLICY "Managers can remove site members"
  ON public.site_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_members AS sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.permission = 'manager'
    )
    AND site_members.permission != 'manager' -- Can't remove other managers
  );

-- Users can view their own site memberships
CREATE POLICY "Users can view own site memberships"
  ON public.site_members FOR SELECT
  USING (auth.uid() = user_id);
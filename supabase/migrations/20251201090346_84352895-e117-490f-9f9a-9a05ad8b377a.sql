-- Drop existing problematic policies on site_members
DROP POLICY IF EXISTS "Managers can add site members" ON public.site_members;
DROP POLICY IF EXISTS "Managers can remove site members" ON public.site_members;
DROP POLICY IF EXISTS "Managers can update site members" ON public.site_members;
DROP POLICY IF EXISTS "Managers can view site members" ON public.site_members;

-- Create security definer function to check if user has specific permission on a site
CREATE OR REPLACE FUNCTION public.has_site_permission(_user_id uuid, _site_id uuid, _permission site_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.site_members
    WHERE user_id = _user_id
      AND site_id = _site_id
      AND permission = _permission
  )
$$;

-- Create security definer function to check if user is manager of a site
CREATE OR REPLACE FUNCTION public.is_site_manager(_user_id uuid, _site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_site_permission(_user_id, _site_id, 'manager'::site_permission)
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Managers can view site members"
ON public.site_members
FOR SELECT
USING (public.is_site_manager(auth.uid(), site_id));

CREATE POLICY "Managers can add site members"
ON public.site_members
FOR INSERT
WITH CHECK (public.is_site_manager(auth.uid(), site_id));

CREATE POLICY "Managers can update site members"
ON public.site_members
FOR UPDATE
USING (public.is_site_manager(auth.uid(), site_id))
WITH CHECK (permission IN ('viewer'::site_permission, 'editor'::site_permission));

CREATE POLICY "Managers can remove site members"
ON public.site_members
FOR DELETE
USING (public.is_site_manager(auth.uid(), site_id) AND permission <> 'manager'::site_permission);
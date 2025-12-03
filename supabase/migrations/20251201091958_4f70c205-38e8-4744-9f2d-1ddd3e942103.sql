-- Create public read policy for sites (for client demos)
-- This allows anyone to read site content by slug
CREATE POLICY "Public can read site content by slug"
ON public.sites
FOR SELECT
USING (true);

-- Note: In production, this should be replaced with an edge function
-- that requires API key authentication
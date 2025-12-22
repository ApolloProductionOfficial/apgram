-- Drop the still-permissive policy
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.site_analytics;

-- Create a proper policy: only authenticated users can insert analytics
CREATE POLICY "Only authenticated users can insert analytics"
ON public.site_analytics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
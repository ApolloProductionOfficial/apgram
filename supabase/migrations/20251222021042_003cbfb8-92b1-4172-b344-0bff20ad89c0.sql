-- Create site analytics table
CREATE TABLE public.site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  user_id uuid,
  session_id text,
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can view analytics
CREATE POLICY "Admins can view all analytics"
ON public.site_analytics
FOR SELECT
USING (is_admin());

-- Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.site_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can delete
CREATE POLICY "Admins can delete analytics"
ON public.site_analytics
FOR DELETE
USING (is_admin());

-- Create index for common queries
CREATE INDEX idx_site_analytics_event_type ON public.site_analytics(event_type);
CREATE INDEX idx_site_analytics_created_at ON public.site_analytics(created_at DESC);
CREATE INDEX idx_site_analytics_user_id ON public.site_analytics(user_id);
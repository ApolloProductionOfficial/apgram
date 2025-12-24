
-- Create model_applications table for recruitment form
CREATE TABLE public.model_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact info
  telegram_username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Personal info
  age INTEGER NOT NULL,
  hair_color TEXT NOT NULL,
  body_params TEXT NOT NULL, -- 91/56/91 format
  height TEXT NOT NULL,
  weight TEXT NOT NULL,
  
  -- Languages & citizenship
  language_skills TEXT NOT NULL, -- List of languages with levels
  citizenship TEXT,
  
  -- Goals
  desired_income TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}', -- Which platforms they want to work on
  
  -- About
  about_yourself TEXT NOT NULL,
  strong_points TEXT,
  
  -- Social media
  social_media_experience TEXT[] NOT NULL DEFAULT '{}', -- Twitter, Instagram, etc.
  social_media_links TEXT, -- Links with follower counts
  
  -- Equipment & availability  
  equipment TEXT NOT NULL,
  time_availability TEXT NOT NULL,
  
  -- Income proof
  income_screenshots TEXT[], -- URLs to uploaded screenshots
  
  -- Photos
  portfolio_photos TEXT[] NOT NULL DEFAULT '{}', -- URLs to uploaded photos
  
  -- Content preferences (what they're OK with)
  content_preferences TEXT[] NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.model_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (no auth required for submission)
CREATE POLICY "Anyone can submit application"
ON public.model_applications
FOR INSERT
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Only admins can view applications"
ON public.model_applications
FOR SELECT
USING (is_admin());

-- Only admins can update applications
CREATE POLICY "Only admins can update applications"
ON public.model_applications
FOR UPDATE
USING (is_admin());

-- Only admins can delete applications
CREATE POLICY "Only admins can delete applications"
ON public.model_applications
FOR DELETE
USING (is_admin());

-- Create storage bucket for application files
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-applications', 'model-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - anyone can upload to their folder
CREATE POLICY "Anyone can upload application files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'model-applications');

-- Only admins can view application files
CREATE POLICY "Admins can view application files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'model-applications' AND is_admin());

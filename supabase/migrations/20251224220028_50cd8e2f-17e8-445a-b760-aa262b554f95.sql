-- Fix RLS policy for bot_welcome_settings to allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated users to update bot_welcome_settings" ON public.bot_welcome_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert bot_welcome_settings" ON public.bot_welcome_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read bot_welcome_settings" ON public.bot_welcome_settings;

-- Allow anyone to read settings (needed for bot)
CREATE POLICY "Allow public read bot_welcome_settings" 
ON public.bot_welcome_settings 
FOR SELECT 
USING (true);

-- Allow admins to update settings
CREATE POLICY "Allow admins to update bot_welcome_settings" 
ON public.bot_welcome_settings 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow admins to insert settings
CREATE POLICY "Allow admins to insert bot_welcome_settings" 
ON public.bot_welcome_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
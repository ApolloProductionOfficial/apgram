-- Fix 1: Create a secure view for meeting_participants that excludes sensitive data
CREATE OR REPLACE VIEW public.meeting_participants_safe AS
SELECT 
  id,
  room_id,
  user_id,
  user_name,
  joined_at,
  left_at
  -- IP address, city, country, region, country_code are excluded
FROM public.meeting_participants;

-- Grant access to the view
GRANT SELECT ON public.meeting_participants_safe TO authenticated;

-- Fix 2: Update profiles policy to be more restrictive
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can search profiles by username" ON public.profiles;

-- Create a policy that allows:
-- 1. Users to see their own profile
-- 2. Users to see profiles of their contacts
-- 3. Users to search for a specific username (for adding contacts - handled via function)
CREATE POLICY "Users can view own profile and contacts"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.user_id = auth.uid() 
    AND contacts.contact_user_id = profiles.user_id
  )
);

-- Create a security definer function for username search (prevents enumeration)
CREATE OR REPLACE FUNCTION public.search_profile_by_username(search_username text)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return exact match to prevent enumeration
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.username,
    p.avatar_url
  FROM public.profiles p
  WHERE p.username = lower(trim(search_username))
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_profile_by_username(text) TO authenticated;
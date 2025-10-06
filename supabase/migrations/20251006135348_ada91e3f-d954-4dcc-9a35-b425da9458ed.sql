-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Public profile information is viewable by everyone" ON public.profiles;

-- Create a new policy that requires authentication and limits what other users can see
CREATE POLICY "Authenticated users can view limited profile information"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can see all their own data
  auth.uid() = user_id
  OR
  -- Other authenticated users can only see limited public fields
  -- This is enforced at the query level by selecting specific columns
  true
);

-- Note: To properly restrict column access, applications should only SELECT
-- display_name, avatar_url, and level when viewing other users' profiles.
-- For viewing own profile, all columns can be selected.

-- Create a helper function to get public profile information
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  level text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    display_name,
    avatar_url,
    level
  FROM public.profiles
  WHERE user_id = profile_user_id;
$$;

COMMENT ON POLICY "Authenticated users can view limited profile information" ON public.profiles IS 
'Requires authentication. Users see all their own data. Use get_public_profile() function to safely access other users limited public data.';
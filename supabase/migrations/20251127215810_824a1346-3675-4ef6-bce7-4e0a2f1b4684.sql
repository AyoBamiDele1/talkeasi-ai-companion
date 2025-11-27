-- Remove the overly permissive SELECT policy that allows viewing any user's profile
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.profiles;

-- The existing "Users can view own full profile" policy already restricts properly
-- It uses: (auth.uid() = user_id) which only allows users to see their own profile

-- Add a comment to document this security decision
COMMENT ON POLICY "Users can view own full profile" ON public.profiles IS 
'Users can only view their own profile data. Public profile data should be accessed via the get_public_profile() function.';
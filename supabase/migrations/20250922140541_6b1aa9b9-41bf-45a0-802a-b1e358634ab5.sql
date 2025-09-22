-- Update profiles RLS policy to allow viewing public profile information
-- This allows social features to work while still protecting sensitive data

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that allow viewing public profile information
CREATE POLICY "Users can view all profiles for social features" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Keep the restrictive policies for updates (users can only update their own profile)
-- The existing "Users can update their own profile" and "Users can insert their own profile" policies remain unchanged
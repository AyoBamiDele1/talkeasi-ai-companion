-- Check current policies on profiles table and fix the RLS issue
-- First, let's see what policies exist

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles for social features" ON public.profiles;

-- Create a new policy that allows viewing public profile information for social features
CREATE POLICY "Public profile information is viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);
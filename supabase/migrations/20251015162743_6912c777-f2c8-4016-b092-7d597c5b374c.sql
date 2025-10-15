-- Fix 1: Restrict community_posts, post_comments, and post_likes to authenticated users only
-- This prevents unauthenticated tracking of user activity and content scraping

DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
CREATE POLICY "Authenticated users can view community posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Authenticated users can view comments"
ON public.post_comments FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view likes"
ON public.post_likes FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix 2: Create user roles system for admin protection
-- This implements proper role-based access control for content management

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add admin-only policies to lessons table
CREATE POLICY "Admins can insert lessons"
ON public.lessons FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lessons"
ON public.lessons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lessons"
ON public.lessons FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apply same admin protection to achievements table
CREATE POLICY "Admins can insert achievements"
ON public.achievements FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update achievements"
ON public.achievements FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete achievements"
ON public.achievements FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
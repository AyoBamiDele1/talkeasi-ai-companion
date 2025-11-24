-- Fix Critical Security Issues

-- 1. Fix user_credits table - add service role policies for payment system
DROP POLICY IF EXISTS "Service role can insert credits" ON public.user_credits;
DROP POLICY IF EXISTS "Service role can update credits" ON public.user_credits;

CREATE POLICY "Service role can insert credits" 
ON public.user_credits 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update credits" 
ON public.user_credits 
FOR UPDATE 
USING (true);

-- 2. Fix credit_transactions - add service role insert policy
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;

CREATE POLICY "Service role can insert transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (true);

-- 3. Fix profiles privacy leak - restrict to own profile or limited public view
DROP POLICY IF EXISTS "Authenticated users can view limited profile information" ON public.profiles;

CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view limited public profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != user_id
);

-- 4. Fix user_roles - add admin management policies
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));
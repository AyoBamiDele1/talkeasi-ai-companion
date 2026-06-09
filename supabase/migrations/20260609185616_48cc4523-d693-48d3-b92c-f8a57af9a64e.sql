-- 1. credit_gifts: hide gift_code and recipient_email columns from clients.
-- All gift creation/listing/claiming goes through the gift-credits edge function
-- (service_role), which bypasses these column restrictions.
REVOKE SELECT (gift_code, recipient_email) ON public.credit_gifts FROM authenticated;
REVOKE SELECT (gift_code, recipient_email) ON public.credit_gifts FROM anon;

-- 2. user_achievements: restrict write policies to authenticated users only.
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.user_achievements FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. SECURITY DEFINER functions: remove direct EXECUTE access from anon/authenticated.
-- Trigger functions run with table-owner privileges regardless, and edge functions
-- use service_role. Only check_milestones is called directly by the client.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.check_milestones(uuid) TO authenticated;
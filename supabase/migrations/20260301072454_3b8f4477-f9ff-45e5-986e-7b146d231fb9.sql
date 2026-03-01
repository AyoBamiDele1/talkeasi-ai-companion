
-- Fix overly permissive RLS policies on service-role-intended tables
-- Service role bypasses RLS, so these policies should DENY regular users

-- 1. user_credits: INSERT and UPDATE should deny regular users
DROP POLICY IF EXISTS "Service role can insert credits" ON public.user_credits;
CREATE POLICY "Service role can insert credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role can update credits" ON public.user_credits;
CREATE POLICY "Service role can update credits"
  ON public.user_credits FOR UPDATE
  USING (false);

-- 2. credit_transactions: INSERT should deny regular users
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;
CREATE POLICY "Service role can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (false);

-- 3. user_memories: INSERT and UPDATE should deny regular users
DROP POLICY IF EXISTS "Service role can insert memories" ON public.user_memories;
CREATE POLICY "Service role can insert memories"
  ON public.user_memories FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role can update memories" ON public.user_memories;
CREATE POLICY "Service role can update memories"
  ON public.user_memories FOR UPDATE
  USING (false);

-- 4. user_milestones: INSERT should deny regular users
DROP POLICY IF EXISTS "Service role can insert milestones" ON public.user_milestones;
CREATE POLICY "Service role can insert milestones"
  ON public.user_milestones FOR INSERT
  WITH CHECK (false);

-- 5. payment_rate_limits: ALL should deny regular users
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.payment_rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON public.payment_rate_limits FOR ALL
  USING (false)
  WITH CHECK (false);

-- 6. credit_purchases: INSERT should deny regular users
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.credit_purchases;
CREATE POLICY "Service role can insert purchases"
  ON public.credit_purchases FOR INSERT
  WITH CHECK (false);

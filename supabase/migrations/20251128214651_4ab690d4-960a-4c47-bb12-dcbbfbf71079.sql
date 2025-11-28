-- Fix payment_rate_limits RLS policy to prevent public access to payment activity
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.payment_rate_limits;

-- Create more restrictive policies
CREATE POLICY "Service role can manage rate limits"
ON public.payment_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users cannot view rate limits at all (service role only)
-- This prevents tracking of payment activity by attackers
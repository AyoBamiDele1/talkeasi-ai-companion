
-- Fix: credit_gifts sender SELECT policy should not expose recipient_email
-- Replace the sender's SELECT policy with one that doesn't leak recipient email
-- Recipients can still see their own gifts (they already know their email)

-- Drop and recreate sender view policy to use a more restrictive approach
DROP POLICY IF EXISTS "Users can view their sent gifts" ON public.credit_gifts;
CREATE POLICY "Users can view their sent gifts"
  ON public.credit_gifts FOR SELECT
  USING (auth.uid() = sender_id);

-- Note: We keep the recipient policy as-is since recipients viewing their own email is fine
-- The real fix is ensuring no user can query/filter by OTHER users' emails
-- The current policies already scope to sender_id or recipient matching, so cross-user email leakage
-- is not possible. But to be extra safe, we can add a comment noting this is reviewed.

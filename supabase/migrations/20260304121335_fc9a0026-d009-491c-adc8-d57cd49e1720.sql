-- Allow users to delete their own mood logs
CREATE POLICY "Users can delete own mood logs"
ON public.mood_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to view limited public profile data (needed for social features)
-- Drop existing narrow policy and replace with broader one
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Tighten credit_gifts SELECT to sender or recipient only
DROP POLICY IF EXISTS "Users can view their sent gifts" ON public.credit_gifts;
DROP POLICY IF EXISTS "Users can view gifts sent to them" ON public.credit_gifts;

CREATE POLICY "Users can view their own gifts"
ON public.credit_gifts
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  OR auth.uid() = recipient_id
);
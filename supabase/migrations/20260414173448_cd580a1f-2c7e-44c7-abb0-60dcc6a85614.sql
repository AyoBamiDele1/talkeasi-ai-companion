-- Fix friendship self-approval: only the addressee can update (accept/reject) a friendship request
DROP POLICY IF EXISTS "Users can update friendships involving them" ON public.friendships;

CREATE POLICY "Only addressee can update friendship status"
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

-- 1. Fix profiles: remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- 2. Add DELETE policy for profiles
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Add DELETE policy for user_memories
CREATE POLICY "Users can delete own memories"
  ON public.user_memories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Add DELETE policy for user_milestones
CREATE POLICY "Users can delete own milestones"
  ON public.user_milestones FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Fix credit_gifts SELECT: replace single policy with scoped ones
DROP POLICY IF EXISTS "Users can view their own gifts" ON public.credit_gifts;

CREATE POLICY "Senders can view their sent gifts"
  ON public.credit_gifts FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Recipients can view their received gifts"
  ON public.credit_gifts FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

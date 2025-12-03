-- Phase 1: Milestones System
CREATE TABLE public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  celebrated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_type)
);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones" ON public.user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert milestones" ON public.user_milestones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own milestones" ON public.user_milestones
  FOR UPDATE USING (auth.uid() = user_id);

-- Add first_conversation_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_conversation_at TIMESTAMPTZ;

-- Phase 2: Conversation Memory System
CREATE TABLE public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  importance INTEGER DEFAULT 5,
  last_referenced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON public.user_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert memories" ON public.user_memories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update memories" ON public.user_memories
  FOR UPDATE USING (true);

CREATE INDEX idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX idx_user_memories_importance ON public.user_memories(user_id, importance DESC);

-- Phase 2: Mood Tracking
CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_before INTEGER,
  mood_after INTEGER,
  conversation_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood logs" ON public.mood_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs" ON public.mood_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs" ON public.mood_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_mood_logs_user_date ON public.mood_logs(user_id, created_at DESC);

-- Phase 3: Push Notifications
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  streak_reminders BOOLEAN DEFAULT true,
  mia_checkins BOOLEAN DEFAULT true,
  milestone_celebrations BOOLEAN DEFAULT true,
  preferred_time TEXT DEFAULT '19:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to check and unlock milestones
CREATE OR REPLACE FUNCTION public.check_milestones(target_user_id UUID)
RETURNS TABLE(milestone_type TEXT, is_new BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_minutes INTEGER;
  conversation_count INTEGER;
  current_streak_val INTEGER;
  first_convo TIMESTAMPTZ;
  days_since_signup INTEGER;
BEGIN
  -- Get user stats
  SELECT 
    COALESCE(SUM(CASE WHEN metadata->>'duration_minutes' IS NOT NULL 
      THEN (metadata->>'duration_minutes')::INTEGER ELSE 0 END), 0),
    COUNT(*)
  INTO total_minutes, conversation_count
  FROM credit_transactions
  WHERE user_id = target_user_id AND type = 'usage';

  SELECT p.current_streak, p.first_conversation_at
  INTO current_streak_val, first_convo
  FROM profiles p
  WHERE p.user_id = target_user_id;

  -- Calculate days since signup
  IF first_convo IS NOT NULL THEN
    days_since_signup := EXTRACT(DAY FROM (now() - first_convo));
  ELSE
    days_since_signup := 0;
  END IF;

  -- Check first conversation
  IF conversation_count >= 1 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'first_conversation')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- Check talk time milestones
  IF total_minutes >= 10 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'talk_time_10')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF total_minutes >= 30 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'talk_time_30')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF total_minutes >= 60 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'talk_time_60')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF total_minutes >= 100 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'talk_time_100')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- Check streak milestones
  IF current_streak_val >= 3 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'streak_3')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF current_streak_val >= 7 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'streak_7')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF current_streak_val >= 14 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'streak_14')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF current_streak_val >= 30 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'streak_30')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- Check anniversary milestones
  IF days_since_signup >= 7 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'anniversary_week')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  IF days_since_signup >= 30 THEN
    INSERT INTO user_milestones (user_id, milestone_type)
    VALUES (target_user_id, 'anniversary_month')
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;

  -- Return uncelebrated milestones
  RETURN QUERY
  SELECT um.milestone_type, NOT um.celebrated as is_new
  FROM user_milestones um
  WHERE um.user_id = target_user_id AND NOT um.celebrated;
END;
$$;
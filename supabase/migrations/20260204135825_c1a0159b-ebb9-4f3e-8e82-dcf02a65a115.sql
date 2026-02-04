CREATE OR REPLACE FUNCTION public.check_milestones(target_user_id uuid)
 RETURNS TABLE(milestone_type text, is_new boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_minutes INTEGER;
  conversation_count INTEGER;
  current_streak_val INTEGER;
  first_convo TIMESTAMPTZ;
  days_since_signup INTEGER;
BEGIN
  -- Get user stats
  -- NOTE: duration_minutes in metadata may be stored as a decimal string from older clients.
  -- Parse safely and round down to whole minutes to avoid 22P02 cast errors.
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN (metadata->>'duration_minutes') IS NULL THEN 0
        WHEN (metadata->>'duration_minutes') ~ '^[0-9]+(\\.[0-9]+)?$' THEN floor((metadata->>'duration_minutes')::numeric)::integer
        ELSE 0
      END
    ), 0),
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
$function$;
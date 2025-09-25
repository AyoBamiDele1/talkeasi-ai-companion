-- Create function to calculate real consecutive streak
CREATE OR REPLACE FUNCTION public.calculate_user_streak(check_user_id uuid)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    activity_date DATE;
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    temp_streak INTEGER := 0;
    previous_date DATE;
    date_diff INTEGER;
BEGIN
    -- Get all unique activity dates for the user, ordered by date descending
    FOR activity_date IN 
        SELECT DISTINCT DATE(completed_at) as activity_date
        FROM user_progress 
        WHERE user_id = check_user_id 
        AND completed_at IS NOT NULL
        ORDER BY activity_date DESC
    LOOP
        IF previous_date IS NULL THEN
            -- First iteration
            temp_streak := 1;
            current_streak_count := 1;
        ELSE
            -- Calculate days between current and previous date
            date_diff := previous_date - activity_date;
            
            IF date_diff = 1 THEN
                -- Consecutive day
                temp_streak := temp_streak + 1;
                
                -- Update current streak only if this is the most recent streak
                IF current_streak_count > 0 THEN
                    current_streak_count := temp_streak;
                END IF;
            ELSE
                -- Gap in streak
                current_streak_count := 0; -- Reset current streak since there's a gap
                temp_streak := 1; -- Start new streak
            END IF;
        END IF;
        
        -- Track longest streak
        IF temp_streak > longest_streak_count THEN
            longest_streak_count := temp_streak;
        END IF;
        
        previous_date := activity_date;
    END LOOP;
    
    -- Check if current streak should be reset (no activity today or yesterday)
    IF current_streak_count > 0 THEN
        SELECT DISTINCT DATE(completed_at) INTO activity_date
        FROM user_progress 
        WHERE user_id = check_user_id 
        AND completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 1;
        
        IF activity_date IS NULL OR (CURRENT_DATE - activity_date) > 1 THEN
            current_streak_count := 0;
        END IF;
    END IF;
    
    RETURN QUERY SELECT current_streak_count, longest_streak_count;
END;
$$;

-- Create function to update user streaks
CREATE OR REPLACE FUNCTION public.update_user_streaks(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    calc_current_streak INTEGER;
    calc_longest_streak INTEGER;
    last_activity DATE;
BEGIN
    -- Calculate streaks
    SELECT current_streak, longest_streak 
    INTO calc_current_streak, calc_longest_streak
    FROM public.calculate_user_streak(target_user_id);
    
    -- Get last activity date
    SELECT MAX(DATE(completed_at)) INTO last_activity
    FROM user_progress 
    WHERE user_id = target_user_id 
    AND completed_at IS NOT NULL;
    
    -- Update profile with calculated values
    UPDATE public.profiles 
    SET current_streak = COALESCE(calc_current_streak, 0),
        longest_streak = COALESCE(calc_longest_streak, 0),
        last_activity_date = last_activity,
        streak_updated_at = now()
    WHERE user_id = target_user_id;
END;
$$;

-- Create trigger to update streaks when progress is added
CREATE OR REPLACE FUNCTION public.handle_progress_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.completed_at IS NOT NULL THEN
        -- Update streaks for the user
        PERFORM public.update_user_streaks(NEW.user_id);
        
        -- Check achievements (updated function will use real streak data)
        PERFORM public.check_user_achievements(NEW.user_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_streaks_on_progress ON public.user_progress;
CREATE TRIGGER update_streaks_on_progress
    AFTER INSERT OR UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_progress_update();

-- Update the achievement checking function to use real streak data
CREATE OR REPLACE FUNCTION public.check_user_achievements(check_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    achievement_record RECORD;
    user_lessons_completed INTEGER;
    user_current_streak INTEGER;
    user_longest_streak INTEGER;
    user_accuracy_avg DECIMAL;
    user_total_sessions INTEGER;
    achievement_met BOOLEAN;
BEGIN
    -- Get user stats
    SELECT 
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
        AVG(CASE WHEN accuracy_score IS NOT NULL THEN accuracy_score END),
        COUNT(*)
    INTO user_lessons_completed, user_accuracy_avg, user_total_sessions
    FROM user_progress 
    WHERE user_id = check_user_id;
    
    -- Get real streak data from profiles
    SELECT current_streak, longest_streak
    INTO user_current_streak, user_longest_streak
    FROM profiles
    WHERE user_id = check_user_id;
    
    user_current_streak := COALESCE(user_current_streak, 0);
    user_longest_streak := COALESCE(user_longest_streak, 0);
    
    -- Check each achievement
    FOR achievement_record IN 
        SELECT a.* FROM achievements a
        WHERE a.id NOT IN (
            SELECT achievement_id FROM user_achievements 
            WHERE user_id = check_user_id
        )
    LOOP
        achievement_met := false;
        
        CASE achievement_record.requirement_type
            WHEN 'lessons_completed' THEN
                achievement_met := user_lessons_completed >= achievement_record.requirement_value;
            WHEN 'streak_days' THEN
                achievement_met := user_current_streak >= achievement_record.requirement_value;
            WHEN 'longest_streak' THEN
                achievement_met := user_longest_streak >= achievement_record.requirement_value;
            WHEN 'accuracy_avg' THEN
                achievement_met := COALESCE(user_accuracy_avg, 0) >= achievement_record.requirement_value;
            WHEN 'total_sessions' THEN
                achievement_met := user_total_sessions >= achievement_record.requirement_value;
        END CASE;
        
        -- Unlock achievement if met
        IF achievement_met THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (check_user_id, achievement_record.id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$;

-- Initialize streaks for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT user_id FROM profiles LOOP
        PERFORM public.update_user_streaks(user_record.user_id);
    END LOOP;
END $$;